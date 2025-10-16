# Ceibus Mini E‑commerce — Backend (NestJS)

Este repositorio contiene la solución al desafío técnico de Ceibus Tech: una API REST construida con NestJS + TypeScript, Prisma + PostgreSQL, autenticación JWT, validación con class-validator, y Docker para ejecución sencilla.

## Resumen rápido

- Auth: registro/login con JWT (solo access token). Passwords con bcrypt.
- Entidades: User, Product, Order, OrderItem (ver `prisma/schema.prisma`).
- Roles: ADMIN y USER. Reglas mínimas de autorización implementadas.
- Swagger: documentación auto-generada disponible en `/docs`.
- DB: Prisma + PostgreSQL. Seeds incluidos (`prisma/seed.js`).

## Requisitos

# Ceibus Mini E‑commerce — Backend (NestJS)

Este repositorio contiene la solución al desafío técnico de Ceibus Tech: una API REST construida con NestJS + TypeScript, Prisma + PostgreSQL. Está pensada para ser fácil de ejecutar en local y en Docker, con autenticación JWT, validaciones, transacciones en pedidos y tests mínimos.

## Contenido rápido

- Código: `src/`
- Esquema Prisma: `prisma/schema.prisma`
- Seeds: `prisma/seed.js`
- Tests: `test/` (unit + e2e usando FakePrismaService)
- Docs: Swagger auto-generado en `/docs` cuando la app está corriendo

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

## Scripts útiles

- npm ci — instalar dependencias
- npm run start:dev — iniciar en modo desarrollo (hot-reload)
- npm run build — compilar a `dist/`
- npm run start:prod — ejecutar producción
- npm run prisma:generate — generar Prisma Client
- npm run migrate — aplicar migraciones (deploy)
- npm run migrate:dev — migración de desarrollo
- npm run db:push — sincronizar esquema sin migraciones
- npm run seed — ejecutar seed
- npm run test — ejecutar tests unitarios
- npm run test:e2e — ejecutar tests e2e (usa FakePrismaService)

## Endpoints principales

Autenticación

- POST /auth/register — body: { email, password } — devuelve { access_token }
- POST /auth/login — body: { email, password } — devuelve { access_token }

Usuarios

- GET /users/me — (auth) devuelve perfil del usuario autenticado

Productos (ADMIN)

- POST /products — crea producto
- GET /products — lista productos (opciones: ?q=, ?is_active=)
- GET /products/:id — obtiene producto
- PATCH /products/:id — actualiza producto
- DELETE /products/:id — marca producto como inactivo

Pedidos

- POST /orders — (USER) crea pedido. Body: { items: [{ product_id, quantity }] }
- GET /orders — USER: retorna propios; ADMIN: todos. Filtrar por ?status=
- GET /orders/:id — obtiene pedido (ADMIN puede ver cualquier pedido; USER solo si es propietario)
- PATCH /orders/:id/status — (ADMIN) cambiar estado: PENDING→PAID o PENDING→CANCELLED

## Manejo global de errores

El proyecto incluye un filtro global `AllExceptionsFilter` en `src/common/filters/all-exceptions.filter.ts`. Este filtro:

- Normaliza respuestas de error para que siempre devuelvan JSON con: `{ statusCode, message, timestamp, path }`.
- Convierte errores no manejados en `Internal Server Error (500)` y preserva errores HTTP de NestJS (BadRequest, NotFound, Forbidden, etc.).
- Facilita logging centralizado y evita fugas de stack trace en producción.

Documentar el uso del filtro: el filtro se aplica globalmente en `src/main.ts` con `app.useGlobalFilters(new AllExceptionsFilter())`.

## Arquitectura y decisiones clave

Resumen (½ página):

