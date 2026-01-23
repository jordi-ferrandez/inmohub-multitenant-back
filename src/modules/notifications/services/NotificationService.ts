import { prisma } from "@core/lib";

class NotificationService {
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
                    phones: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!followUp || !followUp.property) return;

    const owners = followUp.property.propertyPersons.map(pp => pp.person);
    const agentName = `${followUp.seller.firstName} ${followUp.seller.lastName}`;
    const propertyAddress = `${followUp.property.building.street} ${followUp.property.building.number}, ${followUp.property.floor}${followUp.property.number}`;

    for (const owner of owners) {
      // @ts-ignore - notificationPreference will exist after prisma generate
      if (!owner.notificationPreference || owner.notificationPreference === "NONE") continue;

      const dateStr = followUp.executedDate ? new Date(followUp.executedDate).toLocaleDateString() : new Date().toLocaleDateString();
      const timeStr = followUp.executedDate ? new Date(followUp.executedDate).toLocaleTimeString() : new Date().toLocaleTimeString();

      const message = `Hola ${owner.firstName}, te informamos que el agente ${agentName} ha realizado una visita a tu inmueble en ${propertyAddress} el dia ${dateStr} a las ${timeStr}. Estado: Realizada.`;

      // @ts-ignore
      switch (owner.notificationPreference) {
        case "EMAIL":
          await this.sendEmail(owner.email, "Visita a su inmueble", message);
          break;
        case "WHATSAPP":
          await this.sendWhatsApp(owner.phones[0]?.phone, message);
          break;
        case "SMS":
          await this.sendSMS(owner.phones[0]?.phone, message);
          break;
      }
    }
  }

  private async sendEmail(to: string | null, subject: string, body: string) {
    if (!to) return;
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Body: ${body}`);
  }

  private async sendWhatsApp(phone: string | undefined, message: string) {
    if (!phone) return;
    console.log(`[WHATSAPP] To: ${phone}, Message: ${message}`);
  }

  private async sendSMS(phone: string | undefined, message: string) {
    if (!phone) return;
    console.log(`[SMS] To: ${phone}, Message: ${message}`);
  }
}

export const notificationService = new NotificationService();
