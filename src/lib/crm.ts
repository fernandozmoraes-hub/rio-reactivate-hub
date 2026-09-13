import { supabase } from "@/integrations/supabase/client";

export type Classificacao = "A" | "B" | "C";

export type Produtora = {
  id: string;
  nome: string;
  contato: string | null;
};

export type VinculoProdutora = {
  produtora_id: string;
  produtoras: { id: string; nome: string } | null;
};

export type Cliente = {
  id: string;
  nome: string;
  produtora_id: string | null;
  whatsapp: string | null;
  email: string | null;
  classificacao: Classificacao;
  status: string;
  ultimo_contato: string | null;
  ultimo_trabalho: string | null;
  ultimo_projeto: string | null;
  proximo_contato: string | null;
  observacoes: string | null;
  estagio: string;
  estagio_atualizado_em: string;
  proxima_acao: string | null;
  produtoras?: { nome: string } | null;
  cliente_produtoras?: VinculoProdutora[] | null;
};

export function produtorasDoCliente(cliente: Cliente): { id: string; nome: string }[] {
  return (cliente.cliente_produtoras ?? [])
    .map((v) => v.produtoras)
    .filter((p): p is { id: string; nome: string } => Boolean(p))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export function nomesProdutoras(cliente: Cliente): string {
  const nomes = produtorasDoCliente(cliente).map((p) => p.nome);
  return nomes.length ? nomes.join(", ") : "Sem produtora";
}

export const ESTAGIOS = [
  { id: "reativar", label: "Reativar" },
  { id: "contato_feito", label: "Contato feito" },
  { id: "respondeu", label: "Respondeu" },
  { id: "oportunidade", label: "Oportunidade" },
  { id: "proposta", label: "Proposta enviada" },
  { id: "fechado", label: "Fechado" },
  { id: "arquivado", label: "Sem interesse / Arquivado" },
] as const;

export const CANAIS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "ligacao", label: "Ligação" },
  { id: "email", label: "E-mail" },
  { id: "reuniao", label: "Reunião" },
] as const;

export const SUGESTOES_ACAO = [
  "Enviar WhatsApp",
  "Ligar",
  "Reenviar proposta",
  "Oferecer condição",
  "Agendar conversa",
] as const;

export function rotuloEstagio(id: string): string {
  return ESTAGIOS.find((e) => e.id === id)?.label ?? id;
}

export type Interacao = {
  id: string;
  cliente_id: string;
  tipo: string;
  canal: string;
  data: string;
  anotacao: string | null;
};

export type Trabalho = {
  id: string;
  cliente_id: string;
  nome_projeto: string;
  data: string;
  valor: number | null;
  observacoes: string | null;
};

export type Oferta = {
  id: string;
  nome: string;
  descricao: string | null;
  validade: string | null;
  mensagem: string | null;
  publico_alvo: string | null;
  status: string;
};

const PESO: Record<Classificacao, number> = { A: 0, B: 1, C: 2 };

export function diasSemContato(cliente: Pick<Cliente, "ultimo_contato">): number | null {
  if (!cliente.ultimo_contato) return null;
  const hoje = new Date();
  const ref = new Date(`${cliente.ultimo_contato}T00:00:00`);
  const ms = hoje.getTime() - ref.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function ordenarPorPrioridade(clientes: Cliente[]): Cliente[] {
  return [...clientes].sort((a, b) => {
    const pesoDiff = PESO[a.classificacao] - PESO[b.classificacao];
    if (pesoDiff !== 0) return pesoDiff;
    const da = diasSemContato(a) ?? Number.MAX_SAFE_INTEGER;
    const db = diasSemContato(b) ?? Number.MAX_SAFE_INTEGER;
    return db - da;
  });
}

export function linkWhatsApp(whatsapp: string | null, mensagem?: string): string | null {
  if (!whatsapp) return null;
  const numero = whatsapp.replace(/\D/g, "");
  if (!numero) return null;
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${numero}${texto}`;
}

export function formatarData(valor: string | null): string {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const SELECT_CLIENTE = "*, cliente_produtoras(produtora_id, produtoras(id, nome))";

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from("clientes").select(SELECT_CLIENTE).order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Cliente[];
}

export async function fetchCliente(id: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .select(SELECT_CLIENTE)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cliente não encontrado");
  return data as unknown as Cliente;
}

export async function fetchProdutoras(): Promise<Produtora[]> {
  const { data, error } = await supabase.from("produtoras").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Produtora[];
}

export async function fetchProdutora(id: string): Promise<Produtora> {
  const { data, error } = await supabase
    .from("produtoras")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Produtora não encontrada");
  return data as Produtora;
}

export async function fetchVinculos(): Promise<{ cliente_id: string; produtora_id: string }[]> {
  const { data, error } = await supabase
    .from("cliente_produtoras")
    .select("cliente_id, produtora_id");
  if (error) throw error;
  return data ?? [];
}

export async function fetchClientesDaProdutora(produtoraId: string): Promise<Cliente[]> {
  const { data: vinculos, error: vErr } = await supabase
    .from("cliente_produtoras")
    .select("cliente_id")
    .eq("produtora_id", produtoraId);
  if (vErr) throw vErr;
  const ids = (vinculos ?? []).map((v) => v.cliente_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("clientes")
    .select(SELECT_CLIENTE)
    .in("id", ids)
    .order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Cliente[];
}

export async function definirProdutorasDoCliente(clienteId: string, ids: string[]): Promise<void> {
  const { data: atuais, error: aErr } = await supabase
    .from("cliente_produtoras")
    .select("produtora_id")
    .eq("cliente_id", clienteId);
  if (aErr) throw aErr;
  const atuaisIds = (atuais ?? []).map((v) => v.produtora_id);
  const remover = atuaisIds.filter((id) => !ids.includes(id));
  const adicionar = ids.filter((id) => !atuaisIds.includes(id));

  if (remover.length) {
    const { error } = await supabase
      .from("cliente_produtoras")
      .delete()
      .eq("cliente_id", clienteId)
      .in("produtora_id", remover);
    if (error) throw error;
  }
  if (adicionar.length) {
    const { error } = await supabase
      .from("cliente_produtoras")
      .insert(adicionar.map((produtora_id) => ({ cliente_id: clienteId, produtora_id })));
    if (error) throw error;
  }
}

export async function criarProdutora(nome: string, contato?: string): Promise<Produtora> {
  const { data, error } = await supabase
    .from("produtoras")
    .insert({ nome: nome.trim(), contato: contato?.trim() || null })
    .select("*")
    .single();
  if (error) throw error;
  return data as Produtora;
}

export async function atualizarProdutora(
  id: string,
  dados: Pick<Produtora, "nome" | "contato">,
): Promise<void> {
  const { error } = await supabase
    .from("produtoras")
    .update({ nome: dados.nome.trim(), contato: dados.contato?.trim() || null })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchInteracoes(clienteId: string): Promise<Interacao[]> {
  const { data, error } = await supabase
    .from("interacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Interacao[];
}

export async function fetchTrabalhos(clienteId: string): Promise<Trabalho[]> {
  const { data, error } = await supabase
    .from("trabalhos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Trabalho[];
}

export async function fetchOfertas(): Promise<Oferta[]> {
  const { data, error } = await supabase
    .from("ofertas")
    .select("*")
    .order("validade", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Oferta[];
}

export async function registrarContato(input: {
  clienteId: string;
  canal: string;
  anotacao?: string;
  data?: string;
}) {
  const data = input.data ?? hojeISO();
  const { error } = await supabase.from("interacoes").insert({
    cliente_id: input.clienteId,
    tipo: "contato",
    canal: input.canal,
    data,
    anotacao: input.anotacao ?? null,
  });
  if (error) throw error;
  const { error: upErr } = await supabase
    .from("clientes")
    .update({ ultimo_contato: data })
    .eq("id", input.clienteId);
  if (upErr) throw upErr;
}

export async function agendarContato(clienteId: string, data: string, anotacao?: string) {
  const { error } = await supabase
    .from("clientes")
    .update({ proximo_contato: data })
    .eq("id", clienteId);
  if (error) throw error;
  const { error: intErr } = await supabase.from("interacoes").insert({
    cliente_id: clienteId,
    tipo: "agendamento",
    canal: "agenda",
    data,
    anotacao: anotacao ?? "Contato agendado.",
  });
  if (intErr) throw intErr;
}

export async function moverEstagio(clienteId: string, de: string | null, para: string) {
  const { error } = await supabase
    .from("clientes")
    .update({ estagio: para, estagio_atualizado_em: new Date().toISOString() })
    .eq("id", clienteId);
  if (error) throw error;
  const { error: histErr } = await supabase
    .from("estagio_historico")
    .insert({ cliente_id: clienteId, de, para });
  if (histErr) throw histErr;
}

export async function salvarProximaAcao(clienteId: string, acao: string) {
  const { error } = await supabase
    .from("clientes")
    .update({ proxima_acao: acao || null })
    .eq("id", clienteId);
  if (error) throw error;
}
