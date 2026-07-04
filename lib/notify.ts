import { prisma } from "./prisma";
import { pushToUser } from "./sse";

interface NotifyInput {
  userId: string;
  ticketId?: string;
  projectId?: string;
  message: string;
}

export async function createNotification(data: NotifyInput) {
  const notif = await prisma.notification.create({
    data,
    include: {
      ticket:  { select: { ticketNo: true } },
      project: { select: { id: true, title: true } },
    },
  });
  pushToUser(data.userId, {
    id: notif.id,
    message: notif.message,
    read: false,
    createdAt: notif.createdAt.toISOString(),
    ticket: notif.ticket,
    project: notif.project,
  });
  return notif;
}

/** Notify every current member of a project, excluding any userIds passed in (e.g. the actor, or someone getting a more specific message instead). */
export async function notifyProjectMembers(
  projectId: string,
  message: string,
  excludeUserIds: string[] = []
) {
  const members = await prisma.projectMember.findMany({
    where: { projectId, userId: { notIn: excludeUserIds } },
    select: { userId: true },
  });
  await Promise.all(
    members.map((m) => createNotification({ userId: m.userId, projectId, message }))
  );
}
