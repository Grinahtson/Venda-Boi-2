// Resend Email Service - Using Replit Integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail || 'Boi na Rede <contato@vendaboi.com.br>',
      to: ['grina_2@hotmail.com'],
      replyTo: data.email,
      subject: data.subject || `Contato de ${data.name} - Boi na Rede`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nova Mensagem de Contato</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p style="color: #374151; margin-bottom: 20px;">
              <strong>Nome:</strong> ${data.name}<br/>
              <strong>Email:</strong> ${data.email}<br/>
              ${data.subject ? `<strong>Assunto:</strong> ${data.subject}<br/>` : ''}
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
              <p style="color: #374151; white-space: pre-wrap;">${data.message}</p>
            </div>
          </div>
          <div style="background: #1f2937; padding: 15px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              Boi na Rede - Marketplace de Gado | vendaboi.com.br
            </p>
          </div>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
}
