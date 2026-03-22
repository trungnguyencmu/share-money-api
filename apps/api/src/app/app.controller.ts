import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get API status' })
  @ApiResponse({ status: 200, description: 'Returns API status message' })
  getData() {
    return this.appService.getData();
  }
}
