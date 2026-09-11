import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  atualizarProdutora,
  criarProdutora,
  fetchClientes,
  fetchProdutoras,
  type Produtora,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/produtoras/")({
  head: () => ({
    meta: [
      { title: "Produtoras · CRM Empório 56" },
      { name: "description", content: "Lista e cadastro de produtoras vinculadas aos clientes." },
      { property: "og:title", content: "Produtoras · CRM Empório 56" },
      { property: "og:description", content: "Consulte e atualize as produtoras do CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Produtoras,
});

function Produtoras() {
  const qc = useQueryClient();
  const produtoras = useQuery({ queryKey: ["produtoras"], queryFn: fetchProdutoras });
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [editando, setEditando] = useState<Produtora | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (produtoras.data ?? []).filter(
      (p) =>
        !termo || p.nome.toLowerCase().includes(termo) || (p.contato ?? "").toLowerCase().includes(termo),
    );
  }, [busca, produtoras.data]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (editando) {
        await atualizarProdutora(editando.id, { nome, contato: contato || null });
        return "editada";
      }
      await criarProdutora(nome, contato);
      return "criada";
    },
    onSuccess: (acao) => {
      toast.success(acao === "editada" ? "Produtora atualizada." : "Produtora cadastrada.");
      setNome("");
      setContato("");
      setEditando(null);
      setFormAberto(false);
      qc.invalidateQueries({ queryKey: ["produtoras"] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function abrirEdicao(produtora: Produtora) {
    setEditando(produtora);
    setNome(produtora.nome);
    setContato(produtora.contato ?? "");
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setEditando(null);
    setNome("");
    setContato("");
  }

  return (
    <AppShell>
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
            (d) · Relacionamentos
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight">Produtoras</h1>
          <p className="mt-2 max-w-[52ch] text-pretty text-ink-soft">
            {produtoras.data?.length ?? 0} produtoras cadastradas e seus contatos vinculados.
          </p>
        </div>
        <Button size="sm" onClick={() => (formAberto ? fecharForm() : setFormAberto(true))}>
          {formAberto ? "Fechar" : "Nova produtora"}
        </Button>
      </header>

      {formAberto && (
        <form
          className="rise mt-5 grid gap-3 border-y border-line bg-surface px-4 py-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nome.trim()) {
              toast.error("Informe o nome da produtora.");
              return;
            }
            salvar.mutate();
          }}
        >
          <Field label="Nome">
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Contato">
            <input value={contato} onChange={(e) => setContato(e.target.value)} className={inputClass} />
          </Field>
          <Button type="submit" size="sm" disabled={salvar.isPending}>
            {editando ? "Salvar alterações" : "Cadastrar produtora"}
          </Button>
        </form>
      )}

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou contato"
        aria-label="Buscar produtoras"
        className="mt-5 w-full max-w-sm rounded-md border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-ember"
      />

      <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface ring-1 ring-black/5">
        <div className="hidden grid-cols-[1.5fr_1.2fr_0.5fr_0.5fr] gap-3 border-b border-line bg-black/[0.02] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint md:grid">
          <span>Produtora</span><span>Contato</span><span>Clientes</span><span className="text-right">Ação</span>
        </div>
        {lista.map((p) => {
          const total = (clientes.data ?? []).filter((c) => c.produtora_id === p.id).length;
          return (
            <div key={p.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid md:grid-cols-[1.5fr_1.2fr_0.5fr_0.5fr]">
              <Link to="/produtoras/$id" params={{ id: p.id }} className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight hover:text-ember">
                {p.nome}
              </Link>
              <span className="hidden truncate font-mono text-[12px] text-ink-soft md:block">{p.contato ?? "—"}</span>
              <span className="hidden font-mono text-[12px] text-ink-soft md:block">{total}</span>
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => abrirEdicao(p)}>Editar</Button>
              </div>
            </div>
          );
        })}
        {lista.length === 0 && <p className="px-4 py-6 font-mono text-[12px] text-faint">Nenhuma produtora encontrada.</p>}
      </section>
    </AppShell>
  );
}

const inputClass = "w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span><div className="mt-1">{children}</div></label>;
}