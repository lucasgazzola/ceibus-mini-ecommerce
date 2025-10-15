import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'
import FakePrismaService from '../utils/fake-prisma.service'
import * as jwt from 'jsonwebtoken'
import { UserRole, OrderStatus } from '../../src/utils/enums'

describe('E2E flujo HTTP completo (register/login -> product -> order -> status)', () => {
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
  })

  afterAll(async () => {
    await app.close()
  })

  it('Register/login -> admin crea producto -> user crea pedido -> admin PAID', async () => {
    // create admin directly in fake DB and craft JWT
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@e2e.test',
        passwordHash: 'h',
        role: UserRole.ADMIN,
        createdAt: new Date(),
      },
    })
    const secret = (process.env.JWT_SECRET || 'default-secret') as jwt.Secret
    const adminToken = `Bearer ${jwt.sign(
      {
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      } as any,
      secret as any,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30m' } as any
    )}`

    // admin creates product (using crafted token)
    const resCreate = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', adminToken)
      .send({ name: 'E2E Product', priceCents: 500, stock: 10 })
      .expect(201)
    const product = resCreate.body

    // register buyer
    const buyerReg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'buyer@e2e.test', password: 'buyerpass' })
      .expect(201)
    const buyerToken = buyerReg.body.access_token

    // buyer crea order
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [{ product_id: product.id, quantity: 2 }] })
      .expect(201)
    const order = orderRes.body

    // admin cambia status a PAID
    const payRes = await request(app.getHttpServer())
      .patch(`/orders/${order.id}/${OrderStatus.PAID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
    expect(payRes.body.status).toBe(OrderStatus.PAID)
  })
})
