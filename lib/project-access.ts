import { Prisma } from "@prisma/client";

type Viewer = {
  id: string;
  role: string;
  department?: string | null;
};

/**
 * Prisma `where` fragment restricting a project list query to what `viewer` may see:
 * admins see everything; dept managers see their own department's projects;
 * everyone else sees only projects they created or were added to as a team member.
 */
export function projectVisibilityWhere(viewer: Viewer): Prisma.ProjectWhereInput {
  if (viewer.role === "ADMIN") return {};

  const or: Prisma.ProjectWhereInput[] = [
    { createdById: viewer.id },
    { members: { some: { userId: viewer.id } } },
  ];

  if (viewer.role === "DEPT_MANAGER" && viewer.department) {
    or.push({ createdBy: { department: viewer.department } });
  }

  return { OR: or };
}

/**
 * Whether `viewer` may view a single already-fetched project.
 * `project` must include `createdBy.department` and `members` (list of { userId }).
 */
export function canViewProject(
  viewer: Viewer,
  project: { createdById: string; createdBy: { department?: string | null }; members: { userId: string }[] }
): boolean {
  if (viewer.role === "ADMIN") return true;
  if (project.createdById === viewer.id) return true;
  if (project.members.some(m => m.userId === viewer.id)) return true;
  if (viewer.role === "DEPT_MANAGER" && viewer.department && viewer.department === project.createdBy.department) return true;
  return false;
}

/** Whether `viewer` may manage (add/remove) team members and edit/delete the project. */
export function canManageProject(viewer: Viewer, project: { createdById: string }): boolean {
  return viewer.role === "ADMIN" || project.createdById === viewer.id;
}
