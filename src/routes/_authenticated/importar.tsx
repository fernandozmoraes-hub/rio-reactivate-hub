import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import type { Classificacao } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/importar")({
  head: () => ({
    meta: [
      { title: "Importar CSV · CRM Empório 56" },
      {
        name: "description",
        content: "Importe a base de clientes da Empório 56 a partir de um arquivo CSV.",
      },
      { property: "og:title", content: "Importar CSV · CRM Empório 56" },
      {
        property: "og:description",
        content: "Envie um CSV com nome, produtora, WhatsApp, classificação e datas.",
      },
    ],
  }),
  component: Importar,
});

const COLUNAS = [
  "nome",
  "produtora",
  "whatsapp",
  "email",
  "classificacao",
  "status",
  "ultimo_contato",
  "ultimo_trabalho",
  "ultimo_projeto",
  "observacoes",
];

const MODELO = `${COLUNAS.join(",")}
Marina Costa,Alva Filmes,5511984213307,marina@exemplo.com,A,inativo,2026-06-10,2026-05-02,Campanha Verão,Prefere contato à tarde`;

function dividirLinha(linha: string): string[] {
  const saida: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        aspas = !aspas;
      }
    } else if (ch === "," && !aspas) {
      saida.push(atual.trim());
      atual = "";
    } else {
      atual += ch;
    }
  }
  saida.push(atual.trim());
  return saida;
}

function Importar() {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [erros, setErros] = useState<string[]>([]);
  const [processando, setProcessando] = useState(false);

  async function importar() {
    const linhas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (linhas.length < 2) {
      toast.error("Cole ou envie um CSV com cabeçalho e ao menos uma linha.");
      return;
    }
    const cabecalho = dividirLinha(linhas[0] ?? "").map((h) => h.toLowerCase());
    if (!cabecalho.includes("nome")) {
      toast.error('O CSV precisa ter a coluna "nome".');
      return;
    }

    setProcessando(true);
    const problemas: string[] = [];

    const { data: produtoras } = await supabase.from("produtoras").select("id, nome");
    const mapa = new Map((produtoras ?? []).map((p) => [p.nome.toLowerCase(), p.id]));

    type NovoCliente = {
      nome: string;
      produtora_id: string | null;
      whatsapp: string | null;
      email: string | null;
      classificacao: Classificacao;
      status: string;
      ultimo_contato: string | null;
      ultimo_trabalho: string | null;
      ultimo_projeto: string | null;
      observacoes: string | null;
    };
    const registros: NovoCliente[] = [];

    for (let i = 1; i < linhas.length; i++) {
      const valores = dividirLinha(linhas[i] ?? "");
      const linha: Record<string, string> = {};
      cabecalho.forEach((coluna, idx) => {
        linha[coluna] = valores[idx] ?? "";
      });

      const nome = (linha["nome"] ?? "").trim();
      if (!nome) {
        problemas.push(`Linha ${i + 1}: sem nome, ignorada.`);
        continue;
      }

      let produtoraId: string | null = null;
      const nomeProdutora = (linha["produtora"] ?? "").trim();
      if (nomeProdutora) {
        const existente = mapa.get(nomeProdutora.toLowerCase());
        if (existente) {
          produtoraId = existente;
        } else {
          const { data: nova, error } = await supabase
            .from("produtoras")
            .insert({ nome: nomeProdutora })
            .select("id, nome")
            .single();
          if (error) {
            problemas.push(`Linha ${i + 1}: falha ao criar produtora "${nomeProdutora}".`);
          } else if (nova) {
            produtoraId = nova.id;
            mapa.set(nova.nome.toLowerCase(), nova.id);
          }
        }
      }

      const cls = (linha["classificacao"] || "C").toUpperCase();
      const classificacao: Classificacao = ["A", "B", "C"].includes(cls)
        ? (cls as Classificacao)
        : "C";

      registros.push({
        nome,
        produtora_id: produtoraId,
        whatsapp: linha["whatsapp"] || null,
        email: linha["email"] || null,
        classificacao,
        status: linha["status"] || "ativo",
        ultimo_contato: linha["ultimo_contato"] || null,
        ultimo_trabalho: linha["ultimo_trabalho"] || null,
        ultimo_projeto: linha["ultimo_projeto"] || null,
        observacoes: linha["observacoes"] || null,
      });
    }

    if (registros.length > 0) {
      const { error } = await supabase.from("clientes").insert(registros);
      if (error) {
        problemas.push(`Erro ao salvar: ${error.message}`);
        toast.error("Não foi possível importar os clientes.");
      } else {
        toast.success(`${registros.length} cliente(s) importado(s).`);
        setTexto("");
        qc.invalidateQueries({ queryKey: ["clientes"] });
      }
    }

    setErros(problemas);
    setProcessando(false);
  }

  return (
    <AppShell>
      <header className="rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">
          (d) · Entrada de dados
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">Importar clientes por CSV</h1>
        <p className="mt-2 max-w-[52ch] text-pretty text-ink-soft">
          Envie um arquivo ou cole o conteúdo. Datas no formato AAAA-MM-DD. Produtoras novas são
          criadas automaticamente.
        </p>
      </header>

      <section className="rise mt-5 rounded-xl border border-line bg-surface p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Colunas aceitas
        </p>
        <p className="mt-1 font-mono text-[12px] text-ink-soft">{COLUNAS.join(" · ")}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setTexto(await file.text());
            }}
            className="text-[12px]"
          />
          <button
            onClick={() => setTexto(MODELO)}
            className="rounded-md border border-line px-3 py-1.5 text-[12px] font-medium text-ink-soft"
          >
            Usar modelo de exemplo
          </button>
        </div>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={10}
          placeholder={MODELO}
          className="mt-4 w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-[12px] outline-none focus:border-ember"
        />

        <button
          onClick={importar}
          disabled={processando}
          className="mt-4 rounded-md bg-ember px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
        >
          {processando ? "Importando…" : "Importar clientes"}
        </button>

        {erros.length > 0 && (
          <ul className="mt-4 space-y-1 font-mono text-[11px] text-ember">
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
