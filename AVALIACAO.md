# Avaliação: GitHub Actions com IA

Dupla: Alexandre Vieira e Laerto Santin
Repositório: `alexrodrigues7180-cell/oauth-pages-lab` (site publicado em
https://oauth-pages-lab-57s.pages.dev — Cloudflare Pages + Functions + D1 + OAuth2/PKCE)

## Tarefa 1 — CI a cada commit

Workflow: `.github/workflows/ci.yml`. Dispara em todo `push` e em `pull_request` para a `main`.
Três verificações: segredo versionado, migrações D1 em SQLite local, HTML válido.

Lacunas completadas:

- migrações: `for f in migrations/*.sql; do sqlite3 teste.db < "$f" ; done`
- HTML: `npx --yes htmlhint --ignore "public/pages/**" "**/*.html"`

O `--ignore` foi necessário porque `public/pages/` guarda as páginas de demonstração do tema
Volt (terceiro), que têm 9 erros de `id-unique` e `spec-char-escape` que não são nossos. As
páginas do site — `public/index.html` e `public/404.html` — são validadas sem exceção.

| Execução | Resultado | Link |
|---|---|---|
| Migração com erro de sintaxe (proposital) | vermelha | https://github.com/alexrodrigues7180-cell/oauth-pages-lab/actions/runs/37698325417 |
| Migração corrigida | verde | https://github.com/alexrodrigues7180-cell/oauth-pages-lab/actions/runs/37698423485 |

Linha do log que mostra o erro:

```
Parse error near line 2: near "CREATE": syntax error
  ALTER TABLE sessions ADD last_seen_at INTEGER CREATE TABLE ;
                                    error here ---^
```

**Por que testar a migração em SQLite antes do D1:** o D1 é SQLite, então um erro de sintaxe
aparece de graça em 2 segundos no runner, antes de o comando tocar o banco de produção — onde
uma migração parcialmente aplicada deixaria o esquema num estado intermediário difícil de desfazer.

Nota de método: a primeira execução (https://github.com/alexrodrigues7180-cell/oauth-pages-lab/actions/runs/37698136034) falhou porque o próprio
`ci.yml` contém o padrão `client_secret *= *...` que ele procura, e o `git grep` encontrou a si
mesmo. Resolvido com `':!.github/workflows/ci.yml'` no pathspec.

## Tarefa 2 — proteger a main com o CI

Ruleset `main protegida pelo CI` (id 24683835), `enforcement: active`, sem bypass actors —
vale inclusive para o dono do repositório. Alvo: `~DEFAULT_BRANCH`. Regras: `pull_request`
(obrigatório), `required_status_checks` com o contexto `verificar`, mais `deletion` e
`non_fast_forward`.

Observação: o repositório era privado numa conta sem plano Pro, e nessa combinação o GitHub
recusa rulesets com `403 — Upgrade to GitHub Pro or make this repository public`. Foi preciso
tornar o repositório público (depois de auditar o histórico: nenhum segredo e nenhum
identificador privado versionado).

- PR de demonstração: https://github.com/alexrodrigues7180-cell/oauth-pages-lab/pull/1
- Bloqueado com a migração quebrada: `mergeStateStatus: BLOCKED`, check `verificar` em FAILURE
- Liberado após a correção na mesma ramificação: `verificar` em SUCCESS, `mergeStateStatus`
  passou de `BLOCKED` para `UNSTABLE` — mesclável. Não é `CLEAN` porque o job `revisar` falha
  enquanto o `COPILOT_PAT` não existe, e ele não é um check obrigatório: só `verificar` é.
  Isso é a Pergunta 4 na prática — a revisão por IA pode estar vermelha e o merge sai assim mesmo.

O PR também mostra **dois** checks `verificar`, um do evento `push` e um do `pull_request`,
que é o caso da Pergunta 1.

`git push` direto na main, recusado:

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote:
remote: - Changes must be made through a pull request.
remote:
remote: - Required status check "verificar" is expected.
remote:
 ! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'https://github.com/alexrodrigues7180-cell/oauth-pages-lab.git'
```

## Tarefa 3 — revisão de PR por IA

Workflow: `.github/workflows/revisao-ia.yml`. Dispara em `opened` e `synchronize`, declara
`contents: read` + `pull-requests: write`, monta o prompt com o diff contra a base, chama
`actions/ai-inference@v3` e publica a resposta com `gh pr comment`.

Já verificado no PR #1: `checkout@v6`, `setup-node@v6`, `npm install -g @github/copilot` e a
montagem do prompt passam; só o step da IA falha, por falta do segredo `COPILOT_PAT`.

**Correção no enunciado.** O esqueleto fixa `actions/ai-inference@v1`, mas também manda rodar
`npm install -g @github/copilot` e passar `COPILOT_GITHUB_TOKEN`. Essas duas coisas são da **v3**:
a `v1` é anterior ao provider Copilot e chama o GitHub Models em
`https://models.github.ai/inference` autenticando com o input `token`, que tem default
`${{ github.token }}`. Ou seja, com `@v1` o segredo `COPILOT_PAT` nunca é lido, e o `GITHUB_TOKEN`
não tem a permissão `models: read` — o workflow falha mesmo com o PAT corretamente configurado.
Trocamos para `actions/ai-inference@v3`.

Nota de método: essa falha **não** se apresenta como erro de autorização. O que aparece é
`API error: TypeError: Cannot use 'in' operator to search for 'choices' in OK` — a action tenta
ler `choices` numa resposta que veio como o texto `OK` em vez de JSON. A mensagem aponta para o
lugar errado, e foi preciso ler os inputs resolvidos no log (`endpoint`, `model`, `max-tokens`)
para perceber que a versão em uso não era a que o resto do workflow pressupunha.

### Evidências

- PR com o SQL vulnerável (`env.DB.prepare(\`... WHERE email = '${email}'\`)`, commit `fa61a47`):
  https://github.com/alexrodrigues7180-cell/oauth-pages-lab/pull/2
- Primeiro comentário da IA, apontando a concatenação:
  https://github.com/alexrodrigues7180-cell/oauth-pages-lab/pull/2#issuecomment-6049039249
  (`StringInjection`, HIGH, confiança 9/10, com a correção sugerida `WHERE email = ?` + `.bind(email, now)`)
- Correção para `prepare("... WHERE email = ?").bind(email, now)` (commit `817e9ce`) e **segundo
  comentário**, disparado pelo `synchronize`:
  https://github.com/alexrodrigues7180-cell/oauth-pages-lab/pull/2#issuecomment-6178827575
  (execução https://github.com/alexrodrigues7180-cell/oauth-pages-lab/actions/runs/38639818085) —
  o comentário diz, textualmente: *"A consulta SQL em `sessoes.js` usa `prepare().bind()`; não
  encontrei SQL montado por concatenação."* O achado HIGH desapareceu entre um comentário e outro.
- Log do erro ao remover `pull-requests: write`: PR auxiliar #3 (https://github.com/alexrodrigues7180-cell/oauth-pages-lab/pull/3), execução
  https://github.com/alexrodrigues7180-cell/oauth-pages-lab/actions/runs/38639925153. Com o workflow declarando apenas `contents: read`, os passos da IA
  rodam normalmente e a falha acontece só na hora de publicar:

```
Run gh pr comment 3 --body-file "/tmp/modelResponse--2376-tt0oTNAuVXj6-.txt"
GraphQL: Resource not accessible by integration (addComment)
##[error]Process completed with exit code 1.
```

  O `GITHUB_TOKEN` continua válido — o que falta é o escopo de escrita em pull requests. Por isso
  o erro aparece como `Resource not accessible by integration` e não como falha de autenticação.

### Crítica: onde a IA erra ou fala o que não importa

No segundo comentário, depois de listar os achados, a IA oferece três ações e encerra com
*"Responda com a opção desejada"*, uma delas sendo *"posso documentar os achados em
`SECURITY-REVIEW.md` e criar um commit"*. As duas coisas são impossíveis no contexto em que ela
está rodando: ninguém vai responder a um comentário escrito por um robô dentro de um job que já
terminou, e o workflow declara `contents: read` — ela não tem permissão para criar commit nenhum.
É resposta de assistente interativo colada num canal onde não existe interação.

No mesmo par de comentários aparece a variação entre execuções: o achado `BrokenAccessControl`
(o endpoint aceita qualquer valor em `__Host-session`) foi repetido nas duas revisões com
confiança 9/10, mas a severidade e as linhas citadas mudaram (MEDIUM em `sessoes.js:7` na
primeira, MEDIUM em `sessoes.js:6-8` na segunda) e, na primeira, o caminho do arquivo saiu como
`/home/runner/work/oauth-pages-lab/oauth-pages-lab/functions/api/sessoes.js` — o caminho interno
do runner, inútil para quem lê o PR.

Vale registrar o contrário também, por honestidade: o achado `LOW` sobre faltar `pipefail` no
`migrar.yml` está **certo** e não foi pedido no prompt. O shell padrão do `run:` é `bash -e 0`,
sem `pipefail`, então um `wrangler ... | tee` pode falhar e o passo passar como verde. É
exatamente o tipo de coisa que o `htmlhint` e o `git grep` do CI não veem — e é por isso que a
revisão por IA soma, mesmo sem poder ser o portão (Pergunta 4).

## Tarefa 4 — migrações D1 depois do merge

Workflow: `.github/workflows/migrar.yml`, com `paths: ['migrations/**']`, mais o step bônus que
resume as migrações com `actions/ai-inference` e escreve em `$GITHUB_STEP_SUMMARY`.

O comando exato do workflow já foi validado contra o banco remoto com
`wrangler d1 migrations list oauth-sessions-alexandre-laerto --remote`: o `wrangler.toml` é lido
corretamente mesmo sendo uma config de Pages, o binding resolve pelo nome e as duas migrações
aparecem como pendentes. Em CI falta só o `CLOUDFLARE_API_TOKEN`.

Estado do banco remoto conferido antes (`wrangler d1 execute --remote`): existem
`oauth_transactions`, `sessions`, `_cf_KV` e dois índices, e **não existe `d1_migrations`**.
Então a primeira execução vai aplicar 0001 e 0002 de uma vez: a 0001 é `CREATE TABLE IF NOT
EXISTS` e passa como no-op sobre as tabelas criadas à mão pelo Console em 16/09, e a 0002 cria
de fato a coluna `last_seen_at` em `sessions`.

- [ ] execução do merge: LINK
- [ ] saída do `PRAGMA table_info(sessions)` mostrando `last_seen_at`: COLAR
- [ ] merge sem tocar `migrations/` e sem execução: LINK

## Perguntas

**1. Por que o ci.yml roda duas vezes num push com PR aberto, e qual execução conta?**
São dois eventos distintos: o `push` roda sobre o commit da ramificação, e o `pull_request` roda
sobre o merge commit de teste entre a ramificação e a `main` — é esse segundo que responde "o que
acontece depois do merge". As duas execuções reportam o check `verificar` no mesmo SHA de cabeça
do PR, e a regra da `main` exige o check por nome, então é o resultado mais recente com o nome
`verificar` que libera ou bloqueia o merge; na prática o que importa é o do `pull_request`,
porque só ele enxerga o resultado da combinação com a `main`.

**2. Por que um PR vindo de um fork não consegue usar secrets.COPILOT_PAT?**
Porque o código do PR é de um terceiro e roda antes de qualquer revisão. Se o workflow recebesse
os segredos, bastaria abrir um PR com um step que imprime ou envia `${{ secrets.COPILOT_PAT }}`
para roubar a credencial. Por isso o GitHub executa PRs de fork com `GITHUB_TOKEN` só-leitura e
sem os segredos do repositório de destino — impede a exfiltração de credencial por pull request
malicioso.

**3. Por que declarar permissions em vez de usar o padrão do GITHUB_TOKEN?**
O padrão depende de uma configuração do repositório ou da organização, que pode dar escrita em
tudo e pode mudar sem o workflow saber. Declarar `contents: read` + `pull-requests: write` fixa o
mínimo necessário dentro do próprio arquivo: o workflow passa a ser reproduzível e, se alguma
action de terceiro no job for comprometida, ela não consegue escrever no código nem criar releases.

**4. A revisão da IA pode substituir o status check da Tarefa 2?**
Não. O status check é determinístico — a mesma entrada dá sempre o mesmo veredito, e ele é a
condição de merge. A revisão por IA é consultiva e varia entre execuções: como se vê no item 4 da
Tarefa 3, ela produz afirmações erradas ou irrelevantes, e o inverso também vale — pode deixar
passar um problema real. Ela serve para apontar o que um linter não vê, não para ser o portão.

## Bônus

Step já escrito no final do `migrar.yml`.

- [ ] resumo visível no `$GITHUB_STEP_SUMMARY` da execução: LINK
