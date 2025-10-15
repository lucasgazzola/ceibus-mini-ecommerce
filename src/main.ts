import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import helmet from 'helmet'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as process from 'process'
import { OrderItemDto } from './orders/dto/order-item.dto'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(helmet())
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const config = new DocumentBuilder()
    .setTitle('Ceibus Mini E-commerce')
    .setDescription('API')
    .setVersion('0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access_token'
    )
    .build()

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [OrderItemDto],
  })

  // Make the registered bearer scheme ('access_token') a global security
  // requirement so Swagger UI will include the Authorization header on
  // Try it requests once the user clicks Authorize.
  ;(document as any).security = [{ access_token: [] }]

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`Listening on ${port}`)
}

bootstrap()
