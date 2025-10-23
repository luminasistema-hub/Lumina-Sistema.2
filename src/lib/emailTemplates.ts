interface EmailTemplateProps {
  title: string;
  description: string;
  link?: string | null;
  churchName: string;
  notificationType: string;
}

export const createStandardEmailHtml = ({
  title,
  description,
  link,
  churchName,
  notificationType,
}: EmailTemplateProps): string => {
  const linkButton = link
    ? `<a href="${window.location.origin}${link}" target="_blank" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px;">Acessar Link</a>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background-color: #4f46e5; color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 32px; color: #333; line-height: 1.6; }
        .content h2 { color: #111827; margin-top: 0; }
        .content p { margin: 1em 0; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; }
        .footer a { color: #4f46e5; text-decoration: none; }
        .button-container { text-align: center; }
        .notification-type { background-color: #eef2ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; display: inline-block; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${churchName}</h1>
        </div>
        <div class="content">
          <div class="notification-type">${notificationType}</div>
          <h2>${title}</h2>
          <p>${description.replace(/\n/g, '<br>')}</p>
          ${link ? `<div class="button-container">${linkButton}</div>` : ''}
        </div>
        <div class="footer">
          <p>Esta é uma notificação automática do sistema Lumina.</p>
          <p>&copy; ${new Date().getFullYear()} Lumina. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};