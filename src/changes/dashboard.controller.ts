import { Body, Controller, Get, Param, Post, Query, Render, Res } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ChangesService } from './changes.service';
import { RequestStatus } from '../common/types';
import { Response } from 'express';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly requestsSvc: RequestsService,
    private readonly changesSvc: ChangesService,
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
}
