# Testes de falha (secao 16 do roteiro)

URL_BASE: https://oauth-pages-lab-57s.pages.dev
Data da execucao: 16/09/2026

## Caso 1: retorno sem cookie temporario

- Preparacao: nenhuma sessao e nenhum cookie `__Host-oauth-tx` no cliente.
- Pedido enviado: `GET /oauth/callback/google?code=codigo-falso&state=estado-falso`
- Resultado esperado: rota de retorno recusa a resposta (400) e nao cria sessao.
- Resultado observado: **400**, sem corpo e sem `Set-Cookie`. A rota recusa no
  momento em que nao encontra o cookie de transacao, antes de qualquer consulta
  ao provedor. Nenhuma linha foi criada em `sessions`.

## Caso 2: state alterado

- Preparacao: `GET /oauth/login/google`, guardando o cookie `__Host-oauth-tx`
  emitido e o valor de `state` presente na URL de autorizacao.
- Pedido enviado: `GET /oauth/callback/google?code=codigo-falso&state=<state>ALTERADO`,
  enviando o cookie de transacao correto e o `state` com sufixo acrescentado.
- Resultado esperado: rota de retorno recusa antes de trocar o codigo (400).
- Resultado observado: **400**. A recusa ocorre na comparacao entre o resumo do
  `state` recebido e o `state_hash` guardado na transacao, que antecede a troca
  do codigo. A transacao permanece no banco, porque a exclusao so acontece
  depois da conferencia do `state`.

## Caso 3: reutilizacao da transacao

- Preparacao: `GET /oauth/login/github`, guardando o cookie `__Host-oauth-tx` e o
  `state` emitidos.
- Pedido enviado: o mesmo `GET /oauth/callback/github?code=codigo-falso&state=<state>`
  tres vezes seguidas, com o mesmo cookie.
- Resultado esperado: a transacao ja foi apagada; repeticao falha (400).
- Resultado observado: **400 nas tres chamadas**. Na primeira, o `state` confere,
  a transacao e apagada e a troca do codigo falha (codigo inexistente), o que
  degrada para 400 sem expor detalhes. Na segunda e na terceira, a consulta a
  `oauth_transactions` nao encontra mais a linha e a recusa acontece antes de
  qualquer contato com o provedor. O uso e unico.

## Caso 4: sessao expirada

- Preparacao: sessao valida criada por login real no navegador; em seguida
  `UPDATE sessions SET expires_at = 0;` executado no console D1 do banco
  `oauth-sessions-alexandre-laerto`.
- Pedido enviado: `GET /api/me` no mesmo navegador, com o cookie `__Host-session`
  ainda presente e intacto.
- Resultado esperado: `401`.
- Resultado observado: **401** (HTTP/2, 195 ms), conforme a aba Rede do navegador.
  O cookie continuava sendo enviado: a recusa veio da conferencia de `expires_at`
  no D1, nao da ausencia do cookie. A resposta traz `Cache-Control: no-store`.

## Caso 5: origem invalida na saida

- Preparacao: rota `/oauth/logout` exercitada com diferentes valores de `Origin`.
- Pedido enviado: `POST /oauth/logout` sem cabecalho `Origin`; depois com
  `Origin: https://example.com`; depois com `Origin` igual a `PUBLIC_BASE_URL`.
- Resultado esperado: rota recusa (403); sessao original permanece valida.
- Resultado observado: **403 sem `Origin`** e **403 com `Origin: https://example.com`**;
  **204 com o `Origin` do proprio site**. Nos dois casos recusados a resposta nao
  traz `Set-Cookie`, ou seja, o cookie de sessao nao e expirado e a sessao original
  continua valida. Conferido tambem que a rota aceita somente POST: `GET` e `PUT`
  devolvem **405** com `Allow: POST`.

## Caso 6: reutilizacao do cookie revogado

- Preparacao:
- Pedido enviado: logout, depois restaurar o valor antigo de `__Host-session` e chamar `/api/me`.
- Resultado esperado: `401`.
- Resultado observado:
