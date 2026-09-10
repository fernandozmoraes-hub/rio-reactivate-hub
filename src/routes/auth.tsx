import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar · CRM Empório 56" },
      {
        name: "description",
        content: "Acesso restrito ao CRM de reativação de clientes da Empório 56.",
      },
      { property: "og:title", content: "Entrar · CRM Empório 56" },
      { property: "og:description", content: "Acesso restrito ao CRM da Empório 56." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/", replace: true });
        } else {
          toast.success("Confira seu e-mail para confirmar o acesso.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5 font-sans text-[14px] text-ink antialiased">
      <div className="rise w-full max-w-[380px] rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-ink font-mono text-[11px] tracking-tight text-paper">
            56
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">Empório 56</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Acesso restrito
            </p>
          </div>
        </div>

        <h1 className="mt-6 text-[22px] font-bold tracking-tight">
          {modo === "entrar" ? "Entrar" : "Criar acesso"}
        </h1>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              E-mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Senha
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-[13px] outline-none focus:border-ember"
            />
          </label>
          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-ink px-3 py-2 text-[12px] font-medium text-paper disabled:opacity-50"
          >
            {modo === "entrar" ? "Entrar" : "Criar acesso"}
          </button>
        </form>

        <button
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          className="mt-4 font-mono text-[11px] text-faint hover:text-ember"
        >
          {modo === "entrar" ? "criar acesso" : "já tenho acesso"}
        </button>
      </div>
    </div>
  );
}
