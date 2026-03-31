import nodemailer from "nodemailer";
import { getEnvironmentVariables } from "@core/utils";

const env = getEnvironmentVariables();

class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      throw error; // Lanzar error para que el controlador lo capture
    }
  }

  async sendWelcomeEmail(to: string, name: string, token: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const subject = "¡Bienvenido a InmoHub! Verifica tu cuenta";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">InmoHub</h1>
          <p style="font-size: 1.1em; color: #666;">Tu plataforma inmobiliaria inteligente</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; color: #1e293b;">¡Hola, ${name}!</h2>
          <p style="line-height: 1.6;">Estamos encantados de tenerte con nosotros. Para empezar a gestionar tus propiedades de manera más eficiente, por favor verifica tu cuenta haciendo clic en el botón de abajo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 1.1em;">Verificar mi cuenta</a>
          </div>
          <p style="font-size: 0.9em; color: #64748b;">Este paso es necesario para activar todas las funcionalidades de la plataforma.</p>
          <p style="font-size: 0.85em; color: #64748b; margin-top: 20px;">O copia y pega este enlace:<br>${verificationUrl}</p>
          <p style="font-size: 0.85em; color: #64748b;">Si no has creado esta cuenta, por favor ignora este mensaje.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 0.8em; color: #94a3b8;">
          <p>&copy; ${new Date().getFullYear()} InmoHub. Todos los derechos reservados.</p>
        </div>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendVerificationEmail(to: string, name: string, token: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const subject = "Verifica tu correo electrónico - InmoHub";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">InmoHub</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; color: #1e293b;">Verifica tu correo</h2>
          <p style="line-height: 1.6;">Hola ${name}, para completar tu registro y asegurar tu cuenta, por favor haz clic en el botón de abajo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verificar email</a>
          </div>
          <p style="font-size: 0.85em; color: #64748b;">O copia y pega este enlace en tu navegador:<br>${verificationUrl}</p>
          <p style="font-size: 0.85em; color: #e11d48; margin-top: 20px;">Este enlace expirará en 24 horas.</p>
        </div>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = "Recuperación de contraseña - InmoHub";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">InmoHub</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; color: #1e293b;">Restablecer contraseña</h2>
          <p style="line-height: 1.6;">Hola ${name}, hemos recibido una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este correo.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Cambiar contraseña</a>
          </div>
          <p style="font-size: 0.85em; color: #64748b;">Este enlace expirará en 1 hora por seguridad.</p>
        </div>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendPasswordChangedNotification(to: string, name: string) {
    const subject = "Tu contraseña ha sido cambiada - InmoHub";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #fff4f4; border-radius: 12px; padding: 30px; border: 1px solid #fee2e2;">
          <h2 style="margin-top: 0; color: #991b1b;">Aviso de seguridad</h2>
          <p style="line-height: 1.6;">Hola ${name}, te informamos que la contraseña de tu cuenta InmoHub ha sido cambiada recientemente.</p>
          <p style="line-height: 1.6; font-weight: 600;">Si no has realizado este cambio, por favor contacta con soporte de inmediato o intenta recuperar tu cuenta.</p>
        </div>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendEmailChangedNotification(to: string, name: string, oldEmail: string, newEmail: string) {
    const subject = "Tu dirección de correo ha sido cambiada - InmoHub";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #fff4f4; border-radius: 12px; padding: 30px; border: 1px solid #fee2e2;">
          <h2 style="margin-top: 0; color: #991b1b;">Aviso de cambio de email</h2>
          <p style="line-height: 1.6;">Hola ${name}, te informamos que el email de tu cuenta ha sido cambiado.</p>
          <p><strong>Email anterior:</strong> ${oldEmail}</p>
          <p><strong>Nuevo email:</strong> ${newEmail}</p>
          <p style="line-height: 1.6; font-weight: 600;">Si no has realizado este cambio, por favor contacta con soporte de inmediato.</p>
        </div>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendSecurityAlert(to: string, name: string, detail: string) {
    const subject = "Alerta de seguridad - InmoHub";
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #fff4f4; border-radius: 12px; padding: 30px; border: 1px solid #fee2e2;">
          <h2 style="margin-top: 0; color: #991b1b;">Actividad inusual detectada</h2>
          <p style="line-height: 1.6;">Hola ${name}, hemos detectado actividad inusual en tu cuenta:</p>
          <p style="background: #f1f5f9; padding: 10px; border-radius: 4px;">${detail}</p>
          <p style="line-height: 1.6;">Si has sido tú, puedes ignorar este aviso. De lo contrario, te recomendamos cambiar tu contraseña.</p>
        </div>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }
}

export { MailerService };
