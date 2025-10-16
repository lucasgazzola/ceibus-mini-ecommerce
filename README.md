# Ceibus Mini E‑commerce — Backend (NestJS)

Este repositorio contiene la solución al desafío técnico de Ceibus Tech: una API REST construida con NestJS + TypeScript, Prisma + PostgreSQL, autenticación JWT, validación con class-validator, y Docker para ejecución sencilla.

## Resumen rápido

- Auth: registro/login con JWT (solo access token). Passwords con bcrypt.
- Entidades: User, Product, Order, OrderItem (ver `prisma/schema.prisma`).
- Roles: ADMIN y USER. Reglas mínimas de autorización implementadas.
- Swagger: documentación auto-generada disponible en `/docs`.
- DB: Prisma + PostgreSQL. Seeds incluidos (`prisma/seed.js`).

## Requisitos

- Node.js 18+ / npm
- Docker & docker compose (opcional)

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar valores. Variables principales:

- DATABASE_URL — URL de Postgres (ej: `postgresql://postgres:postgres@localhost:5432/ceibus`)
- JWT_SECRET — secreto para firmar tokens (obligatorio)
- JWT_EXPIRES_IN — duración del token (default: `30m`)
- NODE_ENV — `development`|`production` (default: `development`)
- PORT — puerto donde corre la API (default: `3000`)

## Endpoints principales

Autenticación

- POST /auth/register — body: { email, password } — devuelve { access_token }
- POST /auth/login — body: { email, password } — devuelve { access_token }

Usuarios

- GET /users/me — (auth) devuelve perfil del usuario autenticado

Productos

- POST /products — (ADMIN) crea producto
- GET /products — lista productos (opciones: ?q=, (ADMIN) ?is_active=)
- GET /products/:id — obtiene producto (USER no puede acceder al producto si no está activo)
- PATCH /products/:id — (ADMIN) actualiza producto
- DELETE /products/:id — (ADMIN) marca producto como inactivo

Pedidos

- POST /orders — (USER) crea pedido. Body: { items: [{ product_id, quantity }] }
- GET /orders — USER: retorna propios; ADMIN: todos. Filtrar por ?status=
- GET /orders/:id — obtiene pedido (ADMIN puede ver cualquier pedido; USER solo si es propietario)
- PATCH /orders/:id/status — (ADMIN) cambiar estado: PENDING→PAID o PENDING→CANCELLED

## Manejo global de errores

El proyecto incluye un filtro global `AllExceptionsFilter` en `src/common/filters/all-exceptions.filter.ts`. Este filtro:

- Normaliza respuestas de error para que siempre devuelvan JSON con: `{ statusCode, message, timestamp, path }`.
- Convierte errores no manejados en `Internal Server Error (500)` y preserva errores HTTP de NestJS (BadRequest, NotFound, Forbidden, etc.).
- Facilita logging centralizado.

El filtro se aplica globalmente en `src/main.ts` con `app.useGlobalFilters(new AllExceptionsFilter())`.

## Arquitectura y decisiones clave

- Transacciones de pedido: la creación de pedidos y la modificación del stock se realizan dentro de una transacción Prisma (`prisma.$transaction`) para garantizar atomicidad. Antes de abrir la transacción se valida stock para dar errores rápidos.
- Transición de estados: Solo se permiten las transiciónes `PENDING`→`PAID` o `PENDING`→`CANCELLED`
- Descuento/reposición de stock: al crear un pedido el stock se descuenta inmediatamente y el pedido queda en estado `PENDING`. Si un ADMIN cambia el pedido a `CANCELLED`, el stock se repone dentro de una transacción. `PAID` no modifica stock.
- Repositorios: cada entidad (Products, Orders, Users) tiene un repositorio y una implementación Prisma (`prisma-*.repository.ts`). Esto facilita testeo y potencial cambio de ORM. Además, el servicio deja de depender de un repositorio concreto y pasa a depender de una interfaz.
- Guards y autorización: `JwtAuthGuard` protege rutas y extrae `req.user` del token; `AdminGuard` usa el `role` para restringir endpoints administrativos. Los cheques adicionales de propiedad (por ejemplo en `GET /orders/:id`) se realizan en controladores.
- DTOs y validación: DTOs usan `class-validator` y `ValidationPipe` (configurado en `main.ts`) para validar y transformar payloads entrantes.
- Swagger: `@nestjs/swagger` con decoradores en controladores expone la documentación en `/docs` automáticamente.
- Tests: unit tests (Jest) para `ProductsService` y `OrdersService`. Tests e2e usan `FakePrismaService` para evitar dependencia de Postgres.
- FakePrismaService: diseñado para emular solo lo necesario en e2e (findMany con filtros básicos, create/update de entidades y transacciones simples con `$transaction(fn)`).

## Estructura de carpetas

- src/auth — autenticación, guards, DTOs, token service, hashing
- src/products — controlador, servicio, DTOs, repositorios
- src/orders — controlador, servicio, DTOs, repositorios
- src/prisma — PrismaService y módulo para inyección
- src/users — controlador, servicio, DTOs, repositorios
- src/common/filters — `AllExceptionsFilter`

## Cómo correr (local)

1. Instalar dependencias

```bash
npm ci
```

2. Copiar variables de entorno

```bash
cp .env.example .env
# editar .env con valores reales
```

3. Generar Prisma Client y aplicar migraciones (dev)

```bash
npm run prisma:generate
npm run migrate:dev
```

4. Ejecutar seed (opcional)

```bash
npm run seed
```

5. Iniciar en modo desarrollo

```bash
npm run start:dev
```

Abrir http://localhost:3000/docs para Swagger.

## Cómo correr con Docker

1. Revisar `docker-compose.yml` y ajustar variables si hace falta.

2. Levantar servicios:

```bash
docker compose up --build
```

El `docker-entrypoint.sh` intenta generar Prisma Client, ejecutar migraciones o `db:push` y ejecutar el seed antes de arrancar la app para facilitar pruebas locales.

## Tests

Ejecutar tests unitarios:

```bash
npm run test
```

Ejecutar e2e (usa FakePrismaService):

```bash
npm run test:e2e
```
