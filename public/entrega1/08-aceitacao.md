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
- [ ] um cookie revogado nao restaura a sessao;
- [ ] tokens e segredos nao aparecem no HTML, nas URLs salvas, no armazenamento Web ou nos registros;
- [ ] a dupla consegue explicar por que os arquivos estaticos permanecem publicos;
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

## Itens em aberto

- **Node/npm/npx/Wrangler:** durante a montagem do laboratorio o Wrangler foi
  executado nesta maquina (criacao de um banco D1 inicial e aplicacao do esquema).
  Esse banco foi descartado e o banco entregue, `oauth-sessions-alexandre-laerto`,
  foi criado e povoado pelo painel da Cloudflare, assim como a ligacao, as
  variaveis e os segredos. O item permanece desmarcado por honestidade.
- **Cookie revogado:** caso 6 de `07-testes-falha.md`, ainda por executar.
- **Tokens e segredos fora do armazenamento Web:** conferencia pendente no navegador.
- **Explicacao sobre os estaticos publicos** e **encerramento das sessoes
  administrativas:** a cargo da dupla.

Assinaturas:

- Integrante 1:
- Integrante 2:
