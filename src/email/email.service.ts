import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendRequestInvitation(
    to: string,
    buyerName: string,
    unitNumber: string,
    clientLink: string,
  ): Promise<boolean> {
    try {
      const emailFrom = this.configService.get('EMAIL_FROM') || 'SOVO Development <noreply@sovo.pl>';

      const info = await this.transporter.sendMail({
        from: emailFrom,
        to: to,
        subject: `Zaproszenie do wypełnienia wniosku o zmiany lokatorskie - ${unitNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #7A0C2E; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #7A0C2E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .button:hover { background: #5A0821; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7A0C2E; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">SOVO Development</h1>
                <p style="margin: 10px 0 0 0;">Zmiany lokatorskie</p>
              </div>

              <div class="content">
                <h2 style="color: #7A0C2E;">Witaj ${buyerName}!</h2>

                <p>Otrzymujesz tę wiadomość, ponieważ Dział Techniczny SOVO przygotował dla Ciebie możliwość złożenia wniosku o wprowadzenie zmian lokatorskich dla lokalu <strong>${unitNumber}</strong>.</p>

                <div class="card">
                  <h3 style="margin-top: 0; color: #7A0C2E;">Co musisz zrobić?</h3>
                  <ol style="padding-left: 20px;">
                    <li>Kliknij w poniższy link, aby przejść do formularza wniosku</li>
                    <li>Twoje dane kontaktowe będą już wstępnie wypełnione</li>
                    <li>Karta lokalu jest już dostępna do pobrania</li>
                    <li>Wypełnij listę zmian, które chcesz wprowadzić</li>
                    <li>Dołącz rysunki z zaznaczonymi zmianami</li>
                    <li>Wyślij wniosek</li>
                  </ol>
                </div>

                <div style="text-align: center;">
                  <a href="${clientLink}" class="button">Przejdź do formularza wniosku</a>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  <strong>Uwaga:</strong> Pamiętaj o oznaczeniu zmian na kartach technicznych zgodnie z zasadami:<br>
                  🔴 Usunięcie - kolor czerwony<br>
                  🟢 Dodanie - kolor zielony<br>
                  🔵 Przesunięcie - kolor niebieski
                </p>
              </div>

              <div class="footer">
                <p>Wiadomość wygenerowana automatycznie przez system SOVO Development</p>
                <p style="font-size: 12px;">Jeśli nie oczekiwałeś tej wiadomości, zignoruj ją.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Witaj ${buyerName}!

Otrzymujesz tę wiadomość, ponieważ Dział Techniczny SOVO przygotował dla Ciebie możliwość złożenia wniosku o wprowadzenie zmian lokatorskich dla lokalu ${unitNumber}.

Aby wypełnić wniosek, kliknij w poniższy link:
${clientLink}

Twoje dane kontaktowe będą już wstępnie wypełnione, a karta lokalu dostępna do pobrania.

Co musisz zrobić?
1. Kliknij w link powyżej
2. Wypełnij listę zmian, które chcesz wprowadzić
3. Dołącz rysunki z zaznaczonymi zmianami
4. Wyślij wniosek

Pamiętaj o oznaczeniu zmian na kartach technicznych zgodnie z zasadami:
- Usunięcie - kolor czerwony
- Dodanie - kolor zielony
- Przesunięcie - kolor niebieski

---
Wiadomość wygenerowana automatycznie przez system SOVO Development
        `,
      });

      console.log('Email wysłany:', info.messageId);
      return true;
    } catch (error) {
      console.error('Błąd podczas wysyłania emaila:', error);
      return false;
    }
  }
}
