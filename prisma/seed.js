const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const passAdmin = await bcrypt.hash('adminpass', 10)
  const passUser = await bcrypt.hash('userpass', 10)

  await prisma.user.upsert({
    where: { email: 'admin@local.com' },
    update: {},
    create: {
      email: 'admin@local.com',
      passwordHash: passAdmin,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'user1@local.com' },
    update: {},
    create: { email: 'user1@local.com', passwordHash: passUser, role: 'USER' },
  })

  await prisma.user.upsert({
    where: { email: 'user2@local.com' },
    update: {},
    create: { email: 'user2@local.com', passwordHash: passUser, role: 'USER' },
  })

  await prisma.product.upsert({
    where: { id: 'product-a' },
    update: {},
    create: {
      id: 'product-a',
      name: 'Product A',
      priceCents: 1000,
      stock: 10,
    },
  })
  await prisma.product.upsert({
    where: { id: 'product-b' },
    update: {},
    create: {
      id: 'product-b',
      name: 'Product B',
      priceCents: 2500,
      stock: 5,
    },
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
