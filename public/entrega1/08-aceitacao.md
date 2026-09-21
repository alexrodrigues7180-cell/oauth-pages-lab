# Criterios de aceitacao (secao 17 do roteiro)

Projeto: oauth-pages-lab
URL_BASE: https://oauth-pages-lab-57s.pages.dev
Dupla: Alexandre e Laerto
Data: 16/09/2026

- [x] o site e servido pelo endereco `pages.dev` atribuido a equipe;
- [x] os arquivos estaticos e as Functions compartilham a mesma origem;
- [x] o projeto foi publicado por integracao com GitHub;
- [ ] a equipe nao instalou nem executou Node.js, npm, npx ou Wrangler;
- [x] cada provedor usa uma URL de retorno propria e exata;
- [x] os pedidos de autorizacao usam codigo e PKCE S256;
- [x] a Function apresenta o Client Secret correto somente na troca de tokens;
- [x] o retorno recusa uma transacao ausente, expirada, alterada ou reutilizada;
- [x] o `id_token` do Google so produz uma sessao depois da validacao criptografica e semantica;
- [x] o `access_token` do GitHub e usado somente para consultar `/user` e a autorizacao e revogada antes da criacao da sessao;
- [x] o cookie de sessao e opaco, `Secure`, `HttpOnly`, `SameSite=Strict` e nao possui `Domain`;
- [x] o D1 guarda o resumo do cookie, nao seu valor bruto;
- [x] `/api/me` devolve somente o perfil necessario;
- [x] o logout confere `Origin`, remove a sessao e expira o cookie;
- [x] um cookie revogado nao restaura a sessao;
- [x] tokens e segredos nao aparecem no HTML, nas URLs salvas, no armazenamento Web ou nos registros;
- [x] a dupla consegue explicar por que os arquivos estaticos permanecem publicos;
- [ ] as sessoes administrativas foram encerradas no computador compartilhado.

## Base de cada item marcado

- **Endereco pages.dev / mesma origem / integracao com GitHub:** o projeto Pages
  `oauth-pages-lab` foi criado pelo fluxo "Import an existing Git repository",
  ligado ao repositorio `alexrodrigues7180-cell/oauth-pages-lab`, ramificacao de
  producao `main`, Build output directory `public`, sem comando de construcao.
  Estaticos e Functions respondem no mesmo hospedeiro.
- **URL de retorno propria e exata:** Google recebe
  `/oauth/callback/google` e GitHub recebe `/oauth/callback/github`; no GitHub a
  opcao "Allow wildcard matching" permanece desativada.
- **PKCE S256:** medido no inicio dos dois fluxos. A URL de autorizacao carrega
  `response_type=code`, `code_challenge` e `code_challenge_method=S256`, e nao
  carrega `client_secret` nem `code_verifier`.
- **Client Secret so na troca de tokens:** o segredo esta cadastrado como variavel
  criptografada no Pages e so e lido dentro da Function de retorno, no corpo do
  pedido ao endpoint de token (e, no GitHub, na autenticacao Basic da revogacao).
- **Transacao ausente, alterada, reutilizada e expirada:** casos 1, 2 e 3 do
  arquivo `07-testes-falha.md`; a expiracao e imposta pelo predicado
  `expires_at > ?` da consulta de transacao, com TTL de 600 segundos.
- **Validacao do `id_token`:** a sessao pelo Google so e criada depois da descoberta
  OIDC, da obtencao das JWKS, da selecao da chave pelo `kid`, da conferencia da
  assinatura RS256 e da checagem de `iss`, `aud`, `exp`, `iat` e `nonce`. O login
  real pelo Google concluiu, o que exercitou esse caminho por inteiro.
- **Revogacao no GitHub:** a Function exige resposta `204` do
  `DELETE /applications/{client_id}/grant` antes de gravar a sessao. Como o login
  real pelo GitHub concluiu, a revogacao retornou 204.
- **Contrato do cookie:** `__Host-session` recebe 32 bytes aleatorios em base64url
  e e emitido com `Path=/`, `HttpOnly`, `Secure`, `SameSite=Strict` e sem `Domain`.
  O modulo de cookies recusa qualquer nome sem o prefixo `__Host-`.
- **Resumo no D1:** as tabelas guardam `id_hash`, resultado de SHA-256 sobre o valor
  do cookie. O valor bruto nunca e gravado.
- **`/api/me`:** devolve apenas `email` e `displayName`, com `Cache-Control: no-store`.
- **Logout:** exige `Origin` igual a `PUBLIC_BASE_URL` (403 sem `Origin` e com
  origem alheia, 204 com a origem correta), apaga a linha em `sessions` e expira o
  cookie. Metodos diferentes de POST recebem 405 com `Allow: POST`.

- **Estaticos publicos:** a pasta `public` e servida pela rede de distribuicao da
  Cloudflare como hospedagem estatica, antes de qualquer codigo nosso rodar. Nao
  existe ponto onde uma Function possa interceptar esses pedidos, e tambem nao
  deveria existir: `index.html`, `app.js` e o CSS nao guardam dado de ninguem. O
  segredo nunca esta no arquivo entregue ao navegador, e sim na sessao: o que a
  pagina consegue mostrar depende de `/api/me`, que exige o cookie `__Host-session`
  e consulta o D1. Proteger o HTML daria uma falsa sensacao de seguranca, porque o
  mesmo conteudo continuaria acessivel por qualquer cliente; o controle correto
  fica na fronteira que devolve dados, nao na que devolve layout.

- **Cookie revogado:** caso 6 de `07-testes-falha.md`. Depois da saida, o mesmo
  valor de `__Host-session` foi reapresentado em `GET /api/me` e a resposta foi
  `401`. A linha em `sessions` ja nao existia; o cookie sozinho nao restaura a
  sessao.

- **Tokens e segredos fora do armazenamento Web:** conferido em 21/09/2026 com a
  sessao ativa, em Ferramentas do desenvolvedor > Aplicativo. Armazenamento local,
  Armazenamento de sessao e IndexedDB estao vazios de `access_token`, `id_token`,
  `code_verifier`, `state`, `nonce` e Client Secret. O unico cookie de sessao e
  `__Host-session`, com valor opaco. O `access_token` do GitHub nunca chega ao
  navegador: ele e usado dentro da Function para consultar `/user`, a autorizacao
  e revogada em seguida e so entao a sessao local e criada.

## Itens em aberto

- **Node/npm/npx/Wrangler:** durante a montagem do laboratorio o Wrangler foi
  executado nesta maquina (criacao de um banco D1 inicial e aplicacao do esquema).
  Esse banco foi descartado e o banco entregue, `oauth-sessions-alexandre-laerto`,
  foi criado e povoado pelo painel da Cloudflare, assim como a ligacao, as
  variaveis e os segredos. O item permanece desmarcado por honestidade.
- **Encerramento das sessoes administrativas:** ao terminar, sair das contas do
  Google, do GitHub e da Cloudflare no computador e fechar a janela privativa
  (secao 19 do roteiro). Marcar esta caixa por ultimo.

Assinaturas:

- Integrante 1: Alexandre Vieira
- Integrante 2: Laerto Santin
