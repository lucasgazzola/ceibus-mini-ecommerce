import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // Caso: HttpException de Nest
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const resBody = exception.getResponse()
      this.logger.error(`HTTP ${status} - ${JSON.stringify(resBody)}`)
      return response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.message,
        error: (resBody as any).error || (resBody as any).message || resBody,
      })
    }

    // Caso: errores de Prisma
    if (
      (exception as any)?.code &&
      (exception as any).__proto__?.name === 'PrismaClientKnownRequestError'
    ) {
      const prismaErr = exception as Prisma.PrismaClientKnownRequestError
      const status = HttpStatus.BAD_REQUEST
      this.logger.error(`Prisma error ${prismaErr.code}: ${prismaErr.message}`)
      return response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        error: 'Database error',
        message: prismaErr.message,
        details: { code: prismaErr.code, meta: prismaErr.meta },
      })
    }

    // Otros errores no esperados
    this.logger.error('Unexpected error', exception as any)
    const status = HttpStatus.INTERNAL_SERVER_ERROR
    return response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'An unexpected error occurred',
      error: 'Internal server error',
    })
  }
}
