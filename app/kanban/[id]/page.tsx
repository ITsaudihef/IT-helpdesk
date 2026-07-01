import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { canViewProject, canManageProject } from "@/lib/project-access";

export default async function KanbanBoardPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, department: true } },
        members:   { include: { user: { select: { id: true, name: true } } } },
        columns: {
          orderBy: { order: "asc" },
          include: {
            cards: {
              orderBy: { order: "asc" },
              include: {
                assignee:  { select: { id: true, name: true } },
                createdBy: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!project) notFound();

  const viewer = { id: session!.user.id, role: (session!.user as any).role, department: (session!.user as any).department };
  if (!canViewProject(viewer, project)) notFound();

  const serialized = {
    ...project,
    startDate: project.startDate?.toISOString() ?? null,
    endDate:   project.endDate?.toISOString()   ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    members: project.members.map(m => ({ userId: m.userId, name: m.user.name })),
    columns: project.columns.map(col => ({
      ...col,
      cards: col.cards.map(card => ({
        ...card,
        dueDate:   card.dueDate?.toISOString()   ?? null,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      })),
    })),
  };

  return (
    <KanbanBoard
      project={serialized}
      users={users}
      currentUserId={session!.user.id}
      isAdmin={session!.user.role === "ADMIN"}
      canManageTeam={canManageProject(viewer, project)}
    />
  );
}
