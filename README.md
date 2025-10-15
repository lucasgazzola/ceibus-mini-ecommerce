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
- Docker & docker compose (para la opción con Docker)

## Variables de entorno

No se deben hardcodear secretos en producción. Estas variables son necesarias al ejecutar la app (local o Docker):

- DATABASE_URL (obligatoria) — URL de conexión a PostgreSQL, p.ej. `postgresql://postgres:postgres@localhost:5432/ceibus`
- JWT_SECRET (obligatoria) — secreto para firmar/verificar JWT
- JWT_EXPIRES_IN (opcional) — duración del token (ej. `30m`). Default: `30m`.
- NODE_ENV (opcional) — `development`|`production`. Default: `development`.
- PORT (opcional) — puerto donde corre la API. Default: `3000`.

IMPORTANTE: El proyecto NO debería correr con secretos por defecto en entornos reales. El `docker-compose.yml` del repo incluye valores de ejemplo; cámbielos en despliegues reales.

## Scripts útiles (package.json)

- npm run start:dev — inicia en modo desarrollo con hot-reload (nest)
- npm run build — transpila TypeScript a `dist/`
- npm run start:prod — ejecuta `dist/main.js`
- npm run migrate — aplica migraciones (prisma migrate deploy)
- npm run migrate:dev — crea/aplica migración de desarrollo
- npm run seed — ejecuta el seed (usa `prisma/seed.js`)
- npm run test — ejecuta tests (Jest)

## Seeds y credenciales de prueba

El seed crea usuarios y productos mínimos (ver `prisma/seed.js`):

- admin@local.com / adminpass (role: ADMIN)
- user1@local.com / userpass (role: USER)
- user2@local.com / userpass (role: USER)

Productos creados (IDs fijos):

- id: `product-a` — Product A — priceCents: 1000 — stock: 10
- id: `product-b` — Product B — priceCents: 2500 — stock: 5

Estos credenciales se colocan acá solo para pruebas y deben cambiarse en producción.

## Endpoints principales (resumen)

Autenticación

- POST /auth/register — body: { email, password } — devuelve { access_token }
- POST /auth/login — body: { email, password } — devuelve { access_token }

Usuarios

- GET /users/me — (auth) devuelve perfil del usuario autenticado

Productos

- POST /products — (ADMIN) crea producto
- GET /products — lista productos (opciones: ?q=, ?is_active=)
- GET /products/:id — obtiene producto
- PATCH /products/:id — (ADMIN) actualiza
- DELETE /products/:id — (ADMIN) elimina

Pedidos

- POST /orders — (USER) crea pedido. Body: { items: [{ product_id, quantity }] }
- GET /orders — USER: retorna propios; ADMIN: todos. Filtrar por ?status=
- GET /orders/:id — obtiene pedido (ADMIN puede ver cualquier pedido;
  USER solo si es propietario)
- PATCH /orders/:id/:status — (ADMIN) cambiar estado: PENDING→PAID o PENDING→CANCELLED

Swagger UI disponible en `/docs` una vez que la app está corriendo.

## Reglas de negocio importantes (implementadas)

- Validación de DTOs con `class-validator`.
- Crear pedido:
  - Se valida stock suficiente por ítem antes de la transacción.
  - La creación del pedido y la reducción de stock se ejecutan dentro de una transacción Prisma ($transaction). Si algo falla, todo se revierte.
  - Al crear, el pedido queda en estado `PENDING` y el stock se descuenta inmediatamente.
  - `total_cents` se calcula como sum(items.quantity \* unit_price_cents) usando el precio actual del producto.
- Cambios de estado:
  - De `PENDING` a `PAID`: no modifica stock.
  - De `PENDING` a `CANCELLED`: repone el stock de los items del pedido dentro de una transacción; la reposición ocurre una sola vez porque solo se permite cambiar desde PENDING.
- Manejo de errores centralizado: servicios lanzan excepciones de NestJS (BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException) con códigos HTTP correctos.

## Seguridad

- Helmet habilitado (headers de seguridad).
- CORS habilitado por defecto (ajustable en `src/main.ts`).
- Endpoints protegidos con JWT; guardias comprueban rol cuando es necesario.

## Cómo correr (sin Docker)

1. Instalar dependencias

```bash
npm ci
```

