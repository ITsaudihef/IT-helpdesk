import { prisma } from "./prisma";
import { pushToUser } from "./sse";

interface NotifyInput {
  userId: string;
  ticketId?: string;
  message: string;
}

export async function createNotification(data: NotifyInput) {
  const notif = await prisma.notification.create({
    data,
    include: { ticket: { select: { ticketNo: true } } },
  });
  pushToUser(data.userId, {
    id: notif.id,
    message: notif.message,
    read: false,
    createdAt: notif.createdAt.toISOString(),
    ticket: notif.ticket,
  });
  return notif;
}
