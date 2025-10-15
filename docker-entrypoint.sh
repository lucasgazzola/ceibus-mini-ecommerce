#!/bin/sh
set -e

echo "Waiting for postgres..."
until nc -z postgres 5432; do
  sleep 1
done

echo "Generating Prisma client"
if [ -f node_modules/.bin/prisma ]; then
  npm run prisma:generate --silent || true
fi

echo "Applying migrations (deploy) if available"
if [ -f node_modules/.bin/prisma ]; then
  npm run migrate --silent || true
fi

# If there are no migrations, ensure DB schema is created with db push
if [ ! -d prisma/migrations ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "No migrations found — running db push to create schema"
  if [ -f node_modules/.bin/prisma ]; then
    npm run db:push --silent || true
  fi
fi

echo "Seeding database (if seed script exists)"
if [ -f prisma/seed.js ]; then
  npm run seed --silent || true
fi

echo "Starting app"
node dist/main.js