- Transacciones de pedido: la creación de pedidos y la modificación del stock se realizan dentro de una transacción Prisma (`prisma.$transaction`) para garantizar atomicidad. Antes de abrir la transacción se valida stock para fail-fast y dar errores rápidos.
- Descuento/reposición de stock: al crear un pedido el stock se descuenta inmediatamente y el pedido queda en estado `PENDING`. Si un ADMIN cambia el pedido a `CANCELLED`, el stock se repone dentro de una transacción. `PAID` no modifica stock.
- Repositorios: cada entidad (Products, Orders, Users) tiene un repositorio (interfaces en `src/*/repository/*`) y una implementación Prisma (`prisma-*.repository.ts`). Esto facilita testeo y potencial cambio de ORM.
- Guards y autorización: `JwtAuthGuard` protege rutas y extrae `req.user` del token; `AdminGuard` usa el `role` para restringir endpoints administrativos. Los cheques adicionales de propiedad (por ejemplo en `GET /orders/:id`) se realizan en controladores.
- DTOs y validación: DTOs usan `class-validator` y `ValidationPipe` (configurado en `main.ts`) para validar y transformar payloads entrantes.
- Swagger: `@nestjs/swagger` con decoradores en controladores expone la documentación en `/docs` automáticamente.
- Tests: unit tests (Jest) para `ProductsService` y `OrdersService`. Tests e2e usan `FakePrismaService` para evitar dependencia de Postgres en CI local.

Decisiones de diseño relevantes

- Validación doble en update: el servicio valida existencia y además verifica que la operación de update devuelva un resultado (cubre condiciones de carrera o repositorios que devuelven null).
- FakePrismaService: diseñado para emular solo lo necesario en e2e (findMany con filtros básicos, create/update de entidades y transacciones simples con `$transaction(fn)`). Mantener este fake sincronizado con el uso real es clave para tests sólidos.

## Estructura de carpetas (rápida)

- src/auth — autenticación, token service, hashing
- src/products — controlador, servicio, DTOs, repositorios
- src/orders — controlador, servicio, DTOs, repositorios
- src/prisma — PrismaService y módulo para inyección
- src/users — controlador y servicio de usuarios
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

## Qué falta / Recomendaciones para pasar el desafío técnico

Ver sección siguiente "Comparación con el enunciado".

## Comparación con el enunciado del desafío técnico

He revisado el repositorio y lo comparé con el enunciado original. A continuación detallo cobertura y gaps.

Cobertura (implementado)

- NestJS + TypeScript: sí
- Prisma con Postgres: sí (schema y migraciones incluidas)
- Swagger: configurado (expuesto en `/docs`)
- Entidades: `User`, `Product`, `Order`, `OrderItem` en `prisma/schema.prisma`
- Auth JWT: registro/login, token con `jsonwebtoken`, bcrypt para hashing
- Guards: `JwtAuthGuard` y `AdminGuard` implementados
- DTOs: `class-validator` usado en DTOs y `ValidationPipe` aplicado
- Repositorios: interfaces y repositorios Prisma (ej. `prisma-order.repository.ts`)
- Transacciones: creación de pedidos y ajuste de stock en transacción Prisma
- Error handling: `AllExceptionsFilter` implementado y aplicado
- Seeds: `prisma/seed.js` con 1 admin, 2 usuarios y 2 productos (IDs fijos)
- Docker: `Dockerfile`, `docker-compose.yml` y `docker-entrypoint.sh`
- Scripts npm: start:dev, build, start:prod, migrate, migrate:dev, seed, test

Gaps / mejoras recomendadas (para cumplir 100%)

1. CI: añadir GitHub Actions (lint + build + test) — recomendado.
2. Tests: asegurar cobertura mínima con:
   - Unit tests: `ProductsService` y `OrdersService` (ya hay tests, revisar cobertura y añadir casos faltantes).
   - E2E: al menos 1 e2e que cubra register/login → crear pedido → cambiar estado (ya hay e2e con FakePrismaService).
3. Concurrencia en stock: añadir test o manejo para condiciones de carrera (dos pedidos simultáneos que consumen el mismo stock). Opciones: bloqueo optimista o transaccional con checks en SQL.
4. Documentación adicional: exportar Postman/Insomnia y ejemplos de request/response en README.
5. Hardening: rate limiting y ajustes de CORS en producción.

## Checklist final (entregables)

- [x] Repositorio con código
- [x] README con pasos para correr (local y Docker), variables y seeds
- [x] Swagger en `/docs`
- [x] Scripts npm necesarios
- [x] Seeds mínimos
- [x] Tests unitarios y e2e mínimos

---

Si querés, aplico las siguientes mejoras automáticamente:

- Añadir workflow de GitHub Actions básico para CI
- Añadir tests unitarios faltantes y/o aumentar cobertura
- Generar colección Postman/Insomnia exportable

Decime qué querés que haga a continuación y lo implemento.
