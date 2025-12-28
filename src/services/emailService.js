import { Resend } from 'resend';

// Inicializar Resend
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const appName = import.meta.env.VITE_APP_NAME || 'JournalScope';

let resend = null;

// Inicializar apenas se a chave estiver configurada
if (resendApiKey && resendApiKey !== 'your_resend_api_key') {
    resend = new Resend(resendApiKey);
}

/**
 * Enviar email de convite para coautor
 */
export const sendAuthorInviteEmail = async ({
    authorName,
    authorEmail,
    inviteToken,
    submissionTitle,
    submissionJournal,
    inviterName
}) => {
    if (!resend) {
        console.warn('Resend não configurado. Email não será enviado.');
        return {
            success: false,
            error: 'Serviço de email não configurado'
        };
    }

    try {
        const inviteUrl = `${appUrl}/accept-invite/${inviteToken}`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para Coautoria - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                                📚 ${appName}
                            </h1>
                            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                                Sistema de Gestão de Submissões Acadêmicas
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                                Olá, ${authorName}! 👋
                            </h2>
                            
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Você foi convidado por <strong>${inviterName}</strong> para ser coautor de uma submissão acadêmica.
                            </p>

                            <!-- Submission Details -->
                            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                                    📄 Detalhes da Submissão
                                </h3>
                                <p style="color: #4a5568; margin: 0 0 10px 0; font-size: 15px;">
                                    <strong>Título:</strong><br>
                                    ${submissionTitle}
                                </p>
                                <p style="color: #4a5568; margin: 0; font-size: 15px;">
                                    <strong>Periódico:</strong> ${submissionJournal}
                                </p>
                            </div>

                            <!-- Benefits -->
                            <div style="background-color: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                                    ✨ Benefícios de Aceitar
                                </h3>
                                <ul style="color: #4a5568; margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8;">
                                    <li>Acesso ao chat em tempo real com outros autores</li>
                                    <li>Acompanhar o status da submissão</li>
                                    <li>Participar das revisões e discussões</li>
                                    <li>Gerenciar suas submissões em um só lugar</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                    Aceitar Convite
                                </a>
                            </div>

                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                                Ou copie e cole este link no seu navegador:<br>
                                <a href="${inviteUrl}" style="color: #667eea; word-break: break-all;">${inviteUrl}</a>
                            </p>

                            <!-- Warning -->
                            <div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="color: #744210; margin: 0; font-size: 14px;">
                                    ⚠️ <strong>Importante:</strong> Este convite é válido por 7 dias. Após este período, será necessário solicitar um novo convite.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                                Este é um email automático do ${appName}
                            </p>
                            <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                                Se você não esperava este convite, pode ignorar este email com segurança.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'JournalScope <onboarding@resend.dev>',
            to: authorEmail,
            subject: `Convite para Coautoria: ${submissionTitle}`,
            html: emailHtml,
        });

        if (error) {
            console.error('Erro ao enviar email:', error);
            return {
                success: false,
                error: error.message
            };
        }

        console.log('Email enviado com sucesso:', data);
        return {
            success: true,
            data
        };

    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Enviar email de notificação de nova mensagem no chat
 */
export const sendChatNotificationEmail = async ({
    recipientName,
    recipientEmail,
    senderName,
    message,
    submissionTitle,
    chatUrl
}) => {
    if (!resend) {
        console.warn('Resend não configurado. Email não será enviado.');
        return {
            success: false,
            error: 'Serviço de email não configurado'
        };
    }

    try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nova Mensagem - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1a202c; margin: 0 0 20px 0;">
                                💬 Nova Mensagem
                            </h2>
                            <p style="color: #4a5568; font-size: 16px; margin: 0 0 20px 0;">
                                Olá, ${recipientName}!
                            </p>
                            <p style="color: #4a5568; font-size: 16px; margin: 0 0 20px 0;">
                                <strong>${senderName}</strong> enviou uma nova mensagem no chat da submissão "<strong>${submissionTitle}</strong>":
                            </p>
                            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <p style="color: #2d3748; margin: 0; font-style: italic;">
                                    "${message}"
                                </p>
                            </div>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${chatUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                    Ver Mensagem
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'JournalScope <onboarding@resend.dev>',
            to: recipientEmail,
            subject: `Nova mensagem de ${senderName} - ${submissionTitle}`,
            html: emailHtml,
        });

        if (error) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            data
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

export default {
    sendAuthorInviteEmail,
    sendChatNotificationEmail
};
