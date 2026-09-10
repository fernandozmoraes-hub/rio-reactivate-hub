import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { fetchOfertas, formatarData } from "@/lib/crm";

export const Route = createFileRoute("/ofertas")({
  head: () => ({
    meta: [
      { title: "Ofertas · CRM Empório 56" },
      {
        name: "description",
        content: "Cadastro de ofertas da Empório 56 com nome, descrição e validade.",
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

function Ofertas() {
  const qc = useQueryClient();
  const ofertas = useQuery({ queryKey: ["ofertas"], queryFn: fetchOfertas });
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [validade, setValidade] = useState("");

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ofertas")
        .insert({ nome, descricao: descricao || null, validade: validade || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oferta criada.");
      setNome("");
      setDescricao("");
      setValidade("");
      qc.invalidateQueries({ queryKey: ["ofertas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ofertas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oferta removida.");
      qc.invalidateQueries({ queryKey: ["ofertas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <header className="rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
          (c) · Catálogo
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">Ofertas</h1>
        <p className="mt-2 max-w-[52ch] text-pretty text-ink-soft">
          Ofertas ficam registradas aqui para uso manual nas conversas. Nenhum envio automático é
          feito.
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <section className="rise rounded-xl border border-line bg-surface p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Nova oferta</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!nome.trim()) return toast.error("Informe o nome da oferta.");
              criar.mutate();
            }}
          >
            <Field label="Nome">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
              />
            </Field>
            <Field label="Descrição">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
              />
            </Field>
            <Field label="Validade">
              <input
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
              />
            </Field>
            <button
              type="submit"
              disabled={criar.isPending}
              className="rounded-md bg-ink px-3 py-2 text-[12px] font-medium text-paper disabled:opacity-50"
            >
              Salvar oferta
            </button>
          </form>
        </section>

        <section className="rise rounded-xl border border-line bg-surface p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Ofertas cadastradas</h2>
          <ul className="mt-4 space-y-3">
            {(ofertas.data ?? []).map((o) => (
              <li key={o.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold tracking-tight">{o.nome}</p>
                  <span className="shrink-0 font-mono text-[10px] text-faint">
                    válido até {formatarData(o.validade)}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-pretty text-ink-soft">{o.descricao}</p>
                <button
                  onClick={() => remover.mutate(o.id)}
                  className="mt-2 font-mono text-[11px] text-faint hover:text-ember"
                >
                  remover
                </button>
              </li>
            ))}
            {ofertas.data?.length === 0 && (
              <p className="text-[13px] text-ink-soft">Nenhuma oferta cadastrada.</p>
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
