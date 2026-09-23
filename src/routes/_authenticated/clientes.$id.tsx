import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ClassChip } from "@/components/ClassChip";
import {
  agendarContato,
  criarTrabalho,
  definirProdutorasDoCliente,
  diasSemContato,
  fetchCliente,
  fetchInteracoes,
  fetchProdutoras,
  fetchTrabalhos,
  formatarData,
  hojeISO,
  linkWhatsApp,
  nomesProdutoras,
  produtorasDoCliente,
  registrarContato,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do cliente · CRM Empório 56" },
      {
        name: "description",
        content: "Ficha completa do cliente com histórico, trabalhos e ações de contato.",
      },
      { property: "og:title", content: "Ficha do cliente · CRM Empório 56" },
      {
        property: "og:description",
        content: "Registre contato, agende retorno e abra o WhatsApp do cliente.",
      },
    ],
  }),
  component: Ficha,
  errorComponent: ({ error }) => (
    <AppShell>
      <p role="alert" className="text-[13px] text-ember">
        {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-[13px] text-ink-soft">Cliente não encontrado.</p>
    </AppShell>
  ),
});

function Ficha() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const cliente = useQuery({ queryKey: ["cliente", id], queryFn: () => fetchCliente(id) });
  const interacoes = useQuery({
    queryKey: ["interacoes", id],
    queryFn: () => fetchInteracoes(id),
  });
  const trabalhos = useQuery({ queryKey: ["trabalhos", id], queryFn: () => fetchTrabalhos(id) });

  const [anotacao, setAnotacao] = useState("");
  const [canal, setCanal] = useState("whatsapp");
  const [dataAgenda, setDataAgenda] = useState("");

  const [nomeProjeto, setNomeProjeto] = useState("");
  const [produtoVendido, setProdutoVendido] = useState("");
  const [valorTrabalho, setValorTrabalho] = useState("");
  const [dataTrabalho, setDataTrabalho] = useState(hojeISO());
  const [obsTrabalho, setObsTrabalho] = useState("");

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["cliente", id] });
    qc.invalidateQueries({ queryKey: ["interacoes", id] });
    qc.invalidateQueries({ queryKey: ["clientes"] });
  };

  const contato = useMutation({
    mutationFn: () => registrarContato({ clienteId: id, canal, anotacao }),
    onSuccess: () => {
      toast.success("Contato registrado.");
      setAnotacao("");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const agenda = useMutation({
    mutationFn: () => agendarContato(id, dataAgenda),
    onSuccess: () => {
      toast.success("Contato agendado.");
      setDataAgenda("");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const registrarTrabalho = useMutation({
    mutationFn: () =>
      criarTrabalho({
        clienteId: id,
        nomeProjeto,
        produto: produtoVendido,
        valor: valorTrabalho ? Number(valorTrabalho) : undefined,
        data: dataTrabalho,
        observacoes: obsTrabalho,
      }),
    onSuccess: () => {
      toast.success("Trabalho registrado.");
      setNomeProjeto("");
      setProdutoVendido("");
      setValorTrabalho("");
      setDataTrabalho(hojeISO());
      setObsTrabalho("");
      invalidar();
      qc.invalidateQueries({ queryKey: ["trabalhos", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const produtoras = useQuery({ queryKey: ["produtoras"], queryFn: fetchProdutoras });
  const vinculadas = cliente.data ? produtorasDoCliente(cliente.data).map((p) => p.id) : [];

  const vincular = useMutation({
    mutationFn: (ids: string[]) => definirProdutorasDoCliente(id, ids),
    onSuccess: () => {
      toast.success("Produtoras atualizadas.");
      qc.invalidateQueries({ queryKey: ["cliente", id] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["clientes", "produtora"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (cliente.isLoading) {
    return (
      <AppShell>
        <p className="font-mono text-[12px] text-faint">Carregando ficha…</p>
      </AppShell>
    );
  }

  const c = cliente.data;
  if (!c) {
    return (
      <AppShell>
        <p className="text-[13px] text-ink-soft">Cliente não encontrado.</p>
      </AppShell>
    );
  }

  const dias = diasSemContato(c);
  const wa = linkWhatsApp(c.whatsapp, `Oi ${c.nome.split(" ")[0]}, aqui é da Empório 56!`);

  return (
    <AppShell>
      <Link to="/clientes" className="font-mono text-[11px] text-faint hover:text-ink">
        ← voltar para clientes
      </Link>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.55fr_1fr]">
        <section className="rise rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-semibold tracking-tight">Ficha · {c.nome}</h1>
            <ClassChip value={c.classificacao} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[12px]">
            <Item rotulo="Produtoras" valor={nomesProdutoras(c)} />
            <Item rotulo="WhatsApp" valor={c.whatsapp ?? "—"} />
            <Item rotulo="E-mail" valor={c.email ?? "—"} />
            <Item rotulo="Status" valor={c.status} />
            <Item rotulo="Último contato" valor={formatarData(c.ultimo_contato)} />
            <div>
              <dt className="text-faint">Dias sem contato</dt>
              <dd className="mt-0.5 font-medium text-ember">
                {dias === null ? "—" : `${dias} dias`}
              </dd>
            </div>
            <Item rotulo="Último trabalho" valor={formatarData(c.ultimo_trabalho)} />
            <Item rotulo="Próximo contato" valor={formatarData(c.proximo_contato)} />
            <div className="col-span-2">
              <dt className="text-faint">Último projeto</dt>
              <dd className="mt-0.5 text-ink">{c.ultimo_projeto ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-faint">Observações</dt>
              <dd className="mt-0.5 text-pretty text-ink-soft">{c.observacoes ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-lg border border-line bg-paper p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Produtoras vinculadas
            </p>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {(produtoras.data ?? []).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={vinculadas.includes(p.id)}
                    disabled={vincular.isPending}
                    onChange={(e) =>
                      vincular.mutate(
                        e.target.checked
                          ? [...vinculadas, p.id]
                          : vinculadas.filter((v) => v !== p.id),
                      )
                    }
                  />
                  <span className="truncate">{p.nome}</span>
                </label>
              ))}
              {(produtoras.data ?? []).length === 0 && (
                <p className="font-mono text-[11px] text-faint">Nenhuma produtora cadastrada.</p>
              )}
            </div>
            <p className="mt-2 font-mono text-[11px] text-ink-soft">{nomesProdutoras(c)}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => contato.mutate()}
              disabled={contato.isPending}
              className="rounded-md bg-ink px-3 py-2 text-[12px] font-medium text-paper disabled:opacity-50"
            >
              Registrar contato
            </button>
            <button
              onClick={() => {
                if (!dataAgenda) {
                  toast.error("Escolha a data do próximo contato.");
                  return;
                }
                agenda.mutate();
              }}
              disabled={agenda.isPending}
              className="rounded-md border border-ink/20 px-3 py-2 text-[12px] font-medium disabled:opacity-50"
            >
              Agendar novo contato
            </button>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-ember px-3 py-2 text-[12px] font-semibold text-white"
              >
                Abrir WhatsApp
              </a>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Canal do contato
              </span>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="e-mail">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="presencial">Presencial</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Data do próximo contato
              </span>
              <input
                type="date"
                min={hojeISO()}
                value={dataAgenda}
                onChange={(e) => setDataAgenda(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Anotação do contato
              </span>
              <textarea
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
              />
            </label>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rise rounded-xl border border-line bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Histórico de interações
            </p>
            <ul className="mt-2 space-y-2 text-[13px]">
              {(interacoes.data ?? []).map((i) => (
                <li key={i.id} className="flex gap-3">
                  <span className="shrink-0 font-mono text-[11px] text-faint">
                    {formatarData(i.data)}
                  </span>
                  <span className="text-ink-soft">
                    {i.tipo === "agendamento" ? "Agendado" : "Contato"} · {i.canal}
                    {i.anotacao ? ` — ${i.anotacao}` : ""}
                  </span>
                </li>
              ))}
              {interacoes.data?.length === 0 && (
                <li className="text-ink-soft">Nenhuma interação registrada.</li>
              )}
            </ul>
          </section>

          <section className="rise rounded-xl border border-line bg-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Trabalhos
            </p>
            <ul className="mt-2 space-y-2 text-[13px]">
              {(trabalhos.data ?? []).map((t) => (
                <li key={t.id} className="flex gap-3">
                  <span className="shrink-0 font-mono text-[11px] text-faint">
                    {formatarData(t.data)}
                  </span>
                  <span className="text-ink-soft">
                    {t.nome_projeto}
                    {t.produto ? ` · ${t.produto}` : ""}
                    {t.valor ? ` — R$ ${Number(t.valor).toFixed(2)}` : ""}
                  </span>
                </li>
              ))}
              {trabalhos.data?.length === 0 && (
                <li className="text-ink-soft">Nenhum trabalho registrado.</li>
              )}
            </ul>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!nomeProjeto.trim()) {
                  toast.error("Informe o nome do projeto.");
                  return;
                }
                registrarTrabalho.mutate();
              }}
              className="mt-4 space-y-2 border-t border-line pt-3"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Registrar novo trabalho
              </p>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Nome do projeto
                </span>
                <input
                  value={nomeProjeto}
                  onChange={(e) => setNomeProjeto(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Produto vendido
                </span>
                <input
                  value={produtoVendido}
                  onChange={(e) => setProdutoVendido(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    Valor (R$)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorTrabalho}
                    onChange={(e) => setValorTrabalho(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    Data
                  </span>
                  <input
                    type="date"
                    value={dataTrabalho}
                    onChange={(e) => setDataTrabalho(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Observações
                </span>
                <textarea
                  value={obsTrabalho}
                  onChange={(e) => setObsTrabalho(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
                />
              </label>
              <button
                type="submit"
                disabled={registrarTrabalho.isPending}
                className="rounded-md bg-ink px-3 py-2 text-[12px] font-medium text-paper disabled:opacity-50"
              >
                Salvar trabalho
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-faint">{rotulo}</dt>
      <dd className="mt-0.5 text-ink">{valor}</dd>
    </div>
  );
}
