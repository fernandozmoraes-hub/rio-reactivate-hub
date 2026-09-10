ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS estagio text NOT NULL DEFAULT 'reativar',
  ADD COLUMN IF NOT EXISTS estagio_atualizado_em timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS proxima_acao text;

CREATE TABLE IF NOT EXISTS public.estagio_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  de text,
  para text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estagio_historico TO anon, authenticated;
GRANT ALL ON public.estagio_historico TO service_role;
ALTER TABLE public.estagio_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY estagio_historico_public_all ON public.estagio_historico FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);