# SECURITY.md — Baseline de Segurança Fropty

> **Para o Claude Code:** este documento é a política de segurança obrigatória para qualquer página, SaaS ou app dentro do ecossistema Fropty (fropty-hub, fropty-site, Mel & Café, Luz, BR Brotherhood e qualquer projeto futuro). Antes de criar rotas, formulários, autenticação, variáveis de ambiente ou qualquer integração externa, revise este arquivo. Nenhum item aqui é "nice to have" — são requisitos mínimos. Se uma implementação violar algum ponto, sinalize antes de prosseguir e proponha a correção.

---

## 0. Princípios que guiam tudo isso

1. **Nunca confie no cliente.** Tudo que roda no navegador pode ser lido, editado e re-enviado por qualquer pessoa com o DevTools aberto. Toda decisão de segurança real (autenticação, autorização, limites de uso, preço, permissão) tem que ser validada no servidor — o frontend só pode *refletir* essas decisões, nunca *tomá-las*.
2. **Defesa em profundidade.** Nunca dependa de uma única camada. Ex: RLS no banco **e** checagem na API **e** validação de input — não escolha uma só.
3. **Least privilege.** Toda chave, usuário de banco, service account ou policy começa com o mínimo de acesso possível e só ganha mais se for justificado.
4. **Secrets nunca viajam para o cliente, nunca vão pro Git, nunca aparecem em log.**
5. **Nada de "vou proteger depois".** Autenticação, RLS e variáveis de ambiente são configuradas desde o primeiro commit, não retrofit.

---

## 1. Variáveis de ambiente e segredos

- Todo segredo real (service role key, chaves de API de terceiros, webhook secrets, tokens de integração) vive **exclusivamente** nas Environment Variables da Vercel (Production / Preview / Development separados), nunca hardcoded no código.
- `.env`, `.env.local`, `.env*.local` sempre no `.gitignore`. Manter um `.env.example` versionado, só com nomes de variáveis e valores fake, para documentar o que o projeto precisa.
- **Regra do prefixo `NEXT_PUBLIC_`:** tudo que leva esse prefixo é embutido no bundle JS e fica público, literalmente legível por qualquer visitante. Antes de prefixar uma variável, pergunte: "essa informação pode aparecer no código-fonte de uma página aberta na internet?". Se a resposta for não, ela é `NEXT_PUBLIC_` proibida.
  - **Nuance importante sobre o Supabase:** a `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY` é *desenhada para ser pública* — o modelo de segurança do Supabase não depende de esconder essa chave, depende inteiramente das políticas de RLS no banco. Ou seja, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são normais e esperadas no cliente. O que **nunca** pode ter prefixo `NEXT_PUBLIC_` — nem em rascunho, nem "só pra testar" — é a `SUPABASE_SERVICE_ROLE_KEY`, que ignora todo RLS e dá acesso total ao banco. Ela só existe em código server-side (API routes, server actions, Edge Functions).
- Rotação: qualquer chave que vazar (ex: commit acidental, log exposto) é revogada e trocada imediatamente — não só removida do código, porque git history mantém o valor antigo acessível.
- Nenhuma variável de ambiente de produção duplicada em `vercel.json` ou em arquivos de config commitados.

## 2. Frontend / client-side

- Nenhuma lógica de negócio sensível (cálculo de preço final, validação de permissão, decisão de "esse usuário pode ou não fazer X") roda só no cliente. O cliente pode sugerir/otimizar UX, mas a decisão real é sempre recalculada no servidor antes de qualquer efeito colateral (salvar, cobrar, liberar conteúdo).
- Source maps de produção desabilitados (`productionBrowserSourceMaps: false` no `next.config.js`, que já é o padrão do Next.js — apenas confirmar que ninguém habilitou por engano).
- **Importante entender o limite disso:** esconder o source map dificulta a leitura, mas não impede. Qualquer JS que chega ao navegador pode ser inspecionado, formatado e lido com paciência. Isso é *obfuscação*, não *controle de acesso*. A proteção real de qualquer regra de negócio é ela nunca sair do servidor.
- Minificação e tree-shaking padrão do Next.js mantidos ativos; não desabilitar em produção.
- Nenhuma chave de API de terceiros (pagamento, IA, e-mail transacional) chamada diretamente do frontend — sempre via API route/server action que guarda a chave no servidor.

