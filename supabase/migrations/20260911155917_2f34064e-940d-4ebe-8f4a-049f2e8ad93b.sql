CREATE TABLE IF NOT EXISTS public.cliente_produtoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  produtora_id uuid NOT NULL REFERENCES public.produtoras(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, produtora_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_produtoras TO authenticated;
GRANT ALL ON public.cliente_produtoras TO service_role;

ALTER TABLE public.cliente_produtoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY cliente_produtoras_auth_all ON public.cliente_produtoras
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER cliente_produtoras_set_updated_at
  BEFORE UPDATE ON public.cliente_produtoras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS cliente_produtoras_cliente_idx ON public.cliente_produtoras(cliente_id);
CREATE INDEX IF NOT EXISTS cliente_produtoras_produtora_idx ON public.cliente_produtoras(produtora_id);

INSERT INTO public.cliente_produtoras (cliente_id, produtora_id)
SELECT id, produtora_id FROM public.clientes
WHERE produtora_id IS NOT NULL
ON CONFLICT DO NOTHING;