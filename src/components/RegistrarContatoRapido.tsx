import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CANAIS, registrarContato } from "@/lib/crm";

export function RegistrarContatoRapido({
  clienteId,
  nome,
}: {
  clienteId: string;
  nome: string;
}) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [canal, setCanal] = useState<string>("whatsapp");
  const [anotacao, setAnotacao] = useState("");

  const salvar = useMutation({
    mutationFn: () => registrarContato({ clienteId, canal, anotacao }),
    onSuccess: () => {
      toast.success(`Contato com ${nome} registrado hoje.`);
      setAnotacao("");
      setAberto(false);
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["interacoes", clienteId] });
      qc.invalidateQueries({ queryKey: ["cliente", clienteId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="rounded-md border border-ink/20 px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-black/5"
      >
        Registrar contato
      </button>

      {aberto && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-line bg-surface p-3 text-left shadow-lg ring-1 ring-black/5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Tipo de contato
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CANAIS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCanal(c.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  canal === c.id ? "bg-ink text-paper" : "border border-line text-ink-soft"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            value={anotacao}
            onChange={(e) => setAnotacao(e.target.value)}
            rows={2}
            placeholder="Observação (opcional)"
            className="mt-3 w-full rounded-md border border-line bg-paper px-2.5 py-2 text-[12px] outline-none focus:border-ember"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-faint">data de hoje</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-md px-2 py-1 text-[11px] text-ink-soft hover:bg-black/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvar.isPending}
                onClick={() => salvar.mutate()}
                className="rounded-md bg-ember px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