## 3. Armazenamento no navegador

**localStorage**
- Nunca armazenar: token de acesso/refresh de autenticação, CPF, e-mail, telefone, endereço, dados de pagamento ou qualquer PII (dado pessoal identificável). localStorage é acessível por qualquer script JS rodando na página — inclusive um script malicioso injetado via XSS.
- **Ponto de atenção específico do Supabase:** o `supabase-js` puro, por padrão, guarda a sessão (access token + refresh token) em localStorage. Para qualquer projeto Next.js com SSR (App Router), o correto é usar o pacote `@supabase/ssr`, que move a sessão para cookies em vez de localStorage — isso já reduz a superfície de exposição a XSS e permite validar sessão no servidor (middleware, Server Components) em vez de confiar em algo lido no cliente.
- Vale registrar uma limitação conhecida da comunidade: os cookies que o `@supabase/ssr` cria **não são `httpOnly` por padrão** — a lib precisa ler/escrever eles no cliente para funcionar. Ou seja, cookie-based já é melhor que localStorage puro, mas não é "impossível de ler via XSS" por si só. A mitigação real contra isso é evitar XSS na origem (sanitização de input, CSP forte — ver seção 5) e manter o tempo de vida do access token curto, com refresh token rotativo.

**sessionStorage**
- Mesma regra: nada de token de auth ou PII.
- O navegador já limpa sessionStorage automaticamente quando a aba/janela fecha — isso é comportamento nativo, não precisa reimplementar. A ressalva é que alguns navegadores restauram sessionStorage ao usar "reabrir aba fechada" ou recuperação de sessão após crash, então não é uma garantia absoluta de "some para sempre" — e enquanto a aba está aberta, sessionStorage é tão legível por XSS quanto localStorage. Não é um cofre, é só volátil.

**Cookies**
- Todo cookie que carrega token de sessão/autenticação: `HttpOnly` (JS não consegue ler), `Secure` (só trafega em HTTPS) e `SameSite=Lax` (ou `Strict` se o fluxo de auth permitir, evita envio em requisições cross-site — mitiga CSRF).
- Cookies com PII: evitar sempre que possível. Se for inevitável (ex: preferência de idioma com algum dado), nunca dado sensível em texto plano.
- `Max-Age`/`Expires` definidos explicitamente — nada de cookie de sessão "eterno" por omissão.

## 4. CORS

- Nunca `Access-Control-Allow-Origin: *` em rotas que exigem autenticação ou retornam dados de usuário.
- Allowlist explícita de origens (produção: `https://fropty.com`, `https://hub.fropty.com`, etc.; preview: domínios `*.vercel.app` do projeto, se necessário) configurada por variável de ambiente, não hardcoded espalhado pelo código.
- `Access-Control-Allow-Credentials: true` só quando a origem for validada contra a allowlist — nunca combinado com wildcard `*`.
- Rotas internas (API routes que só o próprio frontend deveria chamar) não precisam de CORS aberto nenhum; o padrão é bloquear cross-origin por completo e abrir exceção pontual só quando houver uma razão de negócio real (ex: um widget embutido em outro domínio).

## 5. CSP (Content-Security-Policy) e headers de segurança

Configurar via `next.config.js` (`headers()`) ou middleware, aplicado a todas as rotas:

