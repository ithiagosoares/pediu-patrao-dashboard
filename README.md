# Pediu Patrão – Dashboard Administrativo

Painel administrativo para o sistema de pedidos **Pediu Patrão** (lanchonete/pizzaria). O responsável pelo estabelecimento acompanha o desempenho das vendas, a situação dos pedidos e os produtos mais vendidos. Os dados vêm de uma **API REST própria**, integrada a um banco PostgreSQL.

**Aluno:** Thiago dos Santos Soares – RGM 11221101451
**Vídeo de apresentação:** 

---

## Sumário

1. [Tecnologias](#1-tecnologias)
2. [Arquitetura](#2-arquitetura)
3. [Como executar](#3-como-executar)
4. [Fluxo de branches (Gitflow)](#4-fluxo-de-branches-gitflow)
5. [Requisitos funcionais](#5-requisitos-funcionais)
6. [Requisitos não funcionais](#6-requisitos-não-funcionais)
7. [Modelagem de dados](#7-modelagem-de-dados)
8. [Documentação da API](#8-documentação-da-api)
9. [Evidências de testes](#9-evidências-de-testes)
10. [Principais decisões de projeto](#10-principais-decisões-de-projeto)

---

## 1. Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Componentes de interface | shadcn/ui (Card, Table, Button, Input, Label, NativeSelect, Badge, Chart) |
| Gráficos | Recharts, via componente `Chart` do shadcn/ui |
| API | Next.js Route Handlers (REST, JSON) |
| Banco de dados | PostgreSQL (hospedado no Supabase) |
| Acesso ao banco | `@supabase/supabase-js` (funções SQL via RPC e query builder) |
| Versionamento | Git + GitHub, seguindo Gitflow |

## 2. Arquitetura

```
Navegador (Dashboard React)
      │  fetch('/api/...')            JSON
      ▼
API REST (Next.js – app/api)
      │  validação de parâmetros e tratamento de erros (lib/filtros.ts, lib/respostas.ts)
      │  supabase-js
      ▼
PostgreSQL (Supabase)
      └─ tabelas + funções SQL de agregação (database/functions.sql)
```

- O **front-end nunca acessa o banco diretamente**. Toda consulta passa pela API.
- A chave de acesso ao banco fica **apenas no servidor** (`.env.local`) e nunca é enviada ao navegador.
- Os cálculos pesados (somas, médias, agrupamentos e rankings) são feitos **no banco**, por funções SQL.

### Estrutura de pastas

```
app/
├── api/
│   ├── categorias/route.ts
│   ├── pedidos/route.ts
│   └── dashboard/
│       ├── indicadores/route.ts
│       ├── vendas/route.ts
│       ├── pedidos-status/route.ts
│       └── produtos-mais-vendidos/route.ts
├── components/TabelaPedidos.tsx
├── page.tsx                 ← dashboard
└── layout.tsx
components/ui/               ← componentes do shadcn/ui
components.json              ← configuração do shadcn/ui
lib/
├── supabase.ts              ← conexão com o banco
├── filtros.ts               ← leitura e validação dos parâmetros
├── respostas.ts             ← padronização dos erros
└── formatar.ts              ← formatação de moeda e status
database/
├── schema.sql               ← criação das tabelas e permissões
├── seed.sql                 ← dados de teste (~300 pedidos em 60 dias)
└── functions.sql            ← funções de agregação
```

## 3. Como executar

**Pré-requisitos:** Node.js 20+ e um projeto no Supabase (ou qualquer PostgreSQL acessível pelo Supabase).

1. Clone o repositório e instale as dependências:
   ```bash
   git clone https://github.com/ithiagosoares/pediu-patrao-dashboard.git
   cd pediu-patrao-dashboard
   npm install
   ```
2. No **SQL Editor** do Supabase, execute na ordem:
   1. `database/schema.sql`
   2. `database/seed.sql`
   3. `database/functions.sql`
3. Copie `.env.example` para `.env.local` e preencha:
   ```
   SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<secret key do projeto>
   ```
4. Rode o projeto:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:3000` (dashboard) ou `http://localhost:3000/api/...` (API).

## 4. Fluxo de branches (Gitflow)

| Branch | Função |
|---|---|
| `main` | Versão estável entregue |
| `develop` | Integração das funcionalidades |
| `feature/banco-de-dados` | Modelagem, schema e dados de teste |
| `feature/api-dashboard` | Implementação dos endpoints da API |
| `feature/frontend-dashboard` | Implementação do dashboard |
| `feature/shadcn-ui` | Interface com os componentes do shadcn/ui |
| `feature/documentacao` | Documentação e evidências |

Cada `feature/*` foi criada a partir de `develop` e integrada de volta com merge `--no-ff`. Ao final, `develop` foi integrada à `main`.

## 5. Requisitos funcionais

| ID | Requisito | Descrição | Onde está atendido |
|---|---|---|---|
| RF01 | Indicadores gerais de vendas | Exibir faturamento, total de pedidos, ticket médio e quantidade/taxa de cancelamentos no período. | `GET /api/dashboard/indicadores` e os cards do topo |
| RF02 | Análise de vendas (gráficos) | Exibir gráfico de faturamento ao longo do tempo, agrupado por dia, semana ou mês. | `GET /api/dashboard/vendas` e o gráfico "Faturamento por período" |
| RF03 | Situação dos pedidos | Exibir a quantidade e o valor de pedidos por status e listar os pedidos com paginação. | `GET /api/dashboard/pedidos-status`, `GET /api/pedidos`, tabelas "Pedidos por status" e "Últimos pedidos" |
| RF04 | Produtos mais vendidos | Exibir ranking dos produtos por unidades vendidas, com faturamento e categoria, desconsiderando pedidos cancelados. | `GET /api/dashboard/produtos-mais-vendidos` e a tabela "Produtos mais vendidos" |
| RF05 | Filtros de consulta | Permitir filtrar por data inicial, data final, status, categoria e tipo de agrupamento. | Parâmetros de query da API e a área de filtros do dashboard |
| RF06 | Integração com a API | O dashboard deve obter todos os dados exclusivamente via endpoints REST da API. | `fetch` em `app/page.tsx` e `TabelaPedidos.tsx` |
| RF07 | Atualização e tratamento de dados | Atualizar os dados automaticamente a cada 60 s e por botão; validar parâmetros; exibir mensagens de erro e estados vazios. | `setInterval` e botão "Atualizar" no dashboard; `lib/filtros.ts` e `lib/respostas.ts` na API |

## 6. Requisitos não funcionais

| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Desempenho | As agregações são feitas no banco por funções SQL, e as colunas `pedidos.criado_em`, `pedidos.status` e `itens_pedido.produto_id` são indexadas. As respostas da API retornam em menos de 1 segundo com a base de teste. |
| RNF02 | Segurança | A credencial do banco fica apenas no servidor (`.env.local`, fora do Git). Somente a role `service_role` tem permissão nas tabelas, e o navegador não acessa o banco diretamente. |
| RNF03 | Confiabilidade | Todos os parâmetros de entrada são validados antes de consultar o banco. Erros retornam JSON padronizado (`{ "erro": "..." }`) com o status HTTP adequado. |
| RNF04 | Usabilidade | Interface em português, valores em Real (R$) e datas no formato brasileiro, com mensagens claras para erro e para períodos sem dados. |
| RNF05 | Manutenibilidade | Código em TypeScript, com validação e tratamento de erro centralizados em `lib/` e scripts SQL versionados em `database/`. |
| RNF06 | Portabilidade | A aplicação roda em qualquer navegador moderno e o layout se adapta a telas menores. |
| RNF07 | Integridade dos dados | Chaves estrangeiras, `CHECK` em valores (preço ≥ 0, quantidade > 0) e `enum` para o status do pedido. |

## 7. Modelagem de dados

```
categorias (id, nome)
     │1
     │N
produtos (id, nome, categoria_id, preco, ativo)
     │1
     │N
itens_pedido (id, pedido_id, produto_id, quantidade, preco_unitario)
     │N
     │1
pedidos (id, cliente_id, status, forma_pagamento, tipo, valor_total, criado_em)
     │N
     │1
clientes (id, nome, telefone)
```

- `status` é um `enum`: `pendente`, `em_preparo`, `saiu_entrega`, `entregue`, `cancelado`.
- `forma_pagamento`: `pix`, `cartao`, `dinheiro`. `tipo`: `delivery`, `balcao`.
- `itens_pedido.preco_unitario` guarda o preço **no momento da venda**, então alterações futuras de preço não distorcem o histórico.
- Scripts completos em [`database/schema.sql`](database/schema.sql).

## 8. Documentação da API

**Base URL (local):** `http://localhost:3000`
**Formato:** todas as respostas são JSON.

### Parâmetros comuns (filtros – RF05)

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `data_inicio` | `AAAA-MM-DD` | Não | hoje − 30 dias | Data inicial (inclusiva) |
| `data_fim` | `AAAA-MM-DD` | Não | hoje | Data final (inclusiva) |
| `status` | texto | Não | todos | `pendente`, `em_preparo`, `saiu_entrega`, `entregue` ou `cancelado` |

### Erros padronizados

| Status HTTP | Quando acontece | Exemplo de corpo |
|---|---|---|
| `400 Bad Request` | Parâmetro inválido | `{ "erro": "Parâmetro 'data_inicio' inválido. Use o formato AAAA-MM-DD." }` |
| `400 Bad Request` | Data inicial depois da final | `{ "erro": "'data_inicio' deve ser anterior ou igual a 'data_fim'." }` |
| `400 Bad Request` | Status inexistente | `{ "erro": "Status inválido. Valores aceitos: pendente, em_preparo, saiu_entrega, entregue, cancelado." }` |
| `404 Not Found` | Rota inexistente | Página padrão do Next.js |
| `500 Internal Server Error` | Falha ao consultar o banco | `{ "erro": "Erro interno ao consultar os dados." }` |

> Em caso de erro 500, o detalhe técnico é registrado apenas no log do servidor e não é exposto ao cliente.

---

### 8.1 `GET /api/dashboard/indicadores` – RF01

Retorna os indicadores gerais de vendas do período. O faturamento e o ticket médio desconsideram pedidos cancelados.

**Parâmetros:** `data_inicio`, `data_fim`, `status`.

**Requisição**
```http
GET /api/dashboard/indicadores?data_inicio=2026-10-09&data_fim=2026-11-08
```

**Resposta `200`**
```json
{
  "dados": {
    "faturamento": 13472.6,
    "total_pedidos": 147,
    "ticket_medio": 107.78,
    "pedidos_cancelados": 22,
    "taxa_cancelamento": 14.97
  }
}
```

**Erros:** `400` (data ou status inválido), `500`.

---

### 8.2 `GET /api/dashboard/vendas` – RF02

Retorna a série histórica de faturamento e quantidade de pedidos, agrupada por período.

**Parâmetros:** `data_inicio`, `data_fim`, `status` e:

| Parâmetro | Tipo | Obrigatório | Padrão | Valores |
|---|---|---|---|---|
| `agrupamento` | texto | Não | `dia` | `dia`, `semana`, `mes` |

**Requisição**
```http
GET /api/dashboard/vendas?agrupamento=semana
```

**Resposta `200`**
```json
{
  "agrupamento": "semana",
  "dados": [
    { "periodo": "2026-10-05", "pedidos": 15, "faturamento": 1327.3 },
    { "periodo": "2026-10-12", "pedidos": 41, "faturamento": 3700.6 },
    { "periodo": "2026-10-19", "pedidos": 31, "faturamento": 2765.5 }
  ]
}
```
> Para `semana`, `periodo` é a segunda-feira da semana. Para `mes`, é o primeiro dia do mês.

**Resposta `400`**
```json
{ "erro": "Parâmetro 'agrupamento' inválido. Valores aceitos: dia, semana, mes." }
```

---

### 8.3 `GET /api/dashboard/pedidos-status` – RF03

Retorna a quantidade e o valor total de pedidos por status no período.

**Parâmetros:** `data_inicio`, `data_fim`.

**Requisição**
```http
GET /api/dashboard/pedidos-status
```

**Resposta `200`**
```json
{
  "dados": [
    { "status": "entregue", "quantidade": 72, "valor": 7809.2 },
    { "status": "cancelado", "quantidade": 22, "valor": 2374.1 },
    { "status": "saiu_entrega", "quantidade": 21, "valor": 2408.5 },
    { "status": "pendente", "quantidade": 16, "valor": 1660.6 },
    { "status": "em_preparo", "quantidade": 16, "valor": 1594.3 }
  ]
}
```

**Erros:** `400` (data inválida), `500`.

---

### 8.4 `GET /api/dashboard/produtos-mais-vendidos` – RF04

Retorna o ranking de produtos por unidades vendidas, desconsiderando pedidos cancelados.

**Parâmetros:** `data_inicio`, `data_fim` e:

| Parâmetro | Tipo | Obrigatório | Padrão | Regra |
|---|---|---|---|---|
| `limite` | inteiro | Não | `10` | entre 1 e 50 |
| `categoria` | inteiro (id) | Não | todas | id existente em `/api/categorias` |

**Requisição**
```http
GET /api/dashboard/produtos-mais-vendidos?limite=5
```

**Resposta `200`**
```json
{
  "dados": [
    { "id": 5, "nome": "X-Burger", "categoria": "Lanches", "quantidade": 52, "faturamento": 1190.8 },
    { "id": 3, "nome": "Pizza Frango c/ Catupiry", "categoria": "Pizzas", "quantidade": 43, "faturamento": 2360.7 },
    { "id": 11, "nome": "Suco Natural", "categoria": "Bebidas", "quantidade": 43, "faturamento": 387 },
    { "id": 7, "nome": "X-Bacon", "categoria": "Lanches", "quantidade": 42, "faturamento": 1171.8 },
    { "id": 10, "nome": "Guaraná Lata", "categoria": "Bebidas", "quantidade": 42, "faturamento": 252 }
  ]
}
```

**Resposta `400`**
```json
{ "erro": "Parâmetro 'limite' deve ser um número inteiro entre 1 e 50." }
```

---

### 8.5 `GET /api/pedidos` – RF03 / RF05

Lista os pedidos do período, do mais recente para o mais antigo, com paginação.

**Parâmetros:** `data_inicio`, `data_fim`, `status` e:

| Parâmetro | Tipo | Obrigatório | Padrão | Regra |
|---|---|---|---|---|
| `pagina` | inteiro | Não | `1` | ≥ 1 |
| `limite` | inteiro | Não | `10` | entre 1 e 100 |

**Requisição**
```http
GET /api/pedidos?status=entregue&pagina=2
```

**Resposta `200`**
```json
{
  "dados": [
    {
      "id": 55,
      "status": "entregue",
      "valor_total": 74.7,
      "forma_pagamento": "cartao",
      "tipo": "delivery",
      "criado_em": "2026-11-04T03:21:00.357764+00:00",
      "clientes": { "nome": "Cliente 45" }
    }
  ],
  "paginacao": { "pagina": 2, "limite": 10, "total": 72, "total_paginas": 8 }
}
```

**Erros:** `400` (data, status, página ou limite inválidos), `500`.

---

### 8.6 `GET /api/categorias` – RF05

Lista as categorias de produto, usadas no filtro de categoria do dashboard.

**Requisição**
```http
GET /api/categorias
```

**Resposta `200`**
```json
{
  "dados": [
    { "id": 3, "nome": "Bebidas" },
    { "id": 2, "nome": "Lanches" },
    { "id": 1, "nome": "Pizzas" },
    { "id": 4, "nome": "Sobremesas" }
  ]
}
```

**Erros:** `500`.

## 9. Evidências de testes

Os testes foram feitos manualmente no navegador, chamando cada endpoint com parâmetros válidos e inválidos e verificando o status HTTP e o corpo da resposta. As capturas estão em [`docs/evidencias/`](docs/evidencias).

| # | Teste | Requisição | Esperado | Resultado | Evidência |
|---|---|---|---|---|---|
| T01 | Indicadores do período padrão | `GET /api/dashboard/indicadores` | 200 com os 5 indicadores | ✅ Passou | ![T01](docs/evidencias/t01-indicadores.png) |
| T02 | Data em formato inválido | `GET /api/dashboard/indicadores?data_inicio=2026-13-40` | 400 com mensagem de formato | ✅ Passou | ![T02](docs/evidencias/t02-data-invalida.png) |
| T03 | Status inexistente | `GET /api/dashboard/indicadores?status=voando` | 400 com lista de status aceitos | ✅ Passou | ![T03](docs/evidencias/t03-status-invalido.png) |
| T04 | Vendas agrupadas por semana | `GET /api/dashboard/vendas?agrupamento=semana` | 200 com série semanal | ✅ Passou | ![T04](docs/evidencias/t04-vendas-semana.png) |
| T05 | Agrupamento inválido | `GET /api/dashboard/vendas?agrupamento=ano` | 400 | ✅ Passou | ![T05](docs/evidencias/t05-agrupamento-invalido.png) |
| T06 | Pedidos por status | `GET /api/dashboard/pedidos-status` | 200 com os 5 status | ✅ Passou | ![T06](docs/evidencias/t06-pedidos-status.png) |
| T07 | Ranking com limite | `GET /api/dashboard/produtos-mais-vendidos?limite=5` | 200 com 5 produtos | ✅ Passou | ![T07](docs/evidencias/t07-ranking.png) |
| T08 | Limite fora da faixa | `GET /api/dashboard/produtos-mais-vendidos?limite=500` | 400 | ✅ Passou | ![T08](docs/evidencias/t08-limite-invalido.png) |
| T09 | Listagem paginada com filtro | `GET /api/pedidos?status=entregue&pagina=2` | 200, `total` igual ao de "entregue" em T06 (72) | ✅ Passou | ![T09](docs/evidencias/t09-pedidos-paginados.png) |
| T10 | Categorias | `GET /api/categorias` | 200 com 4 categorias | ✅ Passou | ![T10](docs/evidencias/t10-categorias.png) |
| T11 | Dashboard carregando dados da API | `http://localhost:3000` | Indicadores, gráfico e tabelas preenchidos | ✅ Passou | ![T11](docs/evidencias/t11-dashboard.png) |
| T12 | Filtros no dashboard | Alterar status, categoria e agrupamento | Dados atualizados conforme o filtro | ✅ Passou | ![T12](docs/evidencias/t12-filtros.png) |
| T13 | Erro exibido no dashboard | Data inicial maior que a final | Mensagem de erro vinda da API | ✅ Passou | ![T13](docs/evidencias/t13-erro-dashboard.png) |

**Teste de consistência:** o `total` retornado em `GET /api/pedidos?status=entregue` (72) é igual à quantidade de pedidos "entregue" em `GET /api/dashboard/pedidos-status` (72). Isso confirma que os dois endpoints aplicam os mesmos filtros de período.

## 10. Principais decisões de projeto

- **Next.js para API e front no mesmo projeto:** simplifica a execução (um único `npm run dev`) e o deploy, e mantém a separação de responsabilidades: a API fica em `app/api`, a interface em `app/page.tsx`.
- **Agregações no banco (funções SQL):** somar, agrupar e ranquear no PostgreSQL é mais eficiente do que trazer todos os pedidos para a aplicação. A API recebe apenas o resultado pronto.
- **Validação centralizada:** todos os endpoints usam `lib/filtros.ts`, o que garante as mesmas regras e mensagens de erro em toda a API.
- **Erros padronizados:** respostas de erro sempre no formato `{ "erro": "..." }`. O 400 explica o que corrigir, e o 500 não expõe detalhes internos.
- **Credenciais só no servidor:** a chave do banco nunca chega ao navegador, e apenas a role do servidor tem permissão nas tabelas.
- **Preço histórico em `itens_pedido`:** preserva o faturamento real mesmo se o preço do produto mudar depois.
- **shadcn/ui (sugerido em aula):** escolhido entre AdminLTE, CoreUI e shadcn/ui porque é nativo do ecossistema React + Tailwind. AdminLTE e CoreUI são baseados em Bootstrap e misturariam dois sistemas de estilo no projeto.
- **Atualização automática (60 s) e datas calculadas no navegador:** o painel mostra sempre dados atuais, sem valores "congelados" no build.
