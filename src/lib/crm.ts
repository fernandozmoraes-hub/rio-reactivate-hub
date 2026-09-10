import { supabase } from "@/integrations/supabase/client";

export type Classificacao = "A" | "B" | "C";

export type Produtora = {
  id: string;
  nome: string;
  contato: string | null;
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
};

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

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*, produtoras(nome)")
    .order("nome");
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function fetchCliente(id: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*, produtoras(nome)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cliente não encontrado");
  return data as Cliente;
}

export async function fetchProdutoras(): Promise<Produtora[]> {
  const { data, error } = await supabase.from("produtoras").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Produtora[];
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
