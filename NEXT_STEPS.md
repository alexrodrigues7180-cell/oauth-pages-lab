# O que falta para fechar a entrega

Atualizado em 21/09/2026. Tudo abaixo e trabalho de navegador, na conta do
Alexandre. O codigo esta pronto, publicado e com os dois logins reais ja
concluidos em 16/09.

URL_BASE: https://oauth-pages-lab-57s.pages.dev
Projeto Pages: `oauth-pages-lab` | Banco D1: `oauth-sessions-alexandre-laerto`

> Regra do lab: nao rodar Node, npm, npx nem Wrangler. Tudo pelo painel.

> Regra da entrega: `public/entrega1/` precisa conter **exatamente** os 8 arquivos
> abaixo, nem um a mais. Qualquer anotacao de trabalho fica fora dessa pasta.

## Estado dos 8 arquivos de evidencia

| Arquivo | Estado |
|---|---|
| `01-pages-configuracao.pdf` | FALTA — imprimir do painel |
| `02-google-retorno.txt` | pronto |
| `03-github-retorno.txt` | pronto |
| `04-d1-esquema.txt` | pronto |
| `05-inicio-login-google.pdf` | FALTA — imprimir do DevTools |
| `06-inicio-login-github.pdf` | FALTA — imprimir do DevTools |
| `07-testes-falha.md` | falta so o resultado observado do caso 6 |
| `08-aceitacao.md` | faltam 3 caixas e as 2 assinaturas |

## 1. `01-pages-configuracao.pdf`

Painel da Cloudflare > Workers & Pages > `oauth-pages-lab` > Settings > Build.
A tela precisa mostrar o nome do projeto, a ramificacao de producao `main`, o
Build command vazio e o Build output directory `public`. Imprimir a pagina em PDF
(Ctrl+P > Salvar como PDF). Se a informacao estiver repartida em duas telas,
gerar os dois PDFs e juntar num arquivo so.

## 2. `05-inicio-login-google.pdf` e `06-inicio-login-github.pdf`

Numa janela privativa, com o DevTools aberto na aba Rede e a opcao
"Preserve log" / "Preservar registro" **ligada** (senao o 302 some no
redirecionamento):

1. abrir `URL_BASE` e clicar em Entrar com Google;
2. na aba Rede, selecionar a linha de `/oauth/login/google` (a de status 302);
3. abrir Headers/Cabecalhos e expandir tanto os de requisicao quanto os de
   resposta, incluindo o `Location` e o `Set-Cookie`;
4. imprimir em PDF.

Repetir para o GitHub em `/oauth/login/github`.

**Sanear antes de entregar:** trocar por `[REMOVIDO]` os valores de `state`,
`nonce`, `code_challenge` e o valor do cookie `__Host-oauth-tx`. O `client_id`
pode ficar. O que a professora precisa ver e que existe `response_type=code`,
`code_challenge_method=S256` e que **nao** ha `client_secret` nem
`code_verifier` na URL. Se o PDF sair com os valores legiveis, refazer com eles
ja apagados na tela (o painel do DevTools permite editar o texto copiado — o
mais simples e copiar os cabecalhos, colar num editor, sanear e imprimir dai).

## 3. Caso 6 do `07-testes-falha.md`

O roteiro do teste ja esta escrito no arquivo. Executar e preencher so a linha
"Resultado observado":

1. fazer login, confirmar `GET /api/me` = 200;
2. DevTools > Aplicativo > Cookies > copiar o valor de `__Host-session`;
3. sair pelo botao de logout (o `POST /oauth/logout` responde 204);
4. no mesmo painel de Cookies, recriar `__Host-session` com o valor antigo
   (`Path=/`, `Secure`, `HttpOnly`, `SameSite=Strict`, sem `Domain`);
5. recarregar e observar o `GET /api/me` na aba Rede.

Esperado: **401**, com o cabecalho `Cookie` da requisicao ainda carregando o
`__Host-session` — e isso que prova que a recusa veio da linha ausente no D1 e
nao da falta do cookie.

## 4. As 3 caixas restantes do `08-aceitacao.md`

- **cookie revogado** — marcar assim que o caso 6 der 401;
- **tokens e segredos fora do armazenamento Web** — a conferencia esta descrita
  no proprio arquivo, em "Itens em aberto";
- **sessoes administrativas encerradas** — marcar por ultimo, ao sair das contas.

O item do Wrangler fica desmarcado de proposito, com a justificativa escrita no
arquivo. Decisao do Alexandre em 16/09.

Por fim: preencher as duas assinaturas (Alexandre e Laerto) e dar `git push` na
`main` — o deploy e automatico e a pasta `public/entrega1/` passa a ficar
acessivel pela URL para a correcao automatica.

## Limpeza (secao 19, so quando a professora autorizar)

- apagar o banco D1 antigo `oauth-sessions` (o que foi criado por wrangler e
  descartado) — **pendente, pode ser feito ja**;
- nao apagar o projeto Pages nem o banco `oauth-sessions-alexandre-laerto`
  durante a aula;
- confirmar que os dois Client Secrets continuam como Encrypt no Pages;
- registrar quem fica responsavel pela rotacao dos Client Secrets.
