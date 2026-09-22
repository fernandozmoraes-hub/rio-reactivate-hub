# Empório 56 CRM

Crie um CRM web simples e responsivo para a Empório 56, focado em reativação de clientes antigos. Use a integração nativa com Supabase do Lovable. Crie tabelas para clientes, produtoras, interações e trabalhos. Campos de cliente: nome, produtora vinculada, WhatsApp, e-mail, classificação A, B ou C, status, data do último contato, data do último trabalho, nome do último projeto e observações. Calcule automaticamente os dias sem contato. Crie uma tela "Reativação" que ordene automaticamente por prioridade, cliente A com mais tempo sem contato primeiro, depois B e C. Mostre "Clientes para contatar hoje" com até dez sugestões. Na ficha do cliente, crie botões para registrar contato, agendar novo contato e abrir WhatsApp via link wa.me Não implemente envio automático agora. Crie também uma tela de ofertas com nome, descrição e validade, mas sem disparo. Crie importação por CSV e gere quinze clientes fictícios para teste. Interface muito limpa, sem funil complexo. Priorize funcionalidade completa antes de qualquer extra.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rio-reactivate-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/741e72a6-8975-431c-a77a-f328b3a7c92d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
