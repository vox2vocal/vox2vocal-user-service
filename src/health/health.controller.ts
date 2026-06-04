import { Controller, Get } from '@nestjs/common'

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      service: 'user-service',
      status: 'ok',
    }
  }
}