```js
// next.config.js — exemplo de ponto de partida, ajustar por projeto
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`;
```

- Preferir CSP com **nonce** para scripts inline (o Next.js suporta isso via middleware) em vez de `'unsafe-inline'` em `script-src` — `unsafe-inline` anula boa parte da proteção contra XSS que a CSP existe para dar.
- Outros headers obrigatórios em toda resposta:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (ou confiar só no `frame-ancestors` da CSP, que é mais moderno)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restringindo APIs sensíveis não usadas (câmera, microfone, geolocalização) — `camera=(), microphone=(), geolocation=()` como padrão, liberando só o que o produto realmente usa.
- Testar CSP em modo `Content-Security-Policy-Report-Only` antes de aplicar em modo bloqueante, pra não quebrar nada em produção sem perceber.

## 6. Autenticação e sessão (Supabase Auth)

- Fluxo PKCE (padrão do `@supabase/ssr`) em vez do fluxo implícito — o token não fica exposto na URL de redirect.
- No servidor, usar `supabase.auth.getUser()` (valida contra o servidor de auth) para decisões de autorização — nunca confiar apenas em `getSession()`/no objeto de usuário decodificado do JWT local para autorizar uma ação sensível, porque esse dado não é revalidado contra o Supabase a cada leitura.
- Middleware do Next.js revalidando/renovando sessão em rotas protegidas; páginas autenticadas marcadas como dinâmicas (evitar cache/ISR em rotas que passam por refresh de sessão — response cacheada com `Set-Cookie` pode logar um usuário como sendo outro).
- Rate limiting no login/signup/reset de senha (proteção contra brute force e credential stuffing) — Supabase tem alguns limites nativos, mas para produção considerar camada extra (Vercel Edge Middleware, Upstash Ratelimit ou Arcjet).
- Se o produto tiver dado sensível ou for B2B (ex: painel admin do Hub), avaliar MFA.
- Nunca logar token de acesso, refresh token ou senha em nenhum lugar (console, Sentry, analytics).

## 7. Autorização e RLS (Row Level Security)

- **RLS habilitado em toda tabela do Supabase, sem exceção, desde a criação da tabela.** Uma tabela sem RLS com a anon key exposta é acesso público de leitura/escrita para qualquer pessoa com a URL do projeto.
- Política padrão é "negar tudo" e liberar policy por policy o que faz sentido (`SELECT` só das próprias linhas, `INSERT`/`UPDATE` validando `auth.uid()`, etc.) — nunca começar de "permitir tudo" e restringir depois.
- Toda regra de autorização crítica existe **em pelo menos duas camadas**: RLS no banco *e* checagem explícita na API route/server action. Se um bug de lógica na API deixar passar algo, o RLS é a rede de segurança; e vice-versa.
- `service_role` key só é usada em contexto 100% server-side, para operações administrativas específicas que realmente precisam ignorar RLS (ex: webhook de pagamento gravando um registro em nome do sistema) — nunca como atalho para "RLS tá dando trabalho".

## 8. Validação de entrada e proteção contra injeção

- Toda entrada de usuário (formulário, query param, body de API, upload) validada no servidor com schema (ex: Zod) antes de tocar em banco, e-mail ou qualquer processamento — validação no frontend é só UX, é sempre reexecutada no backend.
- Queries ao Supabase via client library (parametrizadas por padrão) — nunca concatenar string de usuário em SQL cru.
- Conteúdo gerado por usuário que será renderizado como HTML (ex: descrição de produto, comentário) sanitizado contra XSS antes de salvar ou antes de renderizar (nunca `dangerouslySetInnerHTML` com conteúdo não sanitizado).
- Upload de arquivo: validar tipo real do arquivo (magic bytes, não só a extensão), limite de tamanho, e nome de arquivo sanitizado antes de gravar no Supabase Storage.

## 9. Proteção contra abuso e uso indevido ("acesso de graça")

Isso conecta direto com sua primeira anotação — a forma certa de pensar nisso não é "evitar requisições no frontend" (impossível: todo app web faz requisições, e qualquer uma pode ser reproduzida manualmente com curl/Postman ignorando o frontend inteiro). O que protege de verdade é:

- **Toda ação que consome um recurso pago/limitado é validada no servidor a cada chamada**, checando o estado real da assinatura/plano do usuário no banco — nunca confiando em uma flag que veio do cliente ou que foi checada só uma vez no login.
- Rate limiting por usuário e por IP em endpoints sensíveis (geração de conteúdo, envio de e-mail, criação de recursos) — Vercel Edge Middleware + Upstash Redis, ou um serviço como Arcjet, são caminhos comuns.
- Idempotency keys em operações que não podem ser duplicadas por retry (ex: criação de pedido, cobrança).
- Webhooks de pagamento (Stripe, Pix/gateway usado) sempre validados por assinatura HMAC — nunca confiar em payload de webhook sem verificar a assinatura, senão qualquer pessoa pode simular "pagamento aprovado" chamando seu próprio endpoint.
- Enforcement de plano/feature-flag também na RLS quando fizer sentido (ex: uma policy que só libera `SELECT` numa tabela de "recurso premium" se o `auth.uid()` tiver uma assinatura ativa) — assim mesmo que alguém descubra o endpoint da API, o banco também barra.
- CAPTCHA/verificação anti-bot em formulários públicos de alto valor (signup, geração de trial) se abuso automatizado for um risco real para o produto.

## 10. Dependências e supply chain

- `npm audit` (ou equivalente) rodando no CI, não só localmente.
- Dependabot (ou Renovate) habilitado no GitHub para PRs automáticos de atualização de segurança.
- Lockfile (`package-lock.json`/`pnpm-lock.yaml`) sempre commitado — build reprodutível, sem "funcionava ontem".
- Antes de adicionar uma dependência nova, checar: é mantida ativamente? tem muitos downloads/uso? não tem histórico de vulnerabilidade não corrigida? Evitar pacotes obscuros para tarefas triviais que dá pra escrever em poucas linhas.

## 11. Logs, monitoramento e resposta a incidentes

- Nunca logar: senha, token, chave de API, CPF, dados de cartão, corpo completo de request que contenha PII.
- Mensagens de erro para o usuário são genéricas ("Falha na autenticação", "Algo deu errado"); o detalhe técnico completo vai só para log server-side (Vercel Logs, Sentry).
- Alertas configurados para picos anômalos de erro 401/403 (possível tentativa de acesso indevido) e de rate-limit hit.

## 12. CI/CD e deploy (Vercel)

- Environment Variables separadas por ambiente (Production / Preview / Development) na Vercel — chave de teste de um provedor de pagamento nunca reaproveitada em produção e vice-versa.
- Branch protection no `master`/branch de produção: revisão obrigatória antes de merge em projetos com mais de uma pessoa mexendo (hoje é você + Everton — vale já habilitar).
- Preview deployments não devem expor dados reais de produção — usar banco/projeto Supabase separado para desenvolvimento quando o dado for sensível.
- Segredo nunca aparece em log de build da Vercel — cuidado com `console.log` de objetos de config inteiros durante debug.

## 13. LGPD — atenção específica a dado pessoal brasileiro

Como você já mencionou CPF, e-mail e telefone: isso é dado pessoal sob a LGPD, o que muda algumas coisas:

- Minimização: coletar só o dado pessoal que o produto realmente precisa para funcionar, não "pode ser útil depois".
- Base legal e finalidade clara para cada dado coletado (isso é mais jurídico que técnico, mas afeta o design do banco — vale conversar com alguém que valide a parte legal quando o Fropty tiver CNPJ formalizado).
- Dado sensível (CPF, por exemplo) idealmente não fica em texto plano acessível por qualquer policy de leitura — considerar mascarar na exibição (ex: mostrar só os 3 últimos dígitos) mesmo para o próprio usuário dono do dado, quando não houver necessidade de mostrar completo.
- Direito de exclusão: ter um caminho (mesmo que manual no início) para apagar os dados de um usuário que pedir.

---

## Checklist rápido antes de qualquer deploy em produção

- [ ] Nenhum secret com prefixo `NEXT_PUBLIC_` além do que é *por design* público (URL e anon key do Supabase)
- [ ] `.env*` no `.gitignore`, nada de segredo no histórico do Git
- [ ] RLS habilitado e testado em toda tabela nova
- [ ] Toda rota sensível revalida autorização no servidor, não só no frontend
- [ ] CORS restrito a origens conhecidas
- [ ] CSP e headers de segurança presentes na resposta (checar com `curl -I` ou DevTools > Network)
- [ ] Cookies de sessão com `HttpOnly` + `Secure` + `SameSite`
- [ ] Nenhum token/PII em localStorage ou sessionStorage
- [ ] Rate limiting nos endpoints que custam dinheiro ou são alvo óbvio de abuso
- [ ] Webhooks de pagamento validando assinatura
- [ ] `npm audit` limpo (ou vulnerabilidades conhecidas e aceitas conscientemente)
- [ ] Nenhum `console.log` de dado sensível esquecido no código

---

*Última observação: segurança web muda rápido — o que está aqui é a base sólida de hoje (jul/2026), mas vale revisitar este arquivo a cada poucos meses e, principalmente, sempre que o Next.js, o Supabase ou a Vercel mudarem alguma recomendação de auth/cookies.*
