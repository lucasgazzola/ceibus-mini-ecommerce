import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as jwt from 'jsonwebtoken'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'
import { UserRole, OrderStatus } from '../../src/utils/enums'
import FakePrismaService from '../utils/fake-prisma.service'
import { Product, User } from '@prisma/client'

async function createAdmin(prisma: FakePrismaService) {
  return prisma.user.create({
    data: {
      email: 'admin@test',
      passwordHash: 'h',
      role: UserRole.ADMIN,
      createdAt: new Date(),
    },
  })
}
async function createUser(prisma: FakePrismaService, email = 'user@test') {
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'h',
      role: UserRole.USER,
      createdAt: new Date(),
    },
  })
}
function createProduct(
  app: INestApplication,
  token: string,
  payload: Partial<Product>
) {
  return request(app.getHttpServer())
    .post('/products')
    .set('Authorization', token)
    .send(payload)
}

function makeJwt(user: User) {
  const secret = (process.env.JWT_SECRET || 'default-secret') as jwt.Secret
  const payload = { sub: user.id, email: user.email, role: user.role }
  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
  } as jwt.SignOptions
  return `Bearer ${jwt.sign(payload, secret, options)}`
}

describe('E2E flujo crítico (auth -> products -> crear pedido -> cambio estado)', () => {
  let app: INestApplication
  let prisma: FakePrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(new FakePrismaService())
      .compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
    prisma = moduleRef.get(PrismaService)

    // pre-seed admin
    await prisma.user.create({
      data: {
        email: 'admin@test',
        passwordHash: 'h',
        role: UserRole.ADMIN,
        createdAt: new Date(),
      },
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('Camino feliz: admin crea producto, user crea pedido, admin paga, cancelar no permitido después de PAID', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@test' },
    })
    const adminToken = makeJwt(admin)

    // admin crea producto
    const prodPayload = { name: 'Mouse', priceCents: 10000, stock: 5 }
    const resCreateProd = await createProduct(
      app,
      adminToken,
      prodPayload
    ).expect(201)
    const createdProd = resCreateProd.body

    // crear user
    const user = await createUser(prisma, 'buyer@test')
    const userToken = makeJwt(user)

    // user crea orden
    const orderPayload = {
      items: [{ product_id: createdProd.id, quantity: 2 }],
    }
    const resCreateOrder = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', userToken)
      .send(orderPayload)
      .expect(201)

    const order = resCreateOrder.body
    expect(order.id).toBeDefined()

    // admin cambia a PAID
    const resPay = await request(app.getHttpServer())
      .patch(`/orders/${order.id}/${OrderStatus.PAID}`)
      .set('Authorization', adminToken)
      .expect(200)

    expect(resPay.body.status).toBe(OrderStatus.PAID)

    // intentar cancelar (debería 400)
    await request(app.getHttpServer())
      .patch(`/orders/${order.id}/${OrderStatus.CANCELLED}`)
      .set('Authorization', adminToken)
      .expect(400)
  })

  it('Caminos no permitidos: crear producto sin auth -> 401, user no admin -> 403, crear orden stock insuficiente -> 400', async () => {
    // sin auth
    await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'NoAuth', priceCents: 100, stock: 1 })
      .expect(401)

    // crear admin y user in-memory
    const admin = await createAdmin(prisma)
    const user = await createUser(prisma, 'u2@test')
    const adminToken = makeJwt(admin)
    const userToken = makeJwt(user)

    // user intenta crear producto -> 403
    await createProduct(app, userToken, {
      name: 'Forbidden',
      priceCents: 100,
      stock: 1,
    }).expect(403)

    // admin crea producto con stock 1
    const prodRes = await createProduct(app, adminToken, {
      name: 'Limited',
      priceCents: 200,
      stock: 1,
    }).expect(201)
    const prod = prodRes.body

    // user crea orden con quantity 2 -> 400
    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', userToken)
      .send({ items: [{ product_id: prod.id, quantity: 2 }] })
      .expect(400)
  })
})