2. Configurar variables de entorno (ejemplo):

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ceibus"
export JWT_SECRET="mi-secreto-super-seguro"
export JWT_EXPIRES_IN="30m"
export NODE_ENV="development"
export PORT=3000
```

3. Crear la base de datos y aplicar migraciones (si usas Prisma Migrate):

```bash
npm run migrate:dev
```

4. Ejecutar el seed (opcional pero recomendado para pruebas):

```bash
npm run seed
```

5. Iniciar en modo desarrollo:

```bash
npm run start:dev
```

Luego abrir http://localhost:3000/docs para Swagger.

Notas:

- Si no quieres usar migraciones automáticas, puedes ejecutar `prisma db push` o adaptar según tu flujo.

## Cómo correr con Docker

El repo incluye un `Dockerfile` y `docker-compose.yml` que levantan la API y Postgres.

1. Copia/edita el `docker-compose.yml` si quieres cambiar credenciales. Por defecto el archivo expone Postgres en el puerto 5433 de la máquina anfitrión y la API en 3000.

2. Levantar los servicios:

```bash
docker compose up --build
```

3. Acceder a Swagger en http://localhost:3000/docs

Nota sobre secretos en Docker: el `docker-compose.yml` contiene valores de ejemplo para `DATABASE_URL` y `JWT_SECRET` que deben considerarse únicamente para pruebas locales.

Notas importantes sobre el comportamiento del contenedor

- El `docker-entrypoint.sh` (ejecutado por la imagen) ya realiza, por defecto, estos pasos en el arranque:

  1.  `npm run prisma:generate` — generar Prisma client
  2.  `npm run migrate` — aplicar migraciones (deploy)
  3.  si no hay migrations, `npm run db:push` — crear esquema
  4.  `npm run seed` — ejecutar `prisma/seed.js` si existe
  5.  arrancar la app (`node dist/main.js`)

- Por tanto, si ejecutas `docker compose up --build` la imagen intentará aplicar migraciones y ejecutar el seed automáticamente antes de iniciar la API.

## Tests

Ejecutar tests unitarios (Jest):

```bash
npm run test
```

Los tests incluyen suites mínimas para `ProductsService` y `OrdersService`. Revisa `src/*/*.spec.ts` para detalles.

## Decisiones clave y atajos (½ página)

- Transacciones de pedido: usé `prisma.$transaction` para asegurar atomicidad entre la creación de `Order`/`OrderItem` y la actualización del stock. Se valida stock antes de abrir la transacción para hacerlo fail-fast y dar errores rápidos.
- Descuento/restitución de stock: el stock se descuenta al crear el pedido (estado PENDING). Si el pedido es CANCELLED por un ADMIN, el código repone el stock sumando las cantidades de los `OrderItem` dentro de una transacción. PAID no toca stock. La lógica permite evitar doble reposición porque solo está permitido cambiar estado desde PENDING.
- Estructura de módulos: separé `auth`, `users`, `products`, `orders` y `prisma` en módulos por responsabilidad. Repositorios Prisma implementan interfaces para permitir reemplazo (por ejemplo, si se quisiera cambiar a TypeORM).
- Seguridad y validaciones: `class-validator` y `ValidationPipe` para DTOs; `helmet` y `CORS` para mitigaciones básicas; JWT con `jsonwebtoken` y un guard personalizado `JwtAuthGuard` que inyecta `JWT_SECRET`.

Atajos/compromisos tomados por tiempo:

- El token incluye datos mínimos en el payload (sub, email, role) y no hay refresh tokens (requerido solo access token según enunciado).
- Manejo de roles sencillo: guardias + cheques en controladores (se pudo extraer a decorators/guards más finos si hubiese más tiempo).

## Cómo verificar funcionalidades clave rápidamente

1. Registrar / Login

   - POST /auth/login con `admin@local.com`/`adminpass` devuelve access_token.

2. CRUD Productos (ADMIN)

   - Añadir header `Authorization: Bearer <token>` del admin.
   - POST /products crea producto.
   - GET /products lista y filtra.

3. Crear pedido (USER)

   - Login con `user1@local.com`/`userpass`, usar su token.
   - POST /orders con body: { items: [{ product_id: 'product-a', quantity: 2 }] }
   - Verificar que stock de `product-a` disminuye en 2.

4. Cancelar pedido (ADMIN)
   - Con token admin: PATCH /orders/:id/CANCELLED
   - Verificar que stock se restituyó.
