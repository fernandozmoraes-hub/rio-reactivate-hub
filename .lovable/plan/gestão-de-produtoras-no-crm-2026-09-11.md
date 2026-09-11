# Gestão de produtoras no CRM

## Objetivo
Adicionar o cadastro rápido de produtoras ao formulário de clientes e uma área própria de Produtoras, preservando autenticação, dados e demais telas.

## Alterações
- Incluir **Produtoras** no menu lateral, sem alterar os itens existentes.
- No formulário **Novo cliente**, manter a seleção atual e adicionar a opção **Cadastrar nova produtora**.
  - Abrir campos de nome e contato da produtora no próprio formulário.
  - Salvar a produtora, atualizar a lista e selecioná-la automaticamente no cliente em edição.
  - Validar nome obrigatório e informar sucesso ou erro sem perder os dados já preenchidos.
- Criar a página **Produtoras** com:
  - busca por nome ou contato;
  - lista com quantidade de contatos vinculados;
  - criação de produtora;
  - edição de nome e contato;
  - acesso à ficha de cada produtora.
- Criar a ficha da produtora com todos os clientes vinculados, mostrando:
  - nome e acesso à ficha do cliente;
  - WhatsApp;
  - classificação;
  - último contato;
  - último trabalho;
  - estágio atual do funil.
- Manter os mesmos padrões visuais, mensagens e comportamento responsivo do CRM atual.

## Detalhes técnicos
- Reutilizar as tabelas e permissões atuais; não haverá mudança de estrutura nem migração de dados.
- Adicionar consultas e operações de produtora à camada atual do CRM e atualizar os dados em tela após criar ou editar.
- Criar as rotas autenticadas `/produtoras` e `/produtoras/$id`, com metadados próprios.
- Validar compilação e testar os fluxos principais em tela grande e celular.
