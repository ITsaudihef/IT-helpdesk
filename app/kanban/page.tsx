import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/kanban/ProjectsClient";
import { projectVisibilityWhere } from "@/lib/project-access";

export default async function KanbanPage() {
  const session = await auth();
  const { id, role } = session!.user as any;
  const department = (session!.user as any).department;

  const projects = await prisma.project.findMany({
    where: projectVisibilityWhere({ id, role, department }),
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      columns: {
        select: { _count: { select: { cards: true } } },
      },
      _count: { select: { columns: true } },
    },
  });

  const list = projects.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    color: p.color,
    startDate: p.startDate?.toISOString() ?? null,
    endDate:   p.endDate?.toISOString()   ?? null,
    createdBy: p.createdBy,
    createdAt: p.createdAt.toISOString(),
    columnCount: p._count.columns,
    cardCount: p.columns.reduce((s, c) => s + c._count.cards, 0),
  }));

  return (
    <ProjectsClient
      projects={list}
      currentUserId={session!.user.id}
      isAdmin={session!.user.role === "ADMIN"}
    />
  );
}
