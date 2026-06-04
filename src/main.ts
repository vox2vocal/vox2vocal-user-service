import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { join } from 'node:path'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const httpPort = configService.get<number>('PORT', 3002)
  const grpcUrl = configService.get<string>('GRPC_URL', '0.0.0.0:50051')

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(process.cwd(), 'proto/user.proto'),
      url: grpcUrl,
    },
  })

  await app.startAllMicroservices()
  await app.listen(httpPort)
}

void bootstrap()
