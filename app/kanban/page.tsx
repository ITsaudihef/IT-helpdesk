import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/kanban/ProjectsClient";

export default async function KanbanPage() {
  const session = await auth();

  const projects = await prisma.project.findMany({
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
