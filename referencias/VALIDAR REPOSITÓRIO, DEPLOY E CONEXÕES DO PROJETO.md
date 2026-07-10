# PROMPT — VALIDAR REPOSITÓRIO, DEPLOY E CONEXÕES DO PROJETO

Antes de implementar as mudanças visuais e funcionais do portal Alison Estevam Studio, preciso que você faça uma auditoria técnica completa do ambiente atual.

O projeto já possui:

## GitHub

Repositório:

```text
https://github.com/fropty-com/Alison-Estevam-Studio

Vercel

Deploys/domínios:

alison-estevam-studio-ep78ui299-froptyapps-projects.vercel.app
alison-estevam-studio.vercel.app
Supabase

Projeto:

https://mgzwmunzvtrwmhykyxcl.supabase.co

Organização:

froptyapps's Org

Nome do projeto:

Alison-Estevam-Studio
Objetivo

Validar se o projeto está corretamente conectado entre:

GitHub;
Vercel;
Supabase;
variáveis de ambiente;
autenticação;
banco de dados;
fluxo de agendamento;
deploy de produção;
domínio final.

Não implemente mudanças visuais ainda antes de concluir essa auditoria.

1. Auditoria do GitHub

Verifique:

se o repositório correto está clonado;
branch principal atual;
histórico recente de commits;
estrutura de pastas;
framework usado;
versão do Node;
package manager usado;
scripts disponíveis;
dependências principais;
se há arquivos duplicados, mortos ou legados;
se existe .env.example;
se existe configuração para Supabase;
se existe configuração para Vercel;
se o projeto builda localmente.

Rodar, conforme o projeto:

npm install
npm run lint
npm run build
npm run dev

ou equivalente com pnpm/yarn, se for o caso.

2. Auditoria da Vercel

Validar:

se o repositório GitHub está conectado ao projeto correto na Vercel;
se o deploy de produção está apontando para o domínio correto;
se alison-estevam-studio.vercel.app é o domínio principal;
se o domínio preview também está funcional;
se o build da Vercel está passando;
se existem erros nos logs de build;
se existem erros nos logs runtime;
se as variáveis de ambiente estão cadastradas;
se as variáveis estão disponíveis nos ambientes:
Production;
Preview;
Development.

Verifique também:

framework preset;
build command;
output directory;
install command;
Node version;
redirects/rewrites;
configuração de domínio;
cache;
funções serverless, se existirem.
3. Auditoria do Supabase

Validar projeto:

https://mgzwmunzvtrwmhykyxcl.supabase.co

Verifique:

se a URL do Supabase usada no código bate com essa URL;
se existe NEXT_PUBLIC_SUPABASE_URL;
se existe NEXT_PUBLIC_SUPABASE_ANON_KEY;
se existe SUPABASE_SERVICE_ROLE_KEY, caso o backend precise;
se as keys estão configuradas corretamente na Vercel;
se o client Supabase está sendo inicializado corretamente;
se não há keys expostas indevidamente no frontend;
se existe schema/tabelas para agendamento;
se existem policies RLS;
se o fluxo de gravação/leitura funciona;
se a autenticação está habilitada ou não;
se há buckets de storage para imagens;
se as imagens do site vêm do Supabase ou de assets locais.
4. Banco de dados esperado para agendamento

Caso ainda não exista, proponha e implemente uma estrutura limpa para o agendamento.

Sugestão de tabelas:

services

Campos:

id;
name;
slug;
description;
price_cents;
duration_minutes;
is_active;
is_whatsapp_only;
created_at;
updated_at.
complements

Campos:

id;
name;
slug;
description;
price_cents;
duration_minutes;
is_active;
created_at;
updated_at.
service_complements

Campos:

service_id;
complement_id.
appointments

Campos:

id;
customer_name;
customer_phone;
service_id;
appointment_date;
appointment_time;
duration_minutes;
total_price_cents;
status;
notes;
created_at;
updated_at.
appointment_complements

Campos:

appointment_id;
complement_id.

Status sugeridos:

pending;
confirmed;
cancelled;
completed.
5. Regras de segurança do Supabase

Validar ou criar RLS de forma segura.

Regras esperadas:

frontend pode ler serviços ativos;
frontend pode ler complementos ativos;
frontend pode criar solicitação de agendamento;
frontend não deve poder listar todos os agendamentos publicamente;
service role pode administrar dados;
nenhuma chave sensível deve ser exposta no client.

Se for necessário usar API routes/server actions para proteger gravações, implemente.

6. Testes de conexão

Criar testes simples para validar:

conexão com Supabase;
leitura de serviços;
leitura de complementos;
criação de agendamento de teste;
cálculo de valor total;
bloqueio de horários inválidos;
bloqueio de domingo;
bloqueio de horários fora da janela;
serviço de 2h respeitando duração.

Não deixar dados de teste poluindo produção. Se criar registro de teste, remover ou marcar como teste.

7. Validação do fluxo de agendamento

Depois de validar as conexões, testar o fluxo completo:

usuário entra no site;
clica em Agendar;
escolhe serviço;
escolhe complementos opcionais;
escolhe data;
escolhe horário;
revisa resumo;
confirma;
dados são salvos ou preparados corretamente;
WhatsApp abre com mensagem preenchida.

Verificar especialmente:

valor total;
data formatada em pt-BR;
horário correto;
serviço correto;
complementos corretos;
atendimento exclusivo redirecionando para WhatsApp;
responsividade no mobile.
8. Variáveis de ambiente esperadas

Validar e documentar:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_WHATSAPP_NUMBER=

Se alguma variável estiver faltando, apontar claramente.

Não expor valores sensíveis na resposta final.

9. Deploy

Depois dos testes:

rodar build local;
corrigir erros;
commitar alterações;
subir para GitHub;
confirmar deploy na Vercel;
validar URL de preview;
validar produção;
testar fluxo em produção.
10. Relatório final obrigatório

Ao final da auditoria, entregar um relatório com:

GitHub
repositório validado;
branch usada;
comandos executados;
resultado do build;
problemas encontrados;
correções feitas.
Vercel
projeto validado;
domínio principal;
status do deploy;
variáveis revisadas;
problemas encontrados;
correções feitas.
Supabase
projeto validado;
tabelas encontradas/criadas;
policies verificadas/criadas;
conexão testada;
problemas encontrados;
correções feitas.
Agendamento
fluxo testado;
regras validadas;
pontos pendentes.
Próximos passos
somente depois dessa auditoria, seguir para a reconstrução visual e funcional do site conforme o prompt principal.

Importante: não invente resultados. Se não conseguir acessar GitHub, Vercel ou Supabase, informe exatamente qual acesso faltou e quais permissões são necessárias.