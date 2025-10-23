import { Controller, Get } from '@nestjs/common';

@Controller('/health')
export class AppController {
  @Get()
  ping() {
    return { ok: true, name: 'SOVO prototype v0.2' };
  }
}
