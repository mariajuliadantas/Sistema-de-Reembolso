# Sistema de Reembolso 

Aplicação fullstack para gerenciamento de solicitações de reembolso corporativo, implementada com regras de negócio por perfil e trilha de auditoria.

Fluxo por papel:

- `COLLABORATOR`: cria, edita em `DRAFT`, envia e cancela solicitacoes proprias.
- `MANAGER`: aprova ou rejeita solicitações `SUBMITTED`.
- `FINANCIAL`: marca como pago quando a solicitação esta `APPROVED`.
- `ADMIN`: gerencia usuarios e categorias.

---

## Sumario

- Stack utilizada
- Estrutura do projeto
- Como rodar (Docker e local)
- Usuarios de teste
- Funcionalidades implementadas
- Como rodar os testes
- Endpoints da API
- Collection do Postman
- Diferenciais tecnicos
- Troubleshooting

## Stack utilizada

### Backend

- Runtime: Node.js + TypeScript
- Framework: Express
- Banco: SQLite + Prisma ORM
- Autenticacao: JWT (access + refresh) + bcrypt
- Validacao: Zod
- Upload: Multer
- Datas: Dayjs
- Testes: Jest + Supertest

### Frontend

- Framework: React + TypeScript + Vite
- Roteamento: React Router
- Estado global: Context API (`AuthContext`)
- Estado remoto: React Query
- HTTP: Axios com interceptors (token e refresh)
- UI: Chakra UI
- Formularios: React Hook Form + Zod
- Testes: Jest + React Testing Library

## Estrutura do projeto

```text
Sistema-de-Reembolso/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       ├── tests/
│       ├── utils/
│       ├── app.ts
│       └── server.ts
├── frontend/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── types/
├── docker-compose.yml
└── README.md
```

## Como rodar o projeto: 

### Antes de qualquer opção (clonar repositório): 

```bash
git clone https://github.com/mariajuliadantas/Sistema-de-Reembolso.git
cd Sistema-de-Reembolso

```


### Opcao 1 - Docker (recomendado para avaliação)

Pre-requisito: Docker Desktop (ou Docker Engine + Compose v2).

Na raiz `Sistema-de-Reembolso`:

```bash
docker compose up --build -d
docker compose exec backend npm run db:seed
```

Acessos:

- Frontend: `http://localhost:8080`
- API: `http://localhost:3000`

Comandos uteis:

```bash
docker compose up
docker compose down
docker compose down -v
docker compose logs -f backend
```

### Opcao 2 - Execução local (sem Docker)

Pre-requisitos:

- Node.js 22+
- npm 10+

Backend:

```bash
cd backend
npm install
# Linux/macOS
cp .env.example .env
# Windows PowerShell
Copy-Item .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend (em outro terminal):

```bash
cd frontend
npm install
# Linux/macOS
cp .env.example .env
# Windows PowerShell
Copy-Item .env.example .env
npm run dev
```

Acessos locais:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`

## Usuarios de teste

Criados pelo seed de desenvolvimento (`@pitang.com`), senha padrao `admin123`:

- `admin@pitang.com` - `ADMIN`
- `colaborador@pitang.com` - `COLLABORATOR`
- `gestor@pitang.com` - `MANAGER`
- `financeiro@pitang.com` - `FINANCIAL`

Observacao: os testes automatizados usam outro dataset (`@test.com`) para isolamento.


## Como rodar os testes

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm test
```

## Endpoints da API

Base local: `http://localhost:3000/api`

Autenticacao:

- `POST /auth/login`
- `POST /auth/refresh`

