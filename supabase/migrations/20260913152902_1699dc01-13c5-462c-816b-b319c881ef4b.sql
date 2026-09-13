ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS mensagem TEXT;
ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS publico_alvo TEXT;
ALTER TABLE public.ofertas ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativa';
UPDATE public.ofertas SET mensagem = descricao WHERE mensagem IS NULL AND descricao IS NOT NULL;