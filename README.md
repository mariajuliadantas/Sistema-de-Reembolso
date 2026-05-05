# Sistema de Reembolso

Aplicacao fullstack para controle de solicitacoes de reembolso com fluxo por perfil:

- `COLLABORATOR`: cria, edita rascunho, envia e cancela solicitacoes.
- `MANAGER`: aprova ou rejeita solicitacoes enviadas.
- `FINANCIAL`: marca solicitacoes aprovadas como pagas.
- `ADMIN`: gerencia categorias.

## Estrutura

- `backend`: API REST em Node.js, Express, Prisma e SQLite.
- `frontend`: interface React com Vite, Chakra UI e React Query.
- `docker-compose.yml`: orquestracao para ambientes `dev` e `prod`.

## Requisitos

- Node.js 22+
- npm 10+
- Docker Desktop (opcional, para execucao containerizada)

## Execucao local (sem Docker)

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

API em `http://localhost:3000`.

Para modo "start" (build de producao):

```bash
npm run build
npm run start
```

### 2) Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend em `http://localhost:5173`.

## Docker (dev e prod)

### Perfil de desenvolvimento

```bash
docker compose --profile dev up --build
```

Servicos:
- Frontend dev: `http://localhost:5173`
- Backend dev: `http://localhost:3000`

### Perfil de producao

```bash
docker compose --profile prod up --build
```

Servicos:
- Frontend prod (nginx): `http://localhost:4173`
- Backend prod: `http://localhost:3000`

### Persistencia do banco

O SQLite fica em volume nomeado (`sqlite_data`) para manter os dados entre reinicios.

## Qualidade

### Backend

```bash
cd backend
npm run build
npm test
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
npm test
```

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/categories/active`
- `GET /api/categories` (ADMIN)
- `POST /api/categories` (ADMIN)
- `PATCH /api/categories/:id` (ADMIN)
- `GET /api/reimbursements`
- `POST /api/reimbursements`
- `PATCH /api/reimbursements/:id`
- `POST /api/reimbursements/:id/submit`
- `POST /api/reimbursements/:id/approve`
- `POST /api/reimbursements/:id/reject`
- `POST /api/reimbursements/:id/pay`
- `POST /api/reimbursements/:id/cancel`
- `GET /api/reimbursements/:id/history`

## Troubleshooting

- Erro `Cannot find module dist/server.js`:
  - execute `npm run build` no `backend` antes de `npm run start`.
- Erro de autenticacao JWT:
  - confira se `JWT_SECRET` esta definido no `.env`.
- Frontend sem conectar na API:
  - confira `VITE_API_URL` no `.env` do frontend.
- Comando `docker` nao encontrado:
  - instale/inicie o Docker Desktop e reabra o terminal.