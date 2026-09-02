import { config } from '../config/env';
import type { ContactInput } from '../schemas/contact.schema';

export class ContactService {
  async sendMessage(input: ContactInput) {
    if (!config.resendApiKey) {
      throw new Error('Serviço de email não configurado');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.contactEmailFrom,
        to: config.contactEmailTo,
        reply_to: input.email,
        subject: `Nova mensagem de contacto de ${input.name}`,
        text: `De: ${input.name} <${input.email}>\n\n${input.message}`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Falha ao enviar email: ${body}`);
    }
  }
}
