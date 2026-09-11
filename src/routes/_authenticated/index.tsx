import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { ClassChip } from "@/components/ClassChip";
import { RegistrarContatoRapido } from "@/components/RegistrarContatoRapido";
import {
  diasSemContato,
  fetchClientes,
  fetchOfertas,
  formatarData,
  linkWhatsApp,
  nomesProdutoras,
  ordenarPorPrioridade,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Reativação · CRM Empório 56" },
      {
        name: "description",
        content:
          "Fila diária de reativação da Empório 56: clientes A, B e C ordenados por tempo sem contato.",
      },
      { property: "og:title", content: "Reativação · CRM Empório 56" },
      {
        property: "og:description",
        content: "Clientes para contatar hoje, ordenados por prioridade.",
      },
    ],
  }),
  component: Reativacao,
});

function Reativacao() {
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const ofertas = useQuery({ queryKey: ["ofertas"], queryFn: fetchOfertas });

  const fila = ordenarPorPrioridade(clientes.data ?? []);
  const hoje = fila.slice(0, 10);
  const agendados = (clientes.data ?? [])
    .filter((c) => c.proximo_contato)
    .sort((a, b) => (a.proximo_contato! < b.proximo_contato! ? -1 : 1))
    .slice(0, 5);

  const agora = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <AppShell>
      <header className="rise">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
              (a) · Fila de trabalho
            </p>
            <h1 className="mt-1 text-[26px] font-bold tracking-tight text-balance">
              Clientes para contatar hoje
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 font-mono text-[11px] text-ink-soft">
            <span>{agora}</span>
            <span className="rounded-full border border-line px-2.5 py-1">
              Hoje · {hoje.length}
            </span>
          </div>
        </div>
        <p className="mt-2 max-w-[52ch] text-pretty text-ink-soft">
          Ordem automática por prioridade: classificação A com mais tempo sem contato primeiro,
          depois B e C. Dias calculados pela última interação.
        </p>
      </header>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-paper">
            A
          </span>
          <span className="rounded-full border border-ink/25 px-2.5 py-1 text-[11px] font-medium">
            B
          </span>
          <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft">
            C
          </span>
        </div>
        <span className="font-mono text-[11px] text-faint">
          Prioridade A › B › C · dias sem contato
        </span>
      </div>

      <section className="mt-4 rounded-xl border border-line bg-surface ring-1 ring-black/5">
        <div className="hidden md:grid grid-cols-[1.6fr_1.1fr_0.5fr_0.7fr_1fr_1fr] gap-3 border-b border-line bg-black/[0.02] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          <span>Cliente / Produtora</span>
          <span>WhatsApp</span>
          <span>Clas.</span>
          <span>Dias</span>
          <span>Último trabalho</span>
          <span className="text-right">Ação rápida</span>
        </div>

        {clientes.isLoading ? (
          <p className="px-4 py-6 font-mono text-[12px] text-faint">Carregando fila…</p>
        ) : hoje.length === 0 ? (
          <p className="px-4 py-6 font-mono text-[12px] text-faint">
            Nenhum cliente cadastrado ainda.
          </p>
        ) : (
          hoje.map((c, i) => {
            const dias = diasSemContato(c);
            const urgente = c.classificacao === "A" || (dias ?? 0) >= 60;
            const wa = linkWhatsApp(
              c.whatsapp,
              `Oi ${c.nome.split(" ")[0]}, aqui é da Empório 56!`,
            );
            return (
              <div
                key={c.id}
                className="rise flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid md:grid-cols-[1.6fr_1.1fr_0.5fr_0.7fr_1fr_1fr]"
                style={{ animationDelay: `${40 * (i + 1)}ms` }}
              >
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-md text-[11px] font-semibold ${
                      urgente ? "bg-ember/10 text-ember" : "bg-ink/[0.06]"
                    }`}
                  >
                    {c.classificacao}
                  </span>
                  <div className="min-w-0">
                    <Link
                      to="/clientes/$id"
                      params={{ id: c.id }}
                      className="block truncate text-[14px] font-semibold tracking-tight hover:text-ember"
                    >
                      {c.nome}
                    </Link>
                    <p className="truncate font-mono text-[11px] text-ink-soft">
                      {nomesProdutoras(c)}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block truncate font-mono text-[12px] text-ink-soft">
                  {c.whatsapp ?? "—"}
                </div>
                <div className="hidden md:block">
                  <ClassChip value={c.classificacao} />
                </div>
                <div
                  className={`hidden md:block font-mono text-[12px] font-medium ${
                    (dias ?? 0) >= 60 ? "text-ember" : ""
                  }`}
                >
                  {dias ?? "—"} <span className="text-faint">dias</span>
                </div>
                <div className="hidden md:block min-w-0">
                  <p className="truncate text-[13px]">{c.ultimo_projeto ?? "—"}</p>
                  <p className="truncate font-mono text-[11px] text-faint">
                    {formatarData(c.ultimo_trabalho)}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <RegistrarContatoRapido clienteId={c.id} nome={c.nome} />
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-md px-3 py-1.5 text-[12px] font-semibold ${
                        urgente
                          ? "bg-ember text-white"
                          : "border border-ink/20 font-medium text-ink"
                      }`}
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="font-mono text-[11px] text-faint">sem número</span>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div className="relative bg-black/[0.015] px-4 py-2.5">
          <div className="flex items-center justify-between font-mono text-[11px] text-ink-soft">
            <span>
              {hoje.length} de {fila.length} · fila A › B › C
            </span>
            <Link to="/clientes" className="text-faint hover:text-ink">
              ver todos os clientes
            </Link>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ember"
              style={{ width: `${fila.length ? (hoje.length / fila.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.55fr_1fr]">
        <section className="rise rounded-xl border border-line bg-surface p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Próximos contatos agendados</h2>
          <p className="mt-1 font-mono text-[11px] text-faint">
            {agendados.length} agendamento(s)
          </p>
          {agendados.length === 0 ? (
            <p className="mt-4 text-[13px] text-ink-soft">
              Nenhum agendamento. Abra a ficha de um cliente para agendar um novo contato.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-[13px]">
              {agendados.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-faint">
                    {formatarData(c.proximo_contato)}
                  </span>
                  <Link
                    to="/clientes/$id"
                    params={{ id: c.id }}
                    className="text-ink-soft hover:text-ember"
                  >
                    {c.nome}
                  </Link>
                  <ClassChip value={c.classificacao} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rise rounded-xl border border-line bg-surface p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Ofertas ativas</h2>
          <p className="mt-1 font-mono text-[11px] text-faint">
            Sem disparo · {ofertas.data?.length ?? 0} ativas
          </p>
          <ul className="mt-4 space-y-3">
            {(ofertas.data ?? []).slice(0, 3).map((o) => (
              <li key={o.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold tracking-tight">{o.nome}</p>
                  <span className="shrink-0 font-mono text-[10px] text-faint">
                    válido até {formatarData(o.validade)}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-pretty text-ink-soft">{o.descricao}</p>
              </li>
            ))}
          </ul>
          <Link
            to="/importar"
            className="mt-4 block w-full rounded-md border border-dashed border-ink/25 px-3 py-2 text-center text-[12px] font-medium text-ink-soft hover:bg-black/5"
          >
            Importar clientes (CSV)
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
