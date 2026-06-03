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

O projeto adota **DDD leve** com camadas bem definidas, **SOLID** e boas práticas do NestJS.

```
src/
├── modules/
│   ├── auth/               # API Key Guard + decorator @Public
│   ├── files/              # Gerenciamento de arquivos (use-cases, repositório, controller)
│   ├── storage/            # Abstração de provedor de armazenamento (interface + S3)
│   ├── storages/           # CRUD de configurações de storage (bucket/region)
│   ├── clients/            # CRUD de clientes API
│   └── health/             # Healthcheck endpoint
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
│   │   ├── clients/
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

### Storages

| Método   | Endpoint          | Descrição                        |
|----------|-------------------|----------------------------------|
| `POST`   | `/storages`       | Cria configuração de storage     |
| `GET`    | `/storages`       | Lista todos os storages          |
| `GET`    | `/storages/:id`   | Busca storage por ID             |
| `PUT`    | `/storages/:id`   | Atualiza storage                 |
| `DELETE` | `/storages/:id`   | Remove storage                   |

### Clients

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

O guard valida a chave no banco e verifica se o cliente está ativo. Para marcar um endpoint como público:

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
```

Testes unitários cobrem:

- `GenerateUploadUrlUseCase` — fluxo feliz, storage inexistente, key sem folder
- `DeleteFileUseCase` — deleção, arquivo inexistente, storage inexistente
- `ApiKeyGuard` — rota pública, sem key, key inválida, cliente inativo, acesso válido
- `S3StorageProvider` — geração de URLs assinadas, deleção, propagação de erros

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

---

## Evoluções Futuras

O serviço foi projetado para suportar as seguintes funcionalidades sem refatoração estrutural:

- **Thumbnail** — use-case pós-upload que gera miniatura e armazena como arquivo derivado
- **Compressão de imagens** — pipeline opcional na geração da URL ou pós-upload via webhook
- **OCR** — use-case assíncrono que processa PDFs/imagens e armazena o texto extraído
- **Antivirus** — middleware de validação pós-upload integrado a ClamAV ou serviço externo
- **CDN** — configuração de CloudFront como distribuição sobre os buckets S3
- **Multi-cloud** — nova implementação de `StorageProvider` para GCS ou Azure Blob Storage
