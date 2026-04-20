import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function createEmailMessage(to: string, subject: string, html: string): string {
  const emailLines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html
  ];
  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const gmail = await getGmailClient();
    const raw = createEmailMessage(options.to, options.subject, options.html);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    console.log("Email sent successfully via Gmail to:", options.to);
    return true;
  } catch (error: any) {
    console.error("Gmail error:", error.message);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  documentType: string
): Promise<boolean> {
  const html = `
    <h2>Verificação de Seller - Boi na Rede</h2>
    <p>Olá ${name},</p>
    <p>Recebemos sua solicitação de verificação de vendedor com documento tipo <strong>${documentType}</strong>.</p>
    <p>Nosso time está analisando sua documentação. Você receberá uma resposta em até 24 horas.</p>
    <p>Obrigado por usar Boi na Rede!</p>
    <p>Equipe Boi na Rede</p>
  `;

  return sendEmail({
    to: email,
    subject: "Verificação de Seller - Boi na Rede",
    html,
  });
}

export async function sendMessageNotificationEmail(
  email: string,
  senderName: string,
  messagePreview: string
): Promise<boolean> {
  const html = `
    <h2>Nova Mensagem - Boi na Rede</h2>
    <p>Olá,</p>
    <p>Você recebeu uma mensagem de <strong>${senderName}</strong>:</p>
    <p><em>"${messagePreview.substring(0, 100)}..."</em></p>
    <p><a href="https://boinarede.replit.dev/chat">Ver conversa completa</a></p>
    <p>Equipe Boi na Rede</p>
  `;

  return sendEmail({
    to: email,
    subject: "Nova Mensagem de " + senderName,
    html,
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const html = `
    <h2>Bem-vindo à Boi na Rede!</h2>
    <p>Olá ${name},</p>
    <p>Sua conta foi criada com sucesso. Você está no plano <strong>Free</strong> com até 5 anúncios.</p>
    <p>Para começar, <a href="https://boinarede.replit.dev/create-ad">crie seu primeiro anúncio</a>.</p>
    <p>Equipe Boi na Rede</p>
  `;

  return sendEmail({
    to: email,
    subject: "Bem-vindo à Boi na Rede!",
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2e7d32;">Recuperação de Senha - Boi na Rede</h2>
      <p>Olá ${name},</p>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2e7d32; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Redefinir Senha
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
      <p style="color: #666; font-size: 14px;">Se você não solicitou a recuperação de senha, ignore este email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">Equipe Boi na Rede</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Recuperação de Senha - Boi na Rede",
    html,
  });
}

export async function sendFavoriteNotification(
  email: string,
  sellerName: string,
  adTitle: string,
  buyerName: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2e7d32;">Seu anúncio foi favoritado!</h2>
      <p>Olá ${sellerName},</p>
      <p><strong>${buyerName}</strong> adicionou seu anúncio "<strong>${adTitle}</strong>" aos favoritos.</p>
      <p>Isso significa que há interesse no seu gado! Fique atento a possíveis contatos.</p>
      <p style="margin-top: 20px;">
        <a href="https://boinarede.replit.dev/dashboard" 
           style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Ver meu painel
        </a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">Equipe Boi na Rede</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${buyerName} favoritou seu anúncio!`,
    html,
  });
}

export async function sendWeeklySummary(
  email: string,
  name: string,
  stats: {
    totalViews: number;
    totalFavorites: number;
    newMessages: number;
    activeAds: number;
    avgArrobaPrice: number;
  }
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2e7d32;">Resumo Semanal - Boi na Rede</h2>
      <p>Olá ${name},</p>
      <p>Aqui está o resumo da sua semana na plataforma:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 10px;">
              <strong style="font-size: 24px; color: #2e7d32;">${stats.totalViews}</strong><br>
              <span style="color: #666;">Visualizações</span>
            </td>
            <td style="padding: 10px;">
              <strong style="font-size: 24px; color: #f44336;">${stats.totalFavorites}</strong><br>
              <span style="color: #666;">Favoritos</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px;">
              <strong style="font-size: 24px; color: #1976d2;">${stats.newMessages}</strong><br>
              <span style="color: #666;">Mensagens</span>
            </td>
            <td style="padding: 10px;">
              <strong style="font-size: 24px; color: #ff9800;">${stats.activeAds}</strong><br>
              <span style="color: #666;">Anúncios Ativos</span>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin: 20px 0;">
        <strong>Cotação média da @ esta semana:</strong><br>
        <span style="font-size: 24px; color: #2e7d32;">R$ ${stats.avgArrobaPrice.toFixed(2)}</span>
      </div>
      
      <p>
        <a href="https://boinarede.replit.dev/dashboard" 
           style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Acessar meu painel
        </a>
      </p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Você recebe este email porque está cadastrado na Boi na Rede.<br>
        <a href="https://boinarede.replit.dev/profile">Gerenciar preferências de email</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Seu resumo semanal - ${stats.totalViews} visualizações!`,
    html,
  });
}

export async function sendPriceAlertEmail(
  email: string,
  name: string,
  state: string,
  newPrice: number,
  oldPrice: number,
  change: number
): Promise<boolean> {
  const direction = change > 0 ? "subiu" : "caiu";
  const color = change > 0 ? "#2e7d32" : "#f44336";
  const arrow = change > 0 ? "↑" : "↓";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${color};">Alerta de Preço - ${state}</h2>
      <p>Olá ${name},</p>
      <p>A cotação da arroba em <strong>${state}</strong> ${direction}!</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
        <span style="color: #666;">Preço anterior</span><br>
        <span style="font-size: 18px; text-decoration: line-through;">R$ ${oldPrice.toFixed(2)}</span>
        <br><br>
        <span style="color: ${color};">${arrow} Novo preço</span><br>
        <span style="font-size: 32px; color: ${color}; font-weight: bold;">R$ ${newPrice.toFixed(2)}</span>
        <br><br>
        <span style="color: ${color}; font-size: 14px;">
          ${change > 0 ? "+" : ""}${change.toFixed(1)}%
        </span>
      </div>
      
      <p>
        <a href="https://boinarede.replit.dev/cotacoes" 
           style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Ver todas as cotações
        </a>
      </p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">Equipe Boi na Rede</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${arrow} Arroba ${direction} ${Math.abs(change).toFixed(1)}% em ${state}`,
    html,
  });
}
