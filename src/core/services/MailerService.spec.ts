import nodemailer from 'nodemailer';
import { MailerService } from './MailerService';

jest.mock('nodemailer');
jest.mock('@core/utils', () => ({
  getEnvironmentVariables: () => ({
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: 587,
    SMTP_USER: 'user',
    SMTP_PASS: 'pass',
    SMTP_FROM: 'noreply@test.com',
    FRONTEND_URL: 'http://localhost:3000'
  })
}));

describe('MailerService', () => {
  let mailerService: MailerService;
  let mockTransporter: any;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    mailerService = new MailerService();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      await mailerService.sendWelcomeEmail('test@example.com', 'John', 'token123');
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Bienvenido'),
        html: expect.stringContaining('John')
      }));
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
        await mailerService.sendPasswordResetEmail('test@example.com', 'John', 'token123');
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'test@example.com',
            subject: expect.stringContaining('Recuperación'),
        }));
    });
  });
});
