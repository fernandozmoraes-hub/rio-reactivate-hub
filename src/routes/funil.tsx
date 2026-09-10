import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ClassChip } from "@/components/ClassChip";
import {
  ESTAGIOS,
  SUGESTOES_ACAO,
  diasSemContato,
  fetchClientes,
  moverEstagio,
  ordenarPorPrioridade,
  salvarProximaAcao,
  type Cliente,
} from "@/lib/crm";

export const Route = createFileRoute("/funil")({
  head: () => ({
    meta: [
      { title: "Funil · CRM Empório 56" },
      {
        name: "description",
        content:
          "Funil kanban da Empório 56: arraste clientes entre reativar, contato feito, proposta e fechado.",
      },
      { property: "og:title", content: "Funil · CRM Empório 56" },
      {
        property: "og:description",
        content: "Acompanhe o estágio de cada cliente e defina a próxima ação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Funil,
});

function Funil() {
  const qc = useQueryClient();
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);

  const mover = useMutation({
    mutationFn: (v: { id: string; de: string | null; para: string }) =>
      moverEstagio(v.id, v.de, v.para),
    onSuccess: () => {
      toast.success("Estágio atualizado.");
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lista = ordenarPorPrioridade(clientes.data ?? []);

  return (
    <AppShell>
      <header className="rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
          (c) · Funil kanban
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">Funil</h1>
        <p className="mt-2 max-w-[56ch] text-pretty text-ink-soft">
          Arraste o cartão para outra coluna. A data da mudança de estágio é registrada
          automaticamente.
        </p>
      </header>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-4">
        {ESTAGIOS.map((col) => {
          const cards = lista.filter((c) => (c.estagio ?? "reativar") === col.id);
          return (
            <section
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setAlvo(col.id);
              }}
              onDragLeave={() => setAlvo((a) => (a === col.id ? null : a))}
              onDrop={(e) => {
                e.preventDefault();
                setAlvo(null);
                const id = arrastando ?? e.dataTransfer.getData("text/plain");
                setArrastando(null);
                const cliente = lista.find((c) => c.id === id);
                if (!cliente || (cliente.estagio ?? "reativar") === col.id) return;
                mover.mutate({ id, de: cliente.estagio ?? null, para: col.id });
              }}
              className={`w-[264px] shrink-0 rounded-xl border bg-surface p-3 ${
                alvo === col.id ? "border-ember bg-ember/[0.04]" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold tracking-tight">{col.label}</h2>
                <span className="font-mono text-[11px] text-faint">{cards.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {cards.map((c) => (
                  <Card
                    key={c.id}
                    cliente={c}
                    onDragStart={() => setArrastando(c.id)}
                    onDragEnd={() => setArrastando(null)}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center font-mono text-[11px] text-faint">
                    vazio
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

function Card({
  cliente,
  onDragStart,
  onDragEnd,
}: {
  cliente: Cliente;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const qc = useQueryClient();
  const dias = diasSemContato(cliente);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(cliente.proxima_acao ?? "");

  const salvar = useMutation({
    mutationFn: (valor: string) => salvarProximaAcao(cliente.id, valor),
    onSuccess: () => {
      setEditando(false);
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", cliente.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="cursor-grab rounded-lg border border-line bg-paper p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/clientes/$id"
          params={{ id: cliente.id }}
          className="min-w-0 truncate text-[13px] font-semibold tracking-tight hover:text-ember"
        >
          {cliente.nome}
        </Link>
        <ClassChip value={cliente.classificacao} />
      </div>
      <p className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">
        {cliente.produtoras?.nome ?? "Sem produtora"}
      </p>
      <p
        className={`mt-1 font-mono text-[11px] ${(dias ?? 0) >= 60 ? "text-ember" : "text-faint"}`}
      >
        {dias ?? "—"} dias sem contato
      </p>

      {editando ? (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1">
            {SUGESTOES_ACAO.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTexto(s)}
                className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-soft hover:bg-black/5"
              >
                {s}
              </button>
            ))}
          </div>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Próxima ação"
            className="mt-2 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-ember"
          />
          <div className="mt-1.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTexto(cliente.proxima_acao ?? "");
                setEditando(false);
              }}
              className="rounded-md px-2 py-1 text-[11px] text-ink-soft hover:bg-black/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvar.isPending}
              onClick={() => salvar.mutate(texto.trim())}
              className="rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-paper disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-2 w-full rounded-md border border-dashed border-ink/20 px-2 py-1.5 text-left text-[12px] text-ink-soft hover:bg-black/5"
        >
          {cliente.proxima_acao ? `→ ${cliente.proxima_acao}` : "Definir próxima ação"}
        </button>
      )}
    </article>
  );
}
