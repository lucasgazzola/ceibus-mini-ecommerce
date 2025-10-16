import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import helmet from 'helmet'
import { Logger, ValidationPipe } from '@nestjs/common'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as process from 'process'
import { OrderItemDto } from './orders/dto/order-item.dto'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)
  app.use(helmet())
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalFilters(new AllExceptionsFilter())

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

  // Hace que el esquema de portador registrado ('access_token') sea un requisito de seguridad global
  // para que Swagger UI incluya el encabezado de Autorización en las solicitudes Try it una vez que el usuario haga clic en Autorizar.
  document.security = [{ access_token: [] }]

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const port = process.env.PORT || 3000
  await app.listen(port)
  logger.log(`Application listening on port ${port}`)
}

bootstrap()
