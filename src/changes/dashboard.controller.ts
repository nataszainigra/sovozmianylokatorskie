import { Body, Controller, Get, Param, Post, Query, Render, Res, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RequestsService } from './requests.service';
import { ChangesService } from './changes.service';
import { EmailService } from '../email/email.service';
import { RequestStatus } from '../common/types';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly requestsSvc: RequestsService,
    private readonly changesSvc: ChangesService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  @Render('dashboard/index')
  async index() {
    const requests = await this.requestsSvc.getAllRequests();
    const stats = await this.requestsSvc.getStats();
    return { title: 'Dashboard - Wnioski o zmiany', requests, stats };
  }

  @Get('/request/:id')
  @Render('dashboard/detail')
  async detail(@Param('id') id: string, @Query('sent') sent?: string) {
    const request = await this.requestsSvc.getRequestById(id);
    if (!request) {
      return { title: 'Nie znaleziono', error: 'Wniosek nie istnieje' };
    }

    // Re-calculate estimate with current items
    const estimate = this.changesSvc.estimate(request.items);

    return {
      title: `Wniosek ${request.unitNumber}`,
      request,
      estimate,
      sent: sent === 'true'
    };
  }

  @Post('/request/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: RequestStatus; notes?: string },
    @Res() res: Response,
  ) {
    await this.requestsSvc.updateRequestStatus(id, body.status, body.notes);
    res.redirect(`/dashboard/request/${id}`);
  }

  @Post('/request/:id/items')
  @Render('dashboard/detail')
  async updateItems(
    @Param('id') id: string,
    @Body() body: { items: string },
  ) {
    const items = JSON.parse(body.items || '[]');
    const estimate = this.changesSvc.estimate(items);
    const request = await this.requestsSvc.updateRequestItems(id, items, estimate);

    if (!request) {
      return { title: 'Nie znaleziono', error: 'Wniosek nie istnieje' };
    }

    return {
      title: `Wniosek ${request.unitNumber}`,
      request,
      estimate,
      showSendButton: true
    };
  }

  @Post('/request/:id/send-quote')
  async sendQuote(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const request = await this.requestsSvc.getRequestById(id);
    if (!request) {
      return res.redirect('/dashboard');
    }

    // Update status to 'zaakceptowany' when quote is sent
    await this.requestsSvc.updateRequestStatus(id, 'zaakceptowany', 'Kosztorys wysłany do klienta');

    // TODO: Send actual email with quote
    // For now, just update status and redirect
    // You can implement email sending here using nodemailer or similar

    res.redirect(`/dashboard/request/${id}?sent=true`);
  }

  @Post('/send-request-to-client')
  @UseInterceptors(
    FilesInterceptor('kartaLokalu', 10, {
      storage: diskStorage({
        destination: './karty',
        filename: (req, file, cb) => {
          // Get unit number from request body
          const unitNumber = (req.body as any).unitNumber || 'unknown';
          const timestamp = Date.now();
          const ext = extname(file.originalname);
          // Save as unitNumber-timestamp.pdf (e.g., A12-1234567890.pdf)
          cb(null, `${unitNumber}-${timestamp}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      },
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
    }),
  )
  async sendRequestToClient(
    @Body() body: { buyerName: string; email: string; unitNumber: string },
    @UploadedFiles() files: Express.Multer.File[],
    @Res() res: Response,
  ) {
    try {
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Karta lokalu jest wymagana' });
      }

      // Generate unique token/link for client
      const token = Math.random().toString(36).substring(2, 15);
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const clientLink = `${appUrl}/wniosek?token=${token}&unit=${encodeURIComponent(body.unitNumber)}&name=${encodeURIComponent(body.buyerName)}&email=${encodeURIComponent(body.email)}`;

      // Send email to client
      const emailSent = await this.emailService.sendRequestInvitation(
        body.email,
        body.buyerName,
        body.unitNumber,
        clientLink,
      );

      if (!emailSent) {
        console.warn('⚠️  Nie udało się wysłać emaila, ale pliki zostały zapisane');
      }

      console.log('='.repeat(60));
      console.log('WNIOSEK WYSŁANY DO KLIENTA:');
      console.log('Imię i nazwisko:', body.buyerName);
      console.log('Email:', body.email);
      console.log('Numer lokalu:', body.unitNumber);
      console.log('Karty lokalu zapisane jako:');
      files.forEach(f => console.log('  -', f.filename));
      console.log('Link dla klienta:', clientLink);
      console.log('Email wysłany:', emailSent ? '✅ TAK' : '❌ NIE');
      console.log('='.repeat(60));

      return res.status(200).json({
        success: true,
        message: emailSent
          ? 'Wniosek został wysłany do klienta na email'
          : 'Pliki zapisane, ale nie udało się wysłać emaila. Sprawdź konfigurację SMTP.',
        clientLink,
        emailSent,
      });
    } catch (error) {
      console.error('Error sending request to client:', error);
      return res.status(500).json({ message: 'Błąd podczas wysyłania wniosku' });
    }
  }
}
