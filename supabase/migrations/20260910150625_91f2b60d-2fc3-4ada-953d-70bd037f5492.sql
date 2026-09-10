CREATE TABLE public.produtoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  contato TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtoras TO anon, authenticated;
GRANT ALL ON public.produtoras TO service_role;
ALTER TABLE public.produtoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtoras_public_all" ON public.produtoras FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  produtora_id UUID REFERENCES public.produtoras(id) ON DELETE SET NULL,
  whatsapp TEXT,
  email TEXT,
  classificacao TEXT NOT NULL DEFAULT 'C' CHECK (classificacao IN ('A','B','C')),
  status TEXT NOT NULL DEFAULT 'ativo',
  ultimo_contato DATE,
  ultimo_trabalho DATE,
  ultimo_projeto TEXT,
  proximo_contato DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon, authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_public_all" ON public.clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.interacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'contato',
  canal TEXT NOT NULL DEFAULT 'whatsapp',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  anotacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interacoes TO anon, authenticated;
GRANT ALL ON public.interacoes TO service_role;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interacoes_public_all" ON public.interacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.trabalhos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome_projeto TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  valor NUMERIC(12,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trabalhos TO anon, authenticated;
GRANT ALL ON public.trabalhos TO service_role;
ALTER TABLE public.trabalhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trabalhos_public_all" ON public.trabalhos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.ofertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  validade DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ofertas TO anon, authenticated;
GRANT ALL ON public.ofertas TO service_role;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ofertas_public_all" ON public.ofertas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER clientes_set_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.produtoras (nome, contato) VALUES
  ('Alva Filmes', 'contato@alvafilmes.com.br'),
  ('Lume Estúdio', 'ola@lumeestudio.com.br'),
  ('Vento Filmes', 'producao@ventofilmes.com.br'),
  ('Trama Produções', 'contato@tramaproducoes.com.br'),
  ('Corrente Filmes', 'oi@correntefilmes.com.br');

INSERT INTO public.clientes (nome, produtora_id, whatsapp, email, classificacao, status, ultimo_contato, ultimo_trabalho, ultimo_projeto, observacoes) VALUES
  ('Marina Costa',    (SELECT id FROM public.produtoras WHERE nome='Alva Filmes'),     '5511984213307', 'marina@alvafilmes.com.br',   'A', 'inativo',  CURRENT_DATE - 94, CURRENT_DATE - 120, 'Campanha Verão 24',      'Prefere contato à tarde.'),
  ('Paulo Andrade',   (SELECT id FROM public.produtoras WHERE nome='Lume Estúdio'),    '5511977332084', 'paulo@lumeestudio.com.br',   'A', 'inativo',  CURRENT_DATE - 71, CURRENT_DATE - 96,  'Institucional Vale',     'Fechou 3 projetos em 2024.'),
  ('Joana Ribeiro',   (SELECT id FROM public.produtoras WHERE nome='Vento Filmes'),    '5513988124475', 'joana@ventofilmes.com.br',   'A', 'em contato', CURRENT_DATE - 58, CURRENT_DATE - 80, 'Série Documental',       'Pediu orçamento novo.'),
  ('Ricardo Nunes',   (SELECT id FROM public.produtoras WHERE nome='Trama Produções'), '5519991207833', 'ricardo@trama.com.br',       'B', 'inativo',  CURRENT_DATE - 63, CURRENT_DATE - 90,  'Filme Cerveja Trigo',    'Responde melhor de manhã.'),
  ('Fernanda Lima',   (SELECT id FROM public.produtoras WHERE nome='Corrente Filmes'), '5524998705521', 'fernanda@corrente.com.br',   'B', 'ativo',    CURRENT_DATE - 44, CURRENT_DATE - 70,  'Azeite da Chapada',      NULL),
  ('Carlos Mendes',   (SELECT id FROM public.produtoras WHERE nome='Alva Filmes'),     '5588993416602', 'carlos@alvafilmes.com.br',   'C', 'inativo',  CURRENT_DATE - 52, CURRENT_DATE - 140, 'Vídeo Produto',          NULL),
  ('Beatriz Souza',   (SELECT id FROM public.produtoras WHERE nome='Lume Estúdio'),    '5535992108845', 'beatriz@lumeestudio.com.br', 'C', 'ativo',    CURRENT_DATE - 37, CURRENT_DATE - 60,  'Honey da Serra',         'Cliente pequeno, recorrente.'),
  ('Rafael Nogueira', (SELECT id FROM public.produtoras WHERE nome='Lume Estúdio'),    '5511977124455', 'rafael@lumeestudio.com.br',  'A', 'inativo',  CURRENT_DATE - 41, CURRENT_DATE - 65,  'Campanha Inverno',       'Sumiu depois da última entrega.'),
  ('Paula Rezende',   (SELECT id FROM public.produtoras WHERE nome='Vento Filmes'),    '5521990201188', 'paula@ventofilmes.com.br',   'B', 'em contato', CURRENT_DATE - 29, CURRENT_DATE - 45, 'Reels Semanal',          NULL),
  ('Caio Menezes',    (SELECT id FROM public.produtoras WHERE nome='Trama Produções'), '5531988337020', 'caio@trama.com.br',          'B', 'ativo',    CURRENT_DATE - 18, CURRENT_DATE - 30,  'Banner Festival',        NULL),
  ('Bruno Tavares',   (SELECT id FROM public.produtoras WHERE nome='Corrente Filmes'), '5511970013344', 'bruno@corrente.com.br',      'C', 'inativo',  CURRENT_DATE - 76, CURRENT_DATE - 110, 'Maré Filmes Piloto',     'Orçamento apertado.'),
  ('Otávio Lins',     (SELECT id FROM public.produtoras WHERE nome='Corrente Filmes'), '5541992206677', 'otavio@corrente.com.br',     'C', 'ativo',    CURRENT_DATE - 12, CURRENT_DATE - 25,  'Spot Rádio',             NULL),
  ('Helena Prado',    (SELECT id FROM public.produtoras WHERE nome='Alva Filmes'),     '5511993334422', 'helena@alvafilmes.com.br',   'A', 'ativo',    CURRENT_DATE - 22, CURRENT_DATE - 33,  'Manifesto de Marca',     'Ótimo relacionamento.'),
  ('Diego Barros',    (SELECT id FROM public.produtoras WHERE nome='Vento Filmes'),    '5551991117788', 'diego@ventofilmes.com.br',   'B', 'inativo',  CURRENT_DATE - 88, CURRENT_DATE - 130, 'Vinheta Institucional',  'Trocou de agência.'),
  ('Sofia Martins',   (SELECT id FROM public.produtoras WHERE nome='Trama Produções'), '5548994445566', 'sofia@trama.com.br',         'C', 'em contato', CURRENT_DATE - 5,  CURRENT_DATE - 15, 'Making Of Festival',     NULL);

INSERT INTO public.interacoes (cliente_id, tipo, canal, data, anotacao)
SELECT c.id, 'contato', 'whatsapp', c.ultimo_contato, 'Último contato registrado na importação inicial.'
FROM public.clientes c WHERE c.ultimo_contato IS NOT NULL;

INSERT INTO public.trabalhos (cliente_id, nome_projeto, data, valor)
SELECT c.id, c.ultimo_projeto, c.ultimo_trabalho, 3500 + (random()*8000)::numeric(12,2)
FROM public.clientes c WHERE c.ultimo_projeto IS NOT NULL;

INSERT INTO public.ofertas (nome, descricao, validade) VALUES
  ('Reativação A — 15% off', 'Desconto para clientes A sem contato há mais de 60 dias.', CURRENT_DATE + 45),
  ('Combo 2 Reels + 1 Banner', 'Pacote para clientes B que voltarem a produzir.', CURRENT_DATE + 60),
  ('Amostra de origem', 'Kit de amostra para clientes reativados.', CURRENT_DATE + 20);