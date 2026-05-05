# Sistema de Reembolso

Aplicacao fullstack para controle de solicitacoes de reembolso com fluxo por perfil:

- `COLLABORATOR`: cria, edita rascunho, envia e cancela solicitacoes.
- `MANAGER`: aprova ou rejeita solicitacoes enviadas.
- `FINANCIAL`: marca solicitacoes aprovadas como pagas.
- `ADMIN`: gerencia categorias.

## Estrutura

- `backend`: API REST em Node.js, Express, Prisma e SQLite.
- `frontend`: interface React com Vite, Chakra UI e React Query.
- `docker-compose.yml`: containerização apenas do SQLite.

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

## Docker (somente banco SQLite)

Para manter apenas o banco em container:

```bash
docker compose up -d
```

O serviço `sqlite-db` mantém o arquivo `dev.db` em volume nomeado (`sqlite_data`) e também em `./database`.
Backend e frontend continuam rodando localmente.

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

- `POST /api/users` (cadastro publico: cria `COLLABORATOR`; nao aceita `role` no body; com token `ADMIN`, permite definir `role`)
- `GET /api/users` (ADMIN)
- `GET /api/users/:id` (ADMIN)
- `PUT /api/users/:id` (ADMIN)
- `DELETE /api/users/:id` (ADMIN)
- `POST /api/auth/register` (compatibilidade; mesmo fluxo de cadastro colaborador)
- `POST /api/auth/login`
- `GET /api/categories/active`
- `GET /api/categories` (ADMIN)
- `POST /api/categories` (ADMIN)
- `PUT /api/categories/:id` (ADMIN) (`PATCH` ainda aceito)
- `GET /api/reimbursements`
- `POST /api/reimbursements`
- `PUT /api/reimbursements/:id` (`PATCH` ainda aceito)
- `POST /api/reimbursements/:id/submit`
- `POST /api/reimbursements/:id/approve`
- `POST /api/reimbursements/:id/reject`
- `POST /api/reimbursements/:id/pay`
- `POST /api/reimbursements/:id/cancel`
- `GET /api/reimbursements/:id/attachments`
- `POST /api/reimbursements/:id/attachments` (multipart `file`; PDF/JPG/PNG ate 5MB; tambem aceita JSON legado com `fileName`, `fileUrl`, `fileType`)
- `GET /api/reimbursements/:id/history`

## Formato de erro (API)

Respostas de erro seguem o padrao:

`{ "message": string, "statusCode": number, "error": string }`

## Uploads

- Arquivos ficam em `backend/uploads` e sao servidos em `GET /uploads/*`.
- Para URLs publicas corretas nos anexos, defina `PUBLIC_API_URL` no `.env` do backend (ex.: `http://localhost:3000`, **sem** `/api`).

## Troubleshooting

- Erro `Cannot find module dist/server.js`:
  - execute `npm run build` no `backend` antes de `npm run start`.
- Erro de autenticacao JWT:
  - confira se `JWT_SECRET` esta definido no `.env`.
- Frontend sem conectar na API:
  - confira `VITE_API_URL` no `.env` do frontend.
- Comando `docker` nao encontrado:
  - instale/inicie o Docker Desktop e reabra o terminal.