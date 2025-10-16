import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  setupApp,
  createAdmin,
  createUser,
  createProductRequest,
  registerAndLogin,
} from '../utils/e2e-helpers'
import { signTokenBearer } from '../utils/jwt.util'
import { OrderStatus } from '../../src/utils/enums'

describe('E2E unificado - flujos principales', () => {
  let app: INestApplication
  let prisma: any

  beforeAll(async () => {
    const s = await setupApp()
    app = s.app
    prisma = s.prisma
  })

  afterAll(async () => {
    await app.close()
  })

  it('Register/login -> admin crea producto -> user crea pedido -> admin PAID', async () => {
    // Creamos admin y token
    const admin = await createAdmin(prisma, 'admin@e2e.test')
    const adminBearer = signTokenBearer(admin)

    // admin crea producto
    const resCreate = await createProductRequest(app, adminBearer, {
      name: 'E2E Product',
      priceCents: 500,
      stock: 10,
    }).expect(201)
    const product = resCreate.body

    const userToken = await registerAndLogin(app, 'user@e2e.test', 'userpass')

    // user crea order
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ product_id: product.id, quantity: 2 }] })
      .expect(201)
    const order = orderRes.body

    // admin paga
    const payRes = await request(app.getHttpServer())
      .patch(`/orders/${order.id}/${OrderStatus.PAID}`)
      .set('Authorization', adminBearer)
      .expect(200)
    expect(payRes.body.status).toBe(OrderStatus.PAID)
  })

  it('Caminos no permitidos y validaciones', async () => {
    // no auth -> 401
    await request(app.getHttpServer())
      .post('/products')
      .send({ name: 'NoAuth', priceCents: 100, stock: 1 })
      .expect(401)

    const admin = await createAdmin(prisma, 'admin2@e2e.test')
    const user = await createUser(prisma, 'u2@e2e.test')
    const adminBearer = signTokenBearer(admin)
    const userBearer = signTokenBearer(user)

    // user no puede crear producto -> 403
    await createProductRequest(app, userBearer, {
      name: 'Forbidden',
      priceCents: 100,
      stock: 1,
    }).expect(403)

    // admin crea producto con stock 1
    const prodRes = await createProductRequest(app, adminBearer, {
      name: 'Limited',
      priceCents: 200,
      stock: 1,
    }).expect(201)
    const prod = prodRes.body

    // user intenta ordenar más de lo que hay en stock -> 400
    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', userBearer)
      .send({ items: [{ product_id: prod.id, quantity: 2 }] })
      .expect(400)
  })
})