Usuarios (`ADMIN`):

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`

Categorias:

- `GET /categories/active` (publico)
- `GET /categories` (`ADMIN`)
- `POST /categories` (`ADMIN`)
- `PUT /categories/:id` (`ADMIN`)

Reembolsos:

- `GET /reimbursements`
- `POST /reimbursements`
- `GET /reimbursements/:id`
- `PUT /reimbursements/:id`
- `POST /reimbursements/:id/submit`
- `POST /reimbursements/:id/approve`
- `POST /reimbursements/:id/reject`
- `POST /reimbursements/:id/pay`
- `POST /reimbursements/:id/cancel`
- `GET /reimbursements/:id/attachments`
- `POST /reimbursements/:id/attachments`
- `GET /reimbursements/:id/history`

Configuracao/Demo:

- `GET /config/reimbursement-rules` (publico)
- `GET /demo/external-post` (publico)

Formato de erro padrao:

`{ "message": string, "statusCode": number, "error": string }`

## Collection do Postman

Arquivos versionados no repositorio:

- `postman/Sistema-de-Reembolso.postman_collection.json`
- `postman/Sistema-de-Reembolso.local.postman_environment.json`

Como usar:

1. Postman -> `Import` -> selecione os 2 arquivos da pasta `postman/`.
2. Selecione o environment `Sistema de Reembolso - Local`.
3. Rode os requests de `01 - Auth` para preencher tokens automaticamente.
4. Rode `02 - Categories -> GET Categories Active` para preencher `categoryId`.
5. Rode o fluxo de `03 - Reimbursements Flow` (create -> upload opcional -> submit -> approve -> pay -> history).


## Troubleshooting

- Frontend nao conecta na API:
  - confira `VITE_API_URL` no `frontend/.env`.
- JWT invalido/expirado:
  - confira `JWT_SECRET` e horario do sistema.
- Erro no build backend:
  - rode `npm run build` em `backend` antes de `npm run start`.
- Docker sem subir:
  - verifique se Docker Desktop esta iniciado.

## 17. Plus / diferenciais - checklist

- [x] Paginacao - `backend/src/schemas/reimbursementListQuerySchema.ts` (`page`, `limit`) e `backend/src/services/ReimbursementService.ts` (`skip/take` + metadados de pagina).
- [x] Filtro por status - query `status` em `reimbursementListQuerySchema.ts` aplicada em `ReimbursementService.listExtraAnd(...)`.
- [x] Filtro por categoria - query `categoryId` em `reimbursementListQuerySchema.ts` aplicada em `ReimbursementService.listExtraAnd(...)`.
- [x] Busca por colaborador - query `requesterSearch` em `reimbursementListQuerySchema.ts`, com busca por `name`/`email` em `ReimbursementService.listExtraAnd(...)`.
- [x] Ordenacao por data ou valor - `sortBy`/`sortOrder` no schema de listagem e ordenacao em `ReimbursementService.listOrderBy(...)`.
- [x] Dashboard com totais - agregacoes (`aggregate` e `groupBy`) em `ReimbursementService.getAll(...)` e exibicao por perfil em `frontend/src/pages/Dashboard.tsx`.
- [x] Preview/download de anexos - upload/listagem em `POST/GET /api/reimbursements/:id/attachments` e consumo em `frontend/src/pages/ReimbursementDetails.tsx`.
- [x] Soft delete - usuarios usam `deletedAt` em `backend/prisma/schema.prisma`, aplicado no `UserService` e no login (`auth.routes.ts` filtra `deletedAt: null`).
- [x] Seeds iniciais - `backend/prisma/seed.ts` cria usuarios base por perfil e categorias iniciais.
- [x] Collection do Postman - arquivos `postman/Sistema-de-Reembolso.postman_collection.json` e `postman/Sistema-de-Reembolso.local.postman_environment.json`, com scripts para salvar tokens e IDs.
- [x] Mais testes automatizados no backend - suites em `backend/src/tests/*.test.ts` (auth, users, categories, reimbursements, config, demo e utilitarios).
- [x] Mais testes automatizados no frontend - suites em `frontend/src/**/*.test.ts(x)` cobrindo rotas protegidas, refresh token e utilitarios.
- [x] Consumo simples de API externa (sem impactar o escopo principal) - endpoint `GET /api/demo/external-post` em `backend/src/routes/demo.routes.ts` e testes em `backend/src/tests/demo.test.ts`.
- [x] Refresh token - endpoint `POST /api/auth/refresh` (`backend/src/routes/auth.routes.ts`) + fluxo no interceptor (`frontend/src/services/api.ts` e `tokenRefresh.ts`).
- [x] Docker Compose - orquestracao em `docker-compose.yml` com backend + frontend + volumes.
- [x] Upload real de comprovantes - `multer` em `backend/src/middlewares/uploadAttachment.middleware.ts` (PDF/JPG/PNG ate 5MB) e upload via tela de detalhes.
- [x] Limite de valor configuravel por categoria - campo `maxAmount` em `Category` (`schema.prisma`) validado em `ReimbursementService.assertValueWithinCategoryMax(...)`.
- [x] Bloqueio de despesas futuras - validacao com `dayjs` em `ReimbursementService.assertExpenseDateNotFuture(...)`.
- [x] Bloqueio de solicitacao sem anexo acima de determinado valor - regra em `backend/src/utils/reimbursementRules.ts`, aplicada no `submit()` do `ReimbursementService`.



