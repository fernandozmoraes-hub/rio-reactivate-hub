import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchOfertas, formatarData, type Oferta } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/ofertas")({
  head: () => ({
    meta: [
      { title: "Ofertas · CRM Empório 56" },
      {
        name: "description",
        content: "Gestão de ofertas da Empório 56: criar, editar, duplicar, ativar e excluir.",
      },
      { property: "og:title", content: "Ofertas · CRM Empório 56" },
      {
        property: "og:description",
        content: "Ofertas disponíveis para usar nas conversas de reativação.",
      },
    ],
  }),
  component: Ofertas,
});

type FormState = {
  nome: string;
  mensagem: string;
  publicoAlvo: string;
  status: string;
};

const FORM_VAZIO: FormState = { nome: "", mensagem: "", publicoAlvo: "", status: "ativa" };

function Ofertas() {
  const qc = useQueryClient();
  const ofertas = useQuery({ queryKey: ["ofertas"], queryFn: fetchOfertas });
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Oferta | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [excluindo, setExcluindo] = useState<Oferta | null>(null);

  function invalidar() {
    qc.invalidateQueries({ queryKey: ["ofertas"] });
  }

  function abrirNova() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setFormAberto(true);
  }

  function abrirEdicao(oferta: Oferta) {
    setEditando(oferta);
    setForm({
      nome: oferta.nome,
      mensagem: oferta.mensagem ?? oferta.descricao ?? "",
      publicoAlvo: oferta.publico_alvo ?? "",
      status: oferta.status === "inativa" ? "inativa" : "ativa",
    });
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setEditando(null);
    setForm(FORM_VAZIO);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome.trim(),
        mensagem: form.mensagem.trim() || null,
        publico_alvo: form.publicoAlvo.trim() || null,
        status: form.status,
      };
      if (editando) {
        const { error } = await supabase.from("ofertas").update(payload).eq("id", editando.id);
        if (error) throw error;
        return "editada";
      }
      const { error } = await supabase.from("ofertas").insert(payload);
      if (error) throw error;
      return "criada";
    },
    onSuccess: (acao) => {
      toast.success(acao === "editada" ? "Oferta atualizada." : "Oferta criada.");
      fecharForm();
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicar = useMutation({
    mutationFn: async (oferta: Oferta) => {
      const { error } = await supabase.from("ofertas").insert({
        nome: `${oferta.nome} (cópia)`,
        mensagem: oferta.mensagem ?? oferta.descricao ?? null,
        publico_alvo: oferta.publico_alvo ?? null,
        status: oferta.status ?? "ativa",
        validade: oferta.validade ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oferta duplicada.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarStatus = useMutation({
    mutationFn: async (oferta: Oferta) => {
      const novo = oferta.status === "inativa" ? "ativa" : "inativa";
      const { error } = await supabase.from("ofertas").update({ status: novo }).eq("id", oferta.id);
      if (error) throw error;
      return novo;
    },
    onSuccess: (novo) => {
      toast.success(novo === "ativa" ? "Oferta ativada." : "Oferta inativada.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ofertas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oferta excluída.");
      setExcluindo(null);
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lista = ofertas.data ?? [];

  return (
    <AppShell>
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
            (c) · Catálogo
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight">Ofertas</h1>
          <p className="mt-2 max-w-[52ch] text-pretty text-ink-soft">
            Ofertas ficam registradas aqui para uso manual nas conversas. Nenhum envio automático é
            feito.
          </p>
        </div>
        <Button size="sm" onClick={() => (formAberto ? fecharForm() : abrirNova())}>
          {formAberto ? "Fechar" : "Nova oferta"}
        </Button>
      </header>

      {formAberto && (
        <form
          className="rise mt-5 grid gap-3 rounded-xl border border-line bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nome.trim()) {
              toast.error("Informe o nome da oferta.");
              return;
            }
            salvar.mutate();
          }}
        >
          <h2 className="text-[15px] font-semibold tracking-tight">
            {editando ? "Editar oferta" : "Nova oferta"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Público-alvo">
              <input
                value={form.publicoAlvo}
                onChange={(e) => setForm({ ...form, publicoAlvo: e.target.value })}
                placeholder="Ex.: clientes A sem contato há 90 dias"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Mensagem">
            <textarea
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              rows={6}
              placeholder={"Texto da oferta, com quantas linhas precisar.\nEx.: Olá! Temos uma condição especial..."}
              className={`${inputClass} whitespace-pre-wrap`}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass}
            >
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={salvar.isPending}>
              {editando ? "Salvar alterações" : "Criar oferta"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={fecharForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <section className="mt-6 space-y-3">
        {lista.map((o) => {
          const inativa = o.status === "inativa";
          return (
            <article
              key={o.id}
              className={`rise rounded-xl border border-line bg-surface p-4 ${inativa ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-semibold tracking-tight">{o.nome}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                        inativa
                          ? "border-line text-faint"
                          : "border-ember/40 text-ember"
                      }`}
                    >
                      {inativa ? "Inativa" : "Ativa"}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-faint">
                    {o.publico_alvo ? `Público: ${o.publico_alvo}` : "Sem público-alvo definido"}
                    {o.validade ? ` · válido até ${formatarData(o.validade)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => abrirEdicao(o)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={duplicar.isPending}
                    onClick={() => duplicar.mutate(o)}
                  >
                    Duplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={alternarStatus.isPending}
                    onClick={() => alternarStatus.mutate(o)}
                  >
                    {inativa ? "Ativar" : "Inativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:text-red-700"
                    onClick={() => setExcluindo(o)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
              {(o.mensagem ?? o.descricao) && (
                <p className="mt-2 whitespace-pre-wrap text-[13px] text-pretty text-ink-soft">
                  {o.mensagem ?? o.descricao}
                </p>
              )}
            </article>
          );
        })}
        {ofertas.data?.length === 0 && (
          <p className="rounded-xl border border-line bg-surface px-4 py-6 font-mono text-[12px] text-faint">
            Nenhuma oferta cadastrada.
          </p>
        )}
      </section>

      {excluindo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar exclusão"
        >
          <div className="w-full max-w-sm rounded-xl border border-line bg-paper p-5 shadow-lg">
            <h2 className="text-[15px] font-semibold tracking-tight">Excluir oferta?</h2>
            <p className="mt-2 text-[13px] text-ink-soft">
              A oferta <strong>{excluindo.nome}</strong> será removida permanentemente. Essa ação
              não pode ser desfeita.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setExcluindo(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-red-700 text-paper hover:bg-red-800"
                disabled={excluir.isPending}
                onClick={() => excluir.mutate(excluindo.id)}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
