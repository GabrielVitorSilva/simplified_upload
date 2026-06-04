# File Service

Serviço centralizado de gerenciamento de arquivos construído com **NestJS**, **TypeScript**, **PostgreSQL** (Prisma) e **AWS S3**. Elimina a necessidade de implementar integração com S3 em cada projeto — os sistemas consomem este serviço via API HTTP.

---

## Índice

- [Arquitetura](#arquitetura)
- [Fluxo de Upload](#fluxo-de-upload)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Pré-requisitos](#pré-requisitos)
- [Execução Local](#execução-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Autenticação](#autenticação)
- [Swagger](#swagger)
- [Testes](#testes)
- [Docker](#docker)
- [Evoluções Futuras](#evoluções-futuras)

---

## Arquitetura

O projeto adota **DDD leve** com camadas bem definidas, **SOLID** e boas práticas do NestJS. Todos os módulos (`files`, `clients`, `storages`) seguem o mesmo padrão de camadas: domain → application (use-cases) → infra (controller + repository).

```
src/
├── modules/
│   ├── auth/               # API Key Guard (global) + AdminGuard + decorator @Public
│   ├── files/              # Gerenciamento de arquivos (use-cases, repositório, controller)
│   ├── storage/            # Abstração de provedor de armazenamento (interface + S3)
│   ├── storages/           # CRUD de configurações de storage — requer API key admin
│   ├── clients/            # CRUD de clientes API — requer API key admin
│   └── health/             # Healthcheck endpoint (público)
└── shared/
    ├── config/             # Configurações tipadas (app, aws)
    ├── database/           # PrismaService + PrismaModule global
    ├── aws/                # S3Client provider global
    ├── exceptions/         # Filtro global de exceções
    └── utils/              # Utilitários (geração de API key)
```

### Decisões de Design

- **StorageModule** expõe uma interface `StorageProvider` — trocar de S3 para GCS ou Azure Blob requer apenas uma nova implementação sem alterar use-cases.
- **Use-cases** concentram toda a lógica de negócio, são independentes do framework e facilmente testáveis.
- **Repositórios** isolam o Prisma da camada de domínio.
- **APP_GUARD global** garante que todos os endpoints exijam `x-api-key` por padrão; use `@Public()` para rotas abertas (ex: health).
- **AdminGuard** protege rotas administrativas (`/clients`, `/storages`). Apenas clientes com `isAdmin: true` têm acesso. Rotas de `/files` permanecem acessíveis a qualquer cliente autenticado.

---

## Fluxo de Upload

```
┌──────────────┐     POST /files/upload-url      ┌─────────────────┐
│    Cliente   │ ──────────────────────────────► │   File Service  │
│   (App/Web)  │                                  │                 │
│              │ ◄────────────────────────────── │  Gera presigned │
│              │   { uploadUrl, key, fileId }     │  URL no S3      │
│              │                                  └─────────────────┘
│              │
│              │     PUT <uploadUrl>              ┌─────────────────┐
│              │ ──────────────────────────────► │     AWS S3      │
│              │   (arquivo binário direto)        │                 │
│              │ ◄────────────────────────────── │  200 OK         │
└──────────────┘                                  └─────────────────┘
```

O backend **nunca recebe o arquivo** — ele apenas gera URLs assinadas. O upload vai direto do cliente para o S3.

---

## Estrutura de Diretórios

```
file-service/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   └── infra/
│   │   │       ├── guards/api-key.guard.ts
│   │   │       ├── guards/admin.guard.ts
│   │   │       └── decorators/public.decorator.ts
│   │   ├── files/
│   │   │   ├── files.module.ts
│   │   │   ├── application/use-cases/
│   │   │   │   ├── generate-upload-url.use-case.ts
│   │   │   │   ├── get-file-url.use-case.ts
│   │   │   │   ├── delete-file.use-case.ts
│   │   │   │   ├── list-files.use-case.ts
│   │   │   │   └── register-file.use-case.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/file.entity.ts
│   │   │   │   └── repositories/file.repository.interface.ts
│   │   │   └── infra/
│   │   │       ├── controllers/files.controller.ts
│   │   │       ├── repositories/prisma-file.repository.ts
│   │   │       └── dtos/
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   ├── domain/storage-provider.interface.ts
│   │   │   └── infra/providers/s3-storage.provider.ts
│   │   ├── storages/
│   │   │   ├── storages.module.ts
│   │   │   ├── application/use-cases/
│   │   │   │   ├── create-storage.use-case.ts
│   │   │   │   ├── list-storages.use-case.ts
│   │   │   │   ├── get-storage.use-case.ts
│   │   │   │   ├── update-storage.use-case.ts
│   │   │   │   └── delete-storage.use-case.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/storage.entity.ts
│   │   │   │   └── repositories/storage.repository.interface.ts
│   │   │   └── infra/
│   │   │       ├── controllers/storages.controller.ts
│   │   │       ├── repositories/prisma-storage.repository.ts
│   │   │       └── dtos/
│   │   ├── clients/
│   │   │   ├── clients.module.ts
│   │   │   ├── application/use-cases/
│   │   │   │   ├── create-client.use-case.ts
│   │   │   │   ├── list-clients.use-case.ts
│   │   │   │   ├── get-client.use-case.ts
│   │   │   │   ├── regenerate-key.use-case.ts
│   │   │   │   └── delete-client.use-case.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/client.entity.ts
│   │   │   │   └── repositories/client.repository.interface.ts
│   │   │   └── infra/
│   │   │       ├── controllers/clients.controller.ts
│   │   │       ├── repositories/prisma-client.repository.ts
│   │   │       └── dtos/
│   │   └── health/
│   └── shared/
│       ├── config/
│       ├── database/
│       ├── aws/
│       ├── exceptions/
│       └── utils/
├── test/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── requests.http
└── README.md
```

---

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Conta AWS com bucket S3 e credenciais IAM

### Permissões IAM mínimas necessárias

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::SEU-BUCKET/*"
    }
  ]
}
```

---

## Execução Local

### 1. Clonar e instalar dependências

```bash
git clone <repo>
cd file-service
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais AWS e configurações
```

### 3. Subir o PostgreSQL com Docker

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Executar migrations e seed

```bash
npm run prisma:migrate
npm run prisma:seed
```

O seed cria um storage `default` e um cliente com uma API Key. **Salve a API Key exibida no terminal.**

### 5. Iniciar a aplicação

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000/api/v1`.

---

## Variáveis de Ambiente

| Variável                  | Descrição                                 | Padrão        |
|---------------------------|-------------------------------------------|---------------|
| `NODE_ENV`                | Ambiente da aplicação                     | `development` |
| `PORT`                    | Porta HTTP                                | `3000`        |
| `DATABASE_URL`            | Connection string PostgreSQL              | —             |
| `AWS_ACCESS_KEY_ID`       | AWS Access Key ID                         | —             |
| `AWS_SECRET_ACCESS_KEY`   | AWS Secret Access Key                     | —             |
| `AWS_REGION`              | Região AWS                                | `us-east-1`   |
| `PRESIGNED_URL_EXPIRES_IN`| Expiração da URL de upload (segundos)     | `300`         |

---

## Endpoints da API

### Files

| Método   | Endpoint              | Descrição                              |
|----------|-----------------------|----------------------------------------|
| `POST`   | `/files/upload-url`   | Gera URL pré-assinada para upload S3   |
| `GET`    | `/files/:id/url`      | Gera URL pré-assinada para download    |
| `DELETE` | `/files/:id`          | Remove arquivo do S3 e do banco        |
| `GET`    | `/files`              | Lista arquivos com paginação           |

#### POST /files/upload-url

```json
// Request
{
  "storageName": "default",
  "folder": "avatars",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg"
}

// Response 201
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "key": "avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
  "uploadUrl": "https://s3.amazonaws.com/...",
  "expiresIn": 300
}
```

#### GET /files?page=1&limit=10

```json
// Response 200
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### Storages _(requer admin)_

| Método   | Endpoint          | Descrição                                              |
|----------|-------------------|--------------------------------------------------------|
| `POST`   | `/storages`       | Cria configuração de storage                           |
| `GET`    | `/storages`       | Lista todos os storages                                |
| `GET`    | `/storages/:id`   | Busca storage por ID                                   |
| `PUT`    | `/storages/:id`   | Atualiza storage                                       |
| `DELETE` | `/storages/:id`   | Remove storage (409 se houver arquivos associados)     |

### Clients _(requer admin)_

| Método   | Endpoint                        | Descrição                  |
|----------|---------------------------------|----------------------------|
| `POST`   | `/clients`                      | Cria novo cliente API      |
| `GET`    | `/clients`                      | Lista clientes             |
| `GET`    | `/clients/:id`                  | Busca cliente por ID       |
| `PATCH`  | `/clients/:id/regenerate-key`   | Regenera API Key           |
| `DELETE` | `/clients/:id`                  | Remove cliente             |

### Health

| Método | Endpoint   | Descrição                         |
|--------|------------|-----------------------------------|
| `GET`  | `/health`  | Status da aplicação e banco       |

---

## Autenticação

Todos os endpoints (exceto `/health`) requerem o header:

```
x-api-key: fsk_your_api_key_here
```

O guard valida a chave no banco e verifica se o cliente está ativo.

### Níveis de acesso

| Recurso        | Cliente normal | Cliente admin (`isAdmin: true`) |
|----------------|-----------------|----------------------------------|
| `/files`       | ✅              | ✅                               |
| `/storages`    | ❌ 403          | ✅                               |
| `/clients`     | ❌ 403          | ✅                               |
| `/health`      | ✅ (público)    | ✅ (público)                     |

O seed cria o cliente padrão com `isAdmin: true`. Novos clientes criados via `POST /clients` terão `isAdmin: false` por padrão — ajuste diretamente no banco se necessário.

Para marcar um endpoint como público:

```typescript
import { Public } from '@/modules/auth/infra/decorators/public.decorator';

@Get('my-public-route')
@Public()
async publicRoute() { ... }
```

---

## Swagger

Com a aplicação rodando, acesse:

```
http://localhost:3000/docs
```

Clique em **Authorize** e insira sua API Key para testar os endpoints diretamente pela UI.

---

## Testes

```bash
# Testes unitários
npm test

# Watch mode
npm run test:watch

# Cobertura
npm run test:cov

# Testes e2e (mock de banco/S3, não requer infra real)
npm run test:e2e

# Lint
npm run lint
```

Testes unitários cobrem:

- `GenerateUploadUrlUseCase` — fluxo feliz, storage inexistente, key sem folder
- `DeleteFileUseCase` — deleção, arquivo inexistente, storage inexistente
- `DeleteStorageUseCase` — deleção, storage inexistente, 409 quando há arquivos associados
- `ApiKeyGuard` — rota pública, sem key, key inválida, cliente inativo, acesso válido
- `S3StorageProvider` — geração de URLs assinadas, deleção, propagação de erros

Testes e2e cobrem:
- Bootstrap da aplicação completo (com mocks de PrismaService e S3Client)
- `GET /api/v1/health` → 200
- `GET /api/v1/files` sem API key → 401

---

## Docker

### Produção (app + postgres)

```bash
# Copie e configure as variáveis
cp .env.example .env

# Suba os serviços
docker compose up -d

# Execute migrations
docker compose exec app npx prisma migrate deploy

# (Opcional) Seed
docker compose exec app npx ts-node prisma/seed.ts
```

### Apenas desenvolvimento (postgres)

```bash
docker compose -f docker-compose.dev.yml up -d
```

> **Nota:** O entrypoint de produção compilado é `dist/src/main.js`. O `package.json` e o `Dockerfile` estão configurados com o caminho correto (`node dist/src/main`).

---

## Evoluções Futuras

O serviço foi projetado para suportar as seguintes funcionalidades sem refatoração estrutural:

- **Thumbnail** — use-case pós-upload que gera miniatura e armazena como arquivo derivado
- **Compressão de imagens** — pipeline opcional na geração da URL ou pós-upload via webhook
- **OCR** — use-case assíncrono que processa PDFs/imagens e armazena o texto extraído
- **Antivirus** — middleware de validação pós-upload integrado a ClamAV ou serviço externo
- **CDN** — configuração de CloudFront como distribuição sobre os buckets S3
- **Multi-cloud** — nova implementação de `StorageProvider` para GCS ou Azure Blob Storage
