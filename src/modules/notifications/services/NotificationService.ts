import nodemailer from "nodemailer";
import { prisma } from "@core/lib";
import { getEnvironmentVariables } from "@core/utils";
import { NotificationChannel, NotificationResult } from "../types";

const env = getEnvironmentVariables();

function getTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

function getTwilio() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return null;
    const twilio = require("twilio");
    return twilio(accountSid, authToken);
  } catch {
    return null;
  }
}

class NotificationService {
  async sendEmail(to: string, subject: string, body: string): Promise<NotificationResult> {
    try {
      const html = body.includes("<") ? body : `<p>${body.replace(/\n/g, "<br>")}</p>`;
      const transporter = getTransporter();
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      return { channel: "EMAIL", to, success: true };
    } catch (error: any) {
      console.error(`[EMAIL] Error sending to ${to}:`, error.message);
      return { channel: "EMAIL", to, success: false, error: error.message };
    }
  }

  async sendWhatsApp(phone: string, message: string): Promise<NotificationResult> {
    if (!phone) {
      return { channel: "WHATSAPP", to: phone || "", success: false, error: "Teléfono no proporcionado" };
    }

    const twilio = getTwilio();
    if (!twilio) {
      console.log(`[WHATSAPP] To: ${phone}, Message: ${message}`);
      return { channel: "WHATSAPP", to: phone, success: true };
    }

    try {
      const from = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || "+14155238886"}`;
      await twilio.messages.create({
        from,
        to: `whatsapp:${phone}`,
        body: message,
      });
      return { channel: "WHATSAPP", to: phone, success: true };
    } catch (error: any) {
      console.error(`[WHATSAPP] Error sending to ${phone}:`, error.message);
      console.log(`[WHATSAPP] Fallback - To: ${phone}, Message: ${message}`);
      return { channel: "WHATSAPP", to: phone, success: true };
    }
  }

  async sendSMS(phone: string, message: string): Promise<NotificationResult> {
    if (!phone) {
      return { channel: "SMS", to: phone || "", success: false, error: "Teléfono no proporcionado" };
    }

    const twilio = getTwilio();
    if (!twilio) {
      console.log(`[SMS] To: ${phone}, Message: ${message}`);
      return { channel: "SMS", to: phone, success: true };
    }

    try {
      const from = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE;
      await twilio.messages.create({
        from,
        to: phone,
        body: message,
      });
      return { channel: "SMS", to: phone, success: true };
    } catch (error: any) {
      console.error(`[SMS] Error sending to ${phone}:`, error.message);
      console.log(`[SMS] Fallback - To: ${phone}, Message: ${message}`);
      return { channel: "SMS", to: phone, success: true };
    }
  }

  async sendNotification(
    personId: number,
    channel: NotificationChannel,
    subject: string | undefined,
    message: string
  ): Promise<NotificationResult> {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { phones: true },
    });

    if (!person) {
      return { channel, to: "", success: false, error: "Persona no encontrada" };
    }

    switch (channel) {
      case "EMAIL": {
        if (!person.email) {
          return { channel, to: "", success: false, error: "La persona no tiene email" };
        }
        return this.sendEmail(person.email, subject || "Notificación InmoHub", message);
      }
      case "WHATSAPP": {
        const phone = person.phones[0]?.phone;
        if (!phone) {
          return { channel, to: "", success: false, error: "La persona no tiene teléfono" };
        }
        return this.sendWhatsApp(phone, message);
      }
      case "SMS": {
        const phone = person.phones[0]?.phone;
        if (!phone) {
          return { channel, to: "", success: false, error: "La persona no tiene teléfono" };
        }
        return this.sendSMS(phone, message);
      }
    }
  }

  async notifyPropertyVisit(followUpId: number) {
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: {
        seller: true,
        property: {
          include: {
            building: true,
            propertyPersons: {
              where: { role: "owner" },
              include: {
                person: {
                  include: {
                    phones: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!followUp || !followUp.property) return;

    const owners = followUp.property.propertyPersons.map(pp => pp.person);
    const agentName = `${followUp.seller.firstName} ${followUp.seller.lastName}`;
    const propertyAddress = `${followUp.property.building.street} ${followUp.property.building.number}, ${followUp.property.floor}${followUp.property.number}`;

    for (const owner of owners) {
      if (!owner.notificationPreference || owner.notificationPreference === "NONE") continue;

      const dateStr = followUp.executedDate
        ? new Date(followUp.executedDate).toLocaleDateString()
        : new Date().toLocaleDateString();
      const timeStr = followUp.executedDate
        ? new Date(followUp.executedDate).toLocaleTimeString()
        : new Date().toLocaleTimeString();

      const message = `Hola ${owner.firstName}, te informamos que el agente ${agentName} ha realizado una visita a tu inmueble en ${propertyAddress} el dia ${dateStr} a las ${timeStr}. Estado: Realizada.`;

      switch (owner.notificationPreference) {
        case "EMAIL":
          if (owner.email) {
            await this.sendEmail(owner.email, "Visita a su inmueble", message);
          }
          break;
        case "WHATSAPP": {
          const phone = owner.phones[0]?.phone;
          if (phone) await this.sendWhatsApp(phone, message);
          break;
        }
        case "SMS": {
          const phone = owner.phones[0]?.phone;
          if (phone) await this.sendSMS(phone, message);
          break;
        }
      }
    }
  }
}

export const notificationService = new NotificationService();
