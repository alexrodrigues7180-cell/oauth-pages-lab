# Testes de falha (seção 16 do roteiro)

## Caso 1: retorno sem cookie temporário

- Preparação:
- Pedido enviado:
- Resultado esperado: rota de retorno recusa a resposta (400) e não cria sessão.
- Resultado observado:

## Caso 2: state alterado

- Preparação:
- Pedido enviado:
- Resultado esperado: rota de retorno recusa antes de trocar o código (400).
- Resultado observado:

## Caso 3: reutilização da transação

- Preparação:
- Pedido enviado:
- Resultado esperado: a transação já foi apagada; repetição falha (400).
- Resultado observado:

## Caso 4: sessão expirada

- Preparação: `UPDATE sessions SET expires_at = 0;` no console D1.
- Pedido enviado: `GET /api/me`
- Resultado esperado: `401`.
- Resultado observado:

## Caso 5: origem inválida na saída

- Preparação:
- Pedido enviado: `fetch(URL_BASE + "/oauth/logout", { method: "POST", credentials: "include" })` a partir de outra origem.
- Resultado esperado: rota recusa (403); sessão original permanece válida.
- Resultado observado:

## Caso 6: reutilização do cookie revogado

- Preparação:
- Pedido enviado: logout, depois restaurar o valor antigo de `__Host-session` e chamar `/api/me`.
- Resultado esperado: `401`.
- Resultado observado:
