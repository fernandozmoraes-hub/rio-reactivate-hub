import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { ClassChip } from "@/components/ClassChip";
import {
  fetchClientesDaProdutora,
  fetchProdutora,
  formatarData,
  linkWhatsApp,
  rotuloEstagio,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/produtoras/$id")({
  head: () => ({
    meta: [
      { title: "Ficha da produtora · CRM Empório 56" },
      { name: "description", content: "Contatos vinculados à produtora no CRM Empório 56." },
      { property: "og:title", content: "Ficha da produtora · CRM Empório 56" },
      { property: "og:description", content: "Consulte os clientes e contatos vinculados à produtora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FichaProdutora,
});

function FichaProdutora() {
  const { id } = Route.useParams();
  const produtora = useQuery({ queryKey: ["produtora", id], queryFn: () => fetchProdutora(id) });
  const clientes = useQuery({ queryKey: ["clientes", "produtora", id], queryFn: () => fetchClientesDaProdutora(id) });

  if (produtora.isLoading || clientes.isLoading) {
    return <AppShell><p className="font-mono text-[12px] text-faint">Carregando produtora…</p></AppShell>;
  }

  if (!produtora.data) {
    return <AppShell><p className="text-[13px] text-ink-soft">Produtora não encontrada.</p></AppShell>;
  }

  return (
    <AppShell>
      <Link to="/produtoras" className="font-mono text-[11px] text-faint hover:text-ink">← voltar para produtoras</Link>
      <header className="rise mt-4 border-b border-line pb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">Produtora</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">{produtora.data.nome}</h1>
        <p className="mt-2 font-mono text-[12px] text-ink-soft">{produtora.data.contato ?? "Sem contato cadastrado"} · {clientes.data?.length ?? 0} contatos vinculados</p>
      </header>

      <section className="mt-5 overflow-hidden rounded-xl border border-line bg-surface ring-1 ring-black/5">
        <div className="hidden grid-cols-[1.35fr_1fr_0.45fr_0.8fr_0.8fr_1fr] gap-3 border-b border-line bg-black/[0.02] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint md:grid">
          <span>Contato</span><span>WhatsApp</span><span>Clas.</span><span>Último contato</span><span>Último trabalho</span><span>Funil</span>
        </div>
        {(clientes.data ?? []).map((c) => {
          const wa = linkWhatsApp(c.whatsapp);
          return (
            <div key={c.id} className="grid gap-2 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-[1.35fr_1fr_0.45fr_0.8fr_0.8fr_1fr] md:items-center md:gap-3">
              <Link to="/clientes/$id" params={{ id: c.id }} className="truncate text-[14px] font-semibold tracking-tight hover:text-ember">{c.nome}</Link>
              <div className="font-mono text-[12px] text-ink-soft">{wa ? <a href={wa} target="_blank" rel="noreferrer" className="hover:text-ember">{c.whatsapp}</a> : "—"}</div>
              <div><ClassChip value={c.classificacao} /></div>
              <span className="font-mono text-[12px] text-ink-soft">{formatarData(c.ultimo_contato)}</span>
              <span className="font-mono text-[12px] text-ink-soft">{formatarData(c.ultimo_trabalho)}</span>
              <span className="font-mono text-[11px] text-ink-soft">{rotuloEstagio(c.estagio)}</span>
            </div>
          );
        })}
        {clientes.data?.length === 0 && <p className="px-4 py-6 font-mono text-[12px] text-faint">Nenhum contato vinculado a esta produtora.</p>}
      </section>
    </AppShell>
  );
}