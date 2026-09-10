DROP POLICY IF EXISTS clientes_public_all ON public.clientes;
DROP POLICY IF EXISTS produtoras_public_all ON public.produtoras;
DROP POLICY IF EXISTS interacoes_public_all ON public.interacoes;
DROP POLICY IF EXISTS trabalhos_public_all ON public.trabalhos;
DROP POLICY IF EXISTS ofertas_public_all ON public.ofertas;
DROP POLICY IF EXISTS estagio_historico_public_all ON public.estagio_historico;

REVOKE ALL ON public.clientes FROM anon;
REVOKE ALL ON public.produtoras FROM anon;
REVOKE ALL ON public.interacoes FROM anon;
REVOKE ALL ON public.trabalhos FROM anon;
REVOKE ALL ON public.ofertas FROM anon;
REVOKE ALL ON public.estagio_historico FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtoras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trabalhos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ofertas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estagio_historico TO authenticated;
GRANT ALL ON public.clientes TO service_role;
GRANT ALL ON public.produtoras TO service_role;
GRANT ALL ON public.interacoes TO service_role;
GRANT ALL ON public.trabalhos TO service_role;
GRANT ALL ON public.ofertas TO service_role;
GRANT ALL ON public.estagio_historico TO service_role;

CREATE POLICY clientes_auth_all ON public.clientes FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY produtoras_auth_all ON public.produtoras FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY interacoes_auth_all ON public.interacoes FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY trabalhos_auth_all ON public.trabalhos FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY ofertas_auth_all ON public.ofertas FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY estagio_historico_auth_all ON public.estagio_historico FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);