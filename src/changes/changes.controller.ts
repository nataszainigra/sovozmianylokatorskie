import { Body, Controller, Get, Param, Post, Render, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { RequestsService } from './requests.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { getPriceListForBranch } from './price-list';
import { SupabaseService } from '../supabase/supabase.service';
import { Response } from 'express';

@Controller()
export class ChangesController {
  constructor(
    private readonly svc: ChangesService,
    private readonly requestsSvc: RequestsService,
    private readonly supabase: SupabaseService,
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
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }
  ))
  @Render('podsumowanie')
  async submit(@Body() body: any, @UploadedFiles() files: { attachments?: Express.Multer.File[] }) {
    const request = this.svc.toRequest(body);
    const client = this.supabase.getClient();

    // Upload files to Supabase Storage
    const uploadedFiles: string[] = [];
    const uploadErrors: string[] = [];

    if (files?.attachments) {
      for (const file of files.attachments) {
        try {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;
          const filePath = fileName;

          const { error: uploadError } = await client.storage
            .from('request-attachments')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            uploadErrors.push(file.originalname);
          } else {
            uploadedFiles.push(filePath);
          }
        } catch (err) {
          console.error('Upload exception:', err);
          uploadErrors.push(file.originalname);
        }
      }
    }

    request.attachments = uploadedFiles;
    const estimate = this.svc.estimate(request.items);

    // Save to Supabase database
    await this.requestsSvc.saveRequest(request, estimate);

    return {
      title: 'Podsumowanie wniosku',
      request,
      estimate,
      saved: uploadedFiles,
      uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined
    };
  }

  @Get('/uploads/:filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const client = this.supabase.getClient();

    const { data, error } = await client.storage
      .from('request-attachments')
      .download(filename);

    if (error || !data) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Content-Type', data.type);
    res.send(Buffer.from(await data.arrayBuffer()));
  }

  @Get('/cennik')
  @Render('cennik')
  cennik() {
    return { title: 'Cennik zmian lokatorskich' };
  }
}
