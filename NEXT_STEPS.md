# Estado do laboratório

Todo o código está pronto e testado localmente (o que dava para testar sem contas
reais). O que falta são as etapas que exigem suas contas do GitHub, Google Cloud e
Cloudflare — ninguém além de você pode fazer isso, porque dependem de login,
2FA e criação de recursos na sua conta.

## O que já está pronto

- Estrutura completa do repositório (`public/` + `functions/`), copiando o
  template do dashboard (`~/meu-dashboard`) para dentro de `public/`.
- `public/index.html` novo: página de login com botões Google/GitHub, status de
  sessão e link para o dashboard depois de autenticado.
- `public/app.js`: consulta `/api/me` e alterna a UI (login vs. sessão ativa).
- Todas as Pages Functions da seção 13 do roteiro:
  - `functions/_shared/crypto.js` — aleatoriedade e SHA-256 via Web Crypto.
  - `functions/_shared/cookies.js` — cookies `__Host-*`.
  - `functions/_shared/providers.js` — endpoints do Google e GitHub.
  - `functions/_shared/oidc.js` — validação completa do `id_token` do Google
    (descoberta OIDC, JWKS, `kid`, RS256, `iss`/`aud`/`exp`/`iat`/`nonce`).
  - `functions/oauth/login/[provider].js`, `functions/oauth/callback/[provider].js`,
    `functions/oauth/logout.js`, `functions/api/health.js`, `functions/api/me.js`.
- `db/schema.sql` — pronto para colar no console do D1.
- `public/entrega1/` — modelos dos arquivos de evidência que dá para preparar
  sem uma implantação real (veja `public/entrega1/README-PENDENCIAS.md`).
- Repositório git local iniciado (branch `main`), pronto para o `git push`.

### O que eu testei localmente (sem tocar em nada de produção)

Rodei `wrangler pages dev` com um banco D1 local (via Miniflare) e credenciais
falsas, e confirmei:

- `/api/health` → 200; `/` → 200.
- `/oauth/login/badprovider` e `/oauth/callback/badprovider` → 404.
- `/api/me` sem cookie → 401. `POST /oauth/logout` sem `Origin` → 403.
- `/oauth/login/google` → 302 com `Set-Cookie: __Host-oauth-tx=...`, e a URL de
  redirecionamento contém exatamente `response_type=code`, `code_challenge`,
  `code_challenge_method=S256`, `scope=openid email profile` e `nonce` — sem
  Client Secret nem `code_verifier`.
- `/oauth/login/github` → igual, mas sem `scope`/`nonce`.
- `/oauth/callback/google` com `state` errado → 400 antes de trocar o código.
- `/oauth/callback/google` com transação já usada (reenvio) → 400 (uso único).
- `/oauth/callback/google` com credenciais falsas → degrada para 400 (não 500,
  não vaza stack trace) quando a troca de tokens falha de verdade.

O que **não** dá para testar localmente: o fluxo completo com o Google e o
GitHub reais, porque os dois exigem uma URL de retorno HTTPS pública (o
próprio roteiro deixa isso explícito na seção 4).

## O que falta (na ordem do roteiro)

1. **Criar o repositório no GitHub** (seção 7.1). Repositório novo, branch
   `main`, pode ser privado. Depois:
   ```
   cd ~/oauth-pages-lab
   git remote add origin <URL_DO_REPOSITORIO_NOVO>
   git push -u origin main
   ```
2. **Cloudflare Pages** (seção 8): Workers & Pages → Create → Pages → Connect
   to Git → selecione o repositório → branch de produção `main` → Framework
   preset `None`, build command vazio, Build output directory `public`.
3. **D1** (seção 9): criar o banco `oauth-sessions-EQUIPE`, abrir o Console e
   colar o conteúdo de `db/schema.sql`. Depois, em Settings > Bindings do
   projeto Pages, criar a ligação D1 com **Variable name** `DB`.
4. **Google Cloud** (seção 10): tela de consentimento em teste, cliente Web
   com redirect `URL_BASE/oauth/callback/google`, escopos `openid email profile`.
5. **GitHub OAuth App** (seção 11): Homepage URL = `URL_BASE`, Authorization
   callback URL = `URL_BASE/oauth/callback/github`, Device Flow desativado.
6. **Variáveis e segredos no Pages** (seção 12): `PUBLIC_BASE_URL`,
   `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID` como texto; `GOOGLE_CLIENT_SECRET` e
   `GITHUB_CLIENT_SECRET` marcados como **Encrypt**. Depois, gatilhar um novo
   deploy.
7. **Testar pelo navegador** (seções 15 e 16) e preencher `public/entrega1/`
   com os arquivos que faltam (veja o checklist em
   `public/entrega1/README-PENDENCIAS.md`).

Depois que a `URL_BASE` existir, é só substituir o placeholder nos arquivos
`public/entrega1/02-google-retorno.txt` e `03-github-retorno.txt`.
