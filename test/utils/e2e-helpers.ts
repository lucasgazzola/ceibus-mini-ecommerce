import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/prisma/prisma.service'
import FakePrismaService from './fake-prisma.service'
import { UserRole } from '../../src/utils/enums'

export async function setupApp(): Promise<{
  app: INestApplication
  prisma: FakePrismaService
}> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(new FakePrismaService())
    .compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  const prisma = moduleRef.get(PrismaService) as FakePrismaService
  return { app, prisma }
}

export async function createAdmin(
  prisma: FakePrismaService,
  email = 'admin@test'
) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'h',
      role: UserRole.ADMIN,
      createdAt: new Date(),
    },
  })
}

export async function createUser(
  prisma: FakePrismaService,
  email = 'user@test'
) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'h',
      role: UserRole.USER,
      createdAt: new Date(),
    },
  })
}

export function createProductRequest(
  app: INestApplication,
  token: string,
  payload: any
) {
  return request(app.getHttpServer())
    .post('/products')
    .set('Authorization', token)
    .send(payload)
}

export async function registerAndLogin(
  app: INestApplication,
  email: string,
  password: string
) {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
  return res.body.access_token
}
