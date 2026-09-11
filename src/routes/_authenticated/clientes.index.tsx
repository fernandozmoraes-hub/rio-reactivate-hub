import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ClassChip } from "@/components/ClassChip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  diasSemContato,
  criarProdutora,
  fetchClientes,
  fetchProdutoras,
  formatarData,
  linkWhatsApp,
  ordenarPorPrioridade,
  type Classificacao,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes · CRM Empório 56" },
      {
        name: "description",
        content: "Base de clientes da Empório 56 com produtora, classificação e dias sem contato.",
      },
      { property: "og:title", content: "Clientes · CRM Empório 56" },
      {
        property: "og:description",
        content: "Todos os clientes cadastrados, com busca e filtro por classificação.",
      },
    ],
  }),
  component: Clientes,
});

const VAZIO = {
  nome: "",
  produtora_id: "",
  whatsapp: "",
  email: "",
  classificacao: "B" as Classificacao,
  status: "ativo",
  ultimo_contato: "",
  ultimo_trabalho: "",
  ultimo_projeto: "",
  observacoes: "",
};

function Clientes() {
  const qc = useQueryClient();
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const produtoras = useQuery({ queryKey: ["produtoras"], queryFn: fetchProdutoras });

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | Classificacao>("todos");
  const [form, setForm] = useState(VAZIO);
  const [aberto, setAberto] = useState(false);
  const [novaProdutoraAberta, setNovaProdutoraAberta] = useState(false);
  const [novaProdutoraNome, setNovaProdutoraNome] = useState("");
  const [novaProdutoraContato, setNovaProdutoraContato] = useState("");

  const lista = useMemo(() => {
    const base = ordenarPorPrioridade(clientes.data ?? []);
    return base.filter((c) => {
      const okFiltro = filtro === "todos" || c.classificacao === filtro;
      const termo = busca.trim().toLowerCase();
      const okBusca =
        !termo ||
        c.nome.toLowerCase().includes(termo) ||
        (c.produtoras?.nome ?? "").toLowerCase().includes(termo) ||
        (c.email ?? "").toLowerCase().includes(termo);
      return okFiltro && okBusca;
    });
  }, [clientes.data, busca, filtro]);

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clientes").insert({
        nome: form.nome,
        produtora_id: form.produtora_id || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        classificacao: form.classificacao,
        status: form.status,
        ultimo_contato: form.ultimo_contato || null,
        ultimo_trabalho: form.ultimo_trabalho || null,
        ultimo_projeto: form.ultimo_projeto || null,
        observacoes: form.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado.");
      setForm(VAZIO);
      setAberto(false);
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criarProdutoraRapido = useMutation({
    mutationFn: () => criarProdutora(novaProdutoraNome, novaProdutoraContato),
    onSuccess: (nova) => {
      qc.setQueryData(["produtoras"], (atuais: typeof produtoras.data) =>
        [...(atuais ?? []), nova].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setForm((atual) => ({ ...atual, produtora_id: nova.id }));
      setNovaProdutoraNome("");
      setNovaProdutoraContato("");
      setNovaProdutoraAberta(false);
      toast.success("Produtora cadastrada e selecionada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
            (b) · Base completa
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight">Clientes</h1>
          <p className="mt-2 max-w-[52ch] text-pretty text-ink-soft">
            {clientes.data?.length ?? 0} clientes cadastrados. A ordem segue a mesma prioridade da
            fila de reativação.
          </p>
        </div>
        <button
          onClick={() => setAberto((v) => !v)}
          className="rounded-md bg-ink px-3 py-2 text-[12px] font-medium text-paper"
        >
          {aberto ? "Fechar" : "Novo cliente"}
        </button>
      </header>

      {aberto && (
        <form
          className="rise mt-5 grid gap-3 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nome.trim()) {
              toast.error("Informe o nome do cliente.");
              return;
            }
            criar.mutate();
          }}
        >
          <Campo label="Nome">
            <Input value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          </Campo>
          <Campo label="Produtora">
            <select
              value={form.produtora_id}
              onChange={(e) => {
                if (e.target.value === "__nova__") {
                  setNovaProdutoraAberta(true);
                  return;
                }
                setNovaProdutoraAberta(false);
                setForm({ ...form, produtora_id: e.target.value });
              }}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
            >
              <option value="">Sem produtora</option>
              {(produtoras.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
              <option value="__nova__">Cadastrar nova produtora</option>
            </select>
            {novaProdutoraAberta && (
              <div className="mt-2 grid gap-2 rounded-md border border-line bg-paper p-3 sm:grid-cols-2">
                <input
                  value={novaProdutoraNome}
                  onChange={(e) => setNovaProdutoraNome(e.target.value)}
                  placeholder="Nome da produtora"
                  aria-label="Nome da nova produtora"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-ember"
                />
                <input
                  value={novaProdutoraContato}
                  onChange={(e) => setNovaProdutoraContato(e.target.value)}
                  placeholder="Contato (opcional)"
                  aria-label="Contato da nova produtora"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-ember"
                />
                <div className="flex gap-2 sm:col-span-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={criarProdutoraRapido.isPending}
                    onClick={() => {
                      if (!novaProdutoraNome.trim()) {
                        toast.error("Informe o nome da produtora.");
                        return;
                      }
                      criarProdutoraRapido.mutate();
                    }}
                  >
                    Cadastrar e selecionar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setNovaProdutoraAberta(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </Campo>
          <Campo label="WhatsApp (com DDI, ex 5511999998888)">
            <Input value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          </Campo>
          <Campo label="E-mail">
            <Input value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          </Campo>
          <Campo label="Classificação">
            <select
              value={form.classificacao}
              onChange={(e) =>
                setForm({ ...form, classificacao: e.target.value as Classificacao })
              }
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </Campo>
          <Campo label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
            >
              <option value="ativo">ativo</option>
              <option value="em contato">em contato</option>
              <option value="inativo">inativo</option>
              <option value="perdido">perdido</option>
            </select>
          </Campo>
          <Campo label="Data do último contato">
            <Input
              type="date"
              value={form.ultimo_contato}
              onChange={(v) => setForm({ ...form, ultimo_contato: v })}
            />
          </Campo>
          <Campo label="Data do último trabalho">
            <Input
              type="date"
              value={form.ultimo_trabalho}
              onChange={(v) => setForm({ ...form, ultimo_trabalho: v })}
            />
          </Campo>
          <Campo label="Nome do último projeto">
            <Input
              value={form.ultimo_projeto}
              onChange={(v) => setForm({ ...form, ultimo_projeto: v })}
            />
          </Campo>
          <Campo label="Observações">
            <Input
              value={form.observacoes}
              onChange={(v) => setForm({ ...form, observacoes: v })}
            />
          </Campo>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={criar.isPending}
              className="rounded-md bg-ember px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              Cadastrar cliente
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, produtora ou e-mail"
          className="w-full max-w-xs rounded-md border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-ember"
        />
        <div className="flex items-center gap-2">
          {(["todos", "A", "B", "C"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                filtro === f ? "bg-ink text-paper" : "border border-line text-ink-soft"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface ring-1 ring-black/5">
        <div className="hidden md:grid grid-cols-[1.6fr_1.1fr_0.5fr_0.7fr_0.9fr_1fr] gap-3 border-b border-line bg-black/[0.02] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          <span>Cliente / Produtora</span>
          <span>WhatsApp</span>
          <span>Clas.</span>
          <span>Dias</span>
          <span>Status</span>
          <span className="text-right">Ação rápida</span>
        </div>
        {lista.map((c) => {
          const dias = diasSemContato(c);
          const wa = linkWhatsApp(c.whatsapp);
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid md:grid-cols-[1.6fr_1.1fr_0.5fr_0.7fr_0.9fr_1fr]"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to="/clientes/$id"
                  params={{ id: c.id }}
                  className="block truncate text-[14px] font-semibold tracking-tight hover:text-ember"
                >
                  {c.nome}
                </Link>
                <p className="truncate font-mono text-[11px] text-ink-soft">
                  {c.produtoras?.nome ?? "Sem produtora"} · último trabalho{" "}
                  {formatarData(c.ultimo_trabalho)}
                </p>
              </div>
              <div className="hidden md:block truncate font-mono text-[12px] text-ink-soft">
                {c.whatsapp ?? "—"}
              </div>
              <div className="hidden md:block">
                <ClassChip value={c.classificacao} />
              </div>
              <div
                className={`hidden md:block font-mono text-[12px] ${
                  (dias ?? 0) >= 60 ? "text-ember" : ""
                }`}
              >
                {dias ?? "—"} <span className="text-faint">dias</span>
              </div>
              <div className="hidden md:block font-mono text-[11px] text-ink-soft">{c.status}</div>
              <div className="flex justify-end">
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-ink/20 px-3 py-1.5 text-[12px] font-medium"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="font-mono text-[11px] text-faint">sem número</span>
                )}
              </div>
            </div>
          );
        })}
        {lista.length === 0 && (
          <p className="px-4 py-6 font-mono text-[12px] text-faint">Nenhum cliente encontrado.</p>
        )}
      </section>
    </AppShell>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
    />
  );
}
