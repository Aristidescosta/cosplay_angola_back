# Cosplay Angola — Backend API

API REST para o **Cosplay Angola**, o acervo fotográfico dos maiores eventos de cosplay em Angola. Gere eventos, galerias de fotos, fotógrafos e o upload/armazenamento de imagens.

---

## Índice

- [Sobre o Projecto](#sobre-o-projecto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Base de Dados](#base-de-dados)
- [Scripts](#scripts)
- [Estrutura do Projecto](#estrutura-do-projecto)
- [Modelos de Dados](#modelos-de-dados)
- [Roles e Permissões](#roles-e-permissões)
- [Endpoints da API](#endpoints-da-api)
- [Storage de Imagens](#storage-de-imagens)
- [Testes](#testes)
- [Convenções](#convenções)

---

## Sobre o Projecto

O backend expõe uma API REST construída com **Fastify** e **Prisma** (PostgreSQL). As suas responsabilidades principais são:

- Autenticação de administradores e fotógrafos via JWT
- CRUD de Eventos, Galerias e Fotos
- Upload e processamento de imagens (geração automática de thumbnails, versões média, grande e original via Sharp)
- Armazenamento de imagens em S3/MinIO
- Controlo de visibilidade (rascunho / publicado) para eventos, galerias e fotos
- Gestão de Tags para categorização de fotos (personagens, séries, eventos, etc.)

---

## Tecnologias

| Tecnologia | Versão | Propósito |
|---|---|---|
| Node.js | 20+ | Runtime |
| TypeScript | 6 | Tipagem estática |
| Fastify | 5 | Framework HTTP |
| Prisma | 7 | ORM / migrações |
| PostgreSQL | 15 | Base de dados |
| MinIO / AWS S3 | — | Armazenamento de imagens |
| Sharp | — | Processamento de imagens |
| JWT (jsonwebtoken) | — | Autenticação |
| Zod | 4 | Validação de dados |
| Vitest | — | Testes |

---

## Pré-requisitos

- **Node.js** ≥ 20
- **Yarn** (gestor de pacotes)
- **Docker** e **Docker Compose** (para PostgreSQL e MinIO em desenvolvimento)

---

## Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/Aristidescosta/cosplay_angola_back.git
cd cosplay_angola_back

# 2. Instalar dependências
yarn install

# 3. Copiar e preencher as variáveis de ambiente
cp .env.example .env

# 4. Iniciar os serviços de infra (PostgreSQL + MinIO)
docker compose up -d

# 5. Aplicar as migrações e gerar o cliente Prisma
yarn db:migrate
yarn db:generate

# 6. (Opcional) Popular a base de dados com dados iniciais
yarn db:seed

# 7. Iniciar em modo desenvolvimento
yarn dev
```

A API ficará disponível em `http://localhost:3333`.

---

## Variáveis de Ambiente

Copia o ficheiro `.env` e preenche os valores. Em produção, **nunca** uses os valores padrão.

```env
# Base de Dados
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cosplay_angola?schema=public"

# Servidor
PORT=3333
NODE_ENV=development

# JWT — usa um valor aleatório e seguro em produção
JWT_SECRET="mude-isto-para-algo-super-secreto"

# Upload
MAX_FILE_SIZE=10485760   # 10 MB em bytes

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=cosplay-angola
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_PUBLIC_URL=http://localhost:9000/cosplay-angola
```

---

## Base de Dados

O projecto usa **Prisma** com migrações versionadas em `prisma/migrations/`.

```bash
# Criar uma nova migração após alterar o schema
yarn db:migrate

# Regenerar o cliente Prisma (após alterar o schema sem migrar)
yarn db:generate

# Abrir o Prisma Studio (GUI para a base de dados)
yarn db:studio
```

### Serviços Docker

```bash
# Iniciar PostgreSQL + MinIO
docker compose up -d

# Parar
docker compose down

# Parar e apagar volumes (dados)
docker compose down -v
```

O **MinIO Console** (gestão do storage) fica disponível em `http://localhost:9001`
com credenciais `minioadmin` / `minioadmin`.

---

## Scripts

| Comando | Descrição |
|---|---|
| `yarn dev` | Inicia em modo desenvolvimento (hot reload via tsx watch) |
| `yarn build` | Compila TypeScript para `dist/` |
| `yarn start` | Inicia a versão compilada (`dist/server.js`) |
| `yarn db:migrate` | Cria e aplica uma nova migração Prisma |
| `yarn db:generate` | Regenera o cliente Prisma |
| `yarn db:studio` | Abre o Prisma Studio |
| `yarn db:seed` | Popula a BD com dados iniciais |
| `yarn test` | Corre os testes uma vez |
| `yarn test:watch` | Corre os testes em modo watch |
| `yarn test:coverage` | Corre os testes com relatório de cobertura |

---

## Estrutura do Projecto

```
src/
├── config/
│   ├── database.ts       # Instância do cliente Prisma
│   ├── env.ts            # Validação e acesso às variáveis de ambiente
│   └── s3.ts             # Cliente AWS S3 / MinIO
├── controllers/          # Handlers HTTP (recebem Request, devolvem Reply)
│   ├── auth.controller.ts
│   ├── dashboard.controller.ts
│   ├── event.controller.ts
│   ├── gallery.controller.ts
│   └── photo.controller.ts
├── middlewares/
│   └── auth.middleware.ts   # authMiddleware (obrigatório) + optionalAuthMiddleware
├── routes/               # Registo de rotas no Fastify
│   ├── auth.routes.ts
│   ├── event.routes.ts
│   ├── gallery.routes.ts
│   ├── photo.routes.ts
│   └── dashboard.routes.ts
├── schemas/              # Schemas Zod para validação de input
│   ├── event.schema.ts
│   ├── gallery.schema.ts
│   └── photo.schema.ts
├── services/             # Lógica de negócio (acesso à BD, storage, etc.)
│   ├── auth.service.ts
│   ├── event.service.ts
│   ├── gallery.service.ts
│   ├── photo.service.ts
│   └── storage.service.ts
├── utils/
│   ├── file-upload.ts    # Validação e geração de nomes de ficheiro
│   ├── image-processor.ts # Processamento de imagens com Sharp
│   ├── jwt.ts            # Geração e verificação de tokens JWT
│   └── password.ts       # Hash e verificação de passwords (bcrypt)
└── server.ts             # Ponto de entrada — regista plugins e rotas
```

---

## Modelos de Dados

```
User ──< Photographer (perfil estendido, 1:1)
User ──< Gallery (fotógrafo dono da galeria, N:M via role)
Event ──< Gallery ──< Photo
Tag (catálogo gerido; fotos têm tags como String[], sincronizadas com a tabela Tag)
```

### Roles de Utilizador

| Role | Descrição |
|---|---|
| `USER` | Conta base, sem permissões especiais |
| `PHOTOGRAPHER` | Pode criar galerias e fazer upload de fotos |
| `ADMIN` | Acesso total — cria/edita/apaga eventos, publica conteúdo, gere utilizadores |

### Estados de Visibilidade

Eventos, Galerias e Fotos têm um campo `published: Boolean`. O conteúdo só é devolvido ao público quando `published = true`. O admin e o dono da galeria continuam a ver rascunhos.

---

## Endpoints da API

### Autenticação
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Login, devolve JWT |
| POST | `/api/auth/register` | Público | Registo de utilizador |

### Eventos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/events` | Público | Listar eventos (filtros: `published`, `search`, `limit`, `offset`) |
| GET | `/api/events/:id` | Público | Detalhes por ID |
| GET | `/api/events/slug/:slug` | Público | Detalhes por slug (só publicados) |
| GET | `/api/events/:eventId/galleries` | Público | Galerias de um evento |
| POST | `/api/events` | ADMIN | Criar evento |
| POST | `/api/events/:id/cover` | ADMIN | Upload de imagem de capa |
| PUT | `/api/events/:id` | ADMIN | Actualizar evento |
| PATCH | `/api/events/:id/publish` | ADMIN | Publicar / despublicar |
| DELETE | `/api/events/:id` | ADMIN | Apagar evento |

### Galerias
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/galleries` | Público | Listar galerias (filtros: `eventId`, `photographerId`, `published`, `search`) |
| GET | `/api/galleries/:id` | Público¹ | Detalhes com fotos publicadas |
| POST | `/api/galleries` | PHOTOGRAPHER / ADMIN | Criar galeria |
| PUT | `/api/galleries/:id` | Dono / ADMIN | Actualizar |
| PATCH | `/api/galleries/:id/publish` | Dono / ADMIN | Publicar / despublicar |
| DELETE | `/api/galleries/:id` | Dono / ADMIN | Apagar |

¹ Rascunhos só visíveis para o dono ou ADMIN (via `optionalAuthMiddleware`).

### Fotos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/photos` | Público | Listar fotos (filtros: `galleryId`, `published`, `tags`, `search`) |
| GET | `/api/photos/:id` | Público | Detalhes de foto |
| POST | `/api/photos/upload` | PHOTOGRAPHER / ADMIN | Upload individual |
| POST | `/api/photos/upload-multiple` | PHOTOGRAPHER / ADMIN | Upload múltiplo |
| PUT | `/api/photos/:id` | Dono / ADMIN | Actualizar (caption, tags, etc.) |
| PATCH | `/api/photos/:id/publish` | Dono / ADMIN | Publicar / despublicar |
| DELETE | `/api/photos/:id` | Dono / ADMIN | Apagar foto |
| DELETE | `/api/photos` | Autenticado | Apagar várias (body: `{ ids: string[] }`) |
| POST | `/api/galleries/:galleryId/photos/reorder` | Autenticado | Reordenar fotos |

### Dashboard
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/dashboard` | ADMIN | Estatísticas gerais |

---

## Storage de Imagens

As imagens são armazenadas em **MinIO** (compatível com S3). Por cada foto enviada, o Sharp gera automaticamente 4 versões:

| Versão | Uso |
|---|---|
| `thumbnail` | Grids e listas |
| `medium` | Vistas de galeria pública |
| `large` | Lightbox / visualização principal |
| `original` | Backup sem watermark |

As chaves S3 seguem o padrão `galleries/{galleryId}/{size}/{filename}`.
As URLs públicas são construídas como `S3_PUBLIC_URL/{key}`.

---

## Testes

Os testes de integração usam uma base de dados de teste separada (`.env.test`).

```bash
# Correr todos os testes
yarn test

# Modo watch (desenvolvimento)
yarn test:watch

# Com interface gráfica
yarn test:ui

# Relatório de cobertura
yarn test:coverage
```

---

## Convenções

- **Arquitectura em camadas:** Route → Controller → Service → Prisma. A lógica de negócio vive nos Services; os Controllers apenas tratam de Request/Reply.
- **Validação com Zod:** Todos os inputs são validados pelos schemas em `src/schemas/` antes de chegarem ao Service.
- **Erros:** Os Services lançam erros com mensagens em português; os Controllers capturam-nos e devolvem o status HTTP adequado.
- **Contadores denormalizados:** `Gallery.photoCount` é mantido em sincronia pelo `GalleryService.updatePhotoCount()` após cada upload/remoção de foto — o mesmo padrão a usar para `Tag.usageCount`.
