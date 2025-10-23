import { Body, Controller, Get, Param, Post, Render, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { RequestsService } from './requests.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { getPriceListForBranch } from './price-list';

@Controller()
export class ChangesController {
  constructor(
    private readonly svc: ChangesService,
    private readonly requestsSvc: RequestsService,
  ) {}

  @Get('/')
  @Render('index')
  root() {
    return { title: 'SOVO – zmiany lokatorskie' };
  }

  @Get('/wniosek')
  @Render('wniosek')
  form() {
    return { title: 'Wniosek o wprowadzenie zmian lokatorskich' };
  }

  @Post('/api/estimate')
  estimate(@Body() body: any) {
    const items = Array.isArray(body.items) ? body.items : JSON.parse(body.items || '[]');
    const est = this.svc.estimate(items);
    return est;
  }

  @Get('/api/price-list/:branch')
  getPriceListByBranch(@Param('branch') branch: string) {
    const items = getPriceListForBranch(decodeURIComponent(branch));
    return items;
  }

  @Post('/wniosek/podsumowanie')
  @UseInterceptors(FileFieldsInterceptor(
    [{ name: 'attachments', maxCount: 10 }],
    {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }
  ))
  @Render('podsumowanie')
  async submit(@Body() body: any, @UploadedFiles() files: { attachments?: Express.Multer.File[] }) {
    const request = this.svc.toRequest(body);
    const saved = (files?.attachments || []).map(f => f.filename);
    request.attachments = saved;

    const estimate = this.svc.estimate(request.items);

    // Save to JSON storage
    await this.requestsSvc.saveRequest(request, estimate);

    return { title: 'Podsumowanie wniosku', request, estimate, saved };
  }

  @Get('/cennik')
  @Render('cennik')
  cennik() {
    return { title: 'Cennik zmian lokatorskich' };
  }
}
