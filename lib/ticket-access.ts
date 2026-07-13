type Viewer = { id: string; role: string; department?: string | null };
type TicketRef = {
  createdById: string;
  assignedToId: string | null;
  type: string;
  createdBy?: { department?: string | null } | null;
};

/**
 * Whether `viewer` may act on `ticket` (comment, attach a file, etc.) —
 * mirrors the same scoping already used to decide what each role sees in
 * their ticket list, so "can I see it" and "can I touch it" stay in sync.
 */
export function canActOnTicket(viewer: Viewer, ticket: TicketRef): boolean {
  switch (viewer.role) {
    case "ADMIN":
      return true;
    case "USER":
      return ticket.createdById === viewer.id;
    case "SUPPORT":
      return ticket.assignedToId === viewer.id;
    case "COMM_SUPPORT":
      return ticket.type === "INSTITUTIONAL_COMM" && ticket.assignedToId === viewer.id;
    case "COMM_ADMIN":
      return ticket.type === "INSTITUTIONAL_COMM";
    case "DEPT_MANAGER":
      return !!viewer.department && ticket.createdBy?.department === viewer.department;
    default:
      return false;
  }
}
