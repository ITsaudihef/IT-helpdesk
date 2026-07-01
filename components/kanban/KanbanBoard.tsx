"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowRight, Calendar, User, Clock, AlertCircle, CheckCircle2, Edit3, Users, X } from "lucide-react";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CardData {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  assigneeId?: string | null;
  assignee?: { id: string; name: string } | null;
  dueDate?: string | null;
  order: number;
  createdBy: { name: string };
}

interface ColumnData {
  id: string;
  title: string;
  order: number;
  cards: CardData[];
}

interface MemberData {
  userId: string;
  name: string;
}

interface ProjectData {
  id: string;
  title: string;
  description?: string | null;
  color: string;
  startDate?: string | null;
  endDate?: string | null;
  createdById: string;
  createdBy: { name: string };
  members: MemberData[];
  columns: ColumnData[];
}

interface Props {
  project: ProjectData;
  users: Array<{ id: string; name: string }>;
  currentUserId: string;
  isAdmin: boolean;
  canManageTeam: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRIORITY_META = {
  LOW:      { label: "منخفضة", color: "#16A34A", bg: "#D1FAE5", dot: "#16A34A" },
  MEDIUM:   { label: "متوسطة", color: "#2563EB", bg: "#DBEAFE", dot: "#2563EB" },
  HIGH:     { label: "عالية",  color: "#D97706", bg: "#FEF3C7", dot: "#D97706" },
  CRITICAL: { label: "حرجة",   color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
} as const;

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" });
}

function getProgressPct(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end   = new Date(endDate).getTime();
  const now   = Date.now();
  if (now <= start) return 0;
  if (now >= end)   return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function daysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function isCardOverdue(dueDate?: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function KanbanBoard({ project, users, currentUserId, isAdmin, canManageTeam }: Props) {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnData[]>(
    [...project.columns].sort((a, b) => a.order - b.order)
  );
  const [members, setMembers] = useState<MemberData[]>(project.members);
  const [showTeam, setShowTeam] = useState(false);
  const [addMemberId, setAddMemberId] = useState("");
  const [draggingCardId, setDraggingCardId]       = useState<string | null>(null);
  const [draggingFromColId, setDraggingFromColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId]         = useState<string | null>(null);
  const [addingCardCol, setAddingCardCol]         = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle]           = useState("");
  const [newCardPriority, setNewCardPriority]     = useState("MEDIUM");
  const [addingCol, setAddingCol]                 = useState(false);
  const [newColTitle, setNewColTitle]             = useState("");
  const [editCard, setEditCard]                   = useState<CardData | null>(null);
  const [editColId, setEditColId]                 = useState<string | null>(null);

  // ── Project dates editing ────────────────────────────────────────────────
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [editStart, setEditStart] = useState(project.startDate?.slice(0, 10) ?? "");
  const [editEnd,   setEditEnd]   = useState(project.endDate?.slice(0, 10)   ?? "");
  const [projectDates, setProjectDates] = useState({
    startDate: project.startDate ?? null,
    endDate:   project.endDate   ?? null,
  });

  const saveDates = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: editStart || null,
          endDate:   editEnd   || null,
        }),
      });
      if (!res.ok) throw new Error();
      setProjectDates({ startDate: editStart || null, endDate: editEnd || null });
      setShowDateEdit(false);
      toast.success("تم حفظ التواريخ");
    } catch {
      toast.error("فشل حفظ التواريخ");
    }
  };

  // ── Team members ─────────────────────────────────────────────────────────

  const handleAddMember = async () => {
    if (!addMemberId) return;
    const user = users.find(u => u.id === addMemberId);
    if (!user) return;
    setAddMemberId("");
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error();
      setMembers(prev => prev.some(m => m.userId === user.id) ? prev : [...prev, { userId: user.id, name: user.name }]);
      toast.success("تمت إضافة العضو");
    } catch {
      toast.error("فشل إضافة العضو");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setMembers(prev => prev.filter(m => m.userId !== userId));
    try {
      const res = await fetch(`/api/projects/${project.id}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("فشل إزالة العضو");
      router.refresh();
    }
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, cardId: string, colId: string) => {
    setDraggingCardId(cardId);
    setDraggingFromColId(colId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColId(colId);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggingCardId || targetColId === draggingFromColId) {
      setDraggingCardId(null); setDraggingFromColId(null);
      return;
    }
    const fromColId = draggingFromColId!;
    const cardId    = draggingCardId;
    let movedCard: CardData | undefined;

    setColumns(prev => {
      const next = prev.map(col => {
        if (col.id === fromColId) {
          movedCard = col.cards.find(c => c.id === cardId);
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        }
        return col;
      });
      return next.map(col =>
        col.id === targetColId && movedCard
          ? { ...col, cards: [...col.cards, { ...movedCard, order: col.cards.length }] }
          : col
      );
    });
    setDraggingCardId(null); setDraggingFromColId(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetColId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("فشل نقل البطاقة");
      router.refresh();
    }
  };

  // ── Add Card ─────────────────────────────────────────────────────────────

  const handleAddCard = async (colId: string) => {
    if (!newCardTitle.trim()) return;
    const title = newCardTitle.trim();
    const priority = newCardPriority;
    setNewCardTitle(""); setNewCardPriority("MEDIUM"); setAddingCardCol(null);

    const tempId = `temp-${Date.now()}`;
    setColumns(prev => prev.map(col =>
      col.id === colId
        ? { ...col, cards: [...col.cards, { id: tempId, title, priority, order: col.cards.length, createdBy: { name: "" } }] }
        : col
    ));

    try {
      const res = await fetch(`/api/projects/${project.id}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: colId, title, priority }),
      });
      if (!res.ok) throw new Error();
      const card: CardData = await res.json();
      setColumns(prev => prev.map(col =>
        col.id === colId
          ? { ...col, cards: col.cards.map(c => c.id === tempId ? card : c) }
          : col
      ));
    } catch {
      toast.error("فشل إنشاء البطاقة");
      setColumns(prev => prev.map(col => ({ ...col, cards: col.cards.filter(c => c.id !== tempId) })));
    }
  };

  // ── Add Column ───────────────────────────────────────────────────────────

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    const title = newColTitle.trim();
    setNewColTitle(""); setAddingCol(false);
    try {
      const res = await fetch(`/api/projects/${project.id}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const col: ColumnData = await res.json();
      setColumns(prev => [...prev, { ...col, cards: [] }]);
    } catch {
      toast.error("فشل إنشاء العمود");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteCard = async (cardId: string, colId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setColumns(prev => prev.map(col =>
      col.id === colId ? { ...col, cards: col.cards.filter(c => c.id !== cardId) } : col
    ));
    try {
      await fetch(`/api/projects/${project.id}/cards/${cardId}`, { method: "DELETE" });
    } catch {
      toast.error("فشل حذف البطاقة");
    }
  };

  const handleDeleteColumn = async (colId: string) => {
    if (!confirm("هل تريد حذف هذا العمود وجميع بطاقاته؟")) return;
    setColumns(prev => prev.filter(c => c.id !== colId));
    try {
      await fetch(`/api/projects/${project.id}/columns/${colId}`, { method: "DELETE" });
    } catch {
      toast.error("فشل حذف العمود");
      router.refresh();
    }
  };

  // ── Edit Card ────────────────────────────────────────────────────────────

  const handleSaveCard = async () => {
    if (!editCard || !editColId) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/cards/${editCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       editCard.title,
          description: editCard.description,
          priority:    editCard.priority,
          assigneeId:  editCard.assigneeId,
          dueDate:     editCard.dueDate,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: CardData = await res.json();
      setColumns(prev => prev.map(col =>
        col.id === editColId
          ? { ...col, cards: col.cards.map(c => c.id === updated.id ? updated : c) }
          : col
      ));
      toast.success("تم الحفظ");
      setEditCard(null); setEditColId(null);
    } catch {
      toast.error("فشل الحفظ");
    }
  };

  // ── Computed values ──────────────────────────────────────────────────────

  const totalCards = columns.reduce((s, c) => s + c.cards.length, 0);
  const pct        = getProgressPct(projectDates.startDate, projectDates.endDate);
  const daysLeft   = daysRemaining(projectDates.endDate);
  const isOverdue  = daysLeft !== null && daysLeft < 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Board header ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/kanban"
              className="p-2 rounded-xl flex-shrink-0 transition-all hover:bg-purple-50"
              style={{ color: "#7C3AED" }}
              title="العودة">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: project.color }} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight" style={{ color: "#1F1535" }}>
                {project.title}
              </h1>
              {project.description && (
                <p className="text-sm mt-0.5 truncate" style={{ color: "#7C6A9E" }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: stats + date edit */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-4 text-sm" style={{ color: "#7C6A9E" }}>
              <span>
                <strong style={{ color: "#1F1535" }}>{columns.length}</strong> أعمدة
              </span>
              <span>
                <strong style={{ color: "#1F1535" }}>{totalCards}</strong> بطاقة
              </span>
            </div>
            <button
              onClick={() => setShowTeam(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-purple-50"
              style={{ color: "#7C3AED", border: "1px solid #E9E3FF" }}>
              <Users className="w-3.5 h-3.5" />
              الفريق ({members.length})
            </button>
            <button
              onClick={() => { setShowDateEdit(true); setEditStart(projectDates.startDate?.slice(0,10) ?? ""); setEditEnd(projectDates.endDate?.slice(0,10) ?? ""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-purple-50"
              style={{ color: "#7C3AED", border: "1px solid #E9E3FF" }}>
              <Edit3 className="w-3.5 h-3.5" />
              تعديل التواريخ
            </button>
          </div>
        </div>

        {/* Date range row */}
        {(projectDates.startDate || projectDates.endDate) && (
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-5">
                {projectDates.startDate && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "#7C6A9E" }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />
                    <span>بدء المشروع: <strong style={{ color: "#1F1535" }}>{formatDate(projectDates.startDate)}</strong></span>
                  </div>
                )}
                {projectDates.endDate && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: isOverdue ? "#DC2626" : "#7C6A9E" }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: isOverdue ? "#DC2626" : "#7C3AED" }} />
                    <span>
                      {isOverdue
                        ? <><strong style={{ color: "#DC2626" }}>متأخر {Math.abs(daysLeft!)} يوم</strong> (انتهى {formatDate(projectDates.endDate)})</>
                        : <>انتهاء المشروع: <strong style={{ color: "#1F1535" }}>{formatDate(projectDates.endDate)}</strong>{daysLeft !== null && <span style={{ color: "#7C6A9E" }}> ({daysLeft} يوم متبقٍ)</span>}</>
                      }
                    </span>
                  </div>
                )}
              </div>
              {projectDates.startDate && projectDates.endDate && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: isOverdue ? "#FEF2F2" : "#EDE9FE",
                    color:      isOverdue ? "#DC2626" : "#7C3AED",
                  }}>
                  {pct}% مكتمل
                </span>
              )}
            </div>
            {projectDates.startDate && projectDates.endDate && (
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F3EEFF" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: isOverdue
                      ? "linear-gradient(90deg,#DC2626,#EF4444)"
                      : `linear-gradient(90deg,${project.color},${project.color}AA)`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* If no dates set yet */}
        {!projectDates.startDate && !projectDates.endDate && (
          <button
            onClick={() => setShowDateEdit(true)}
            className="flex items-center gap-2 text-sm transition-all hover:opacity-80"
            style={{ color: "#9CA3AF" }}>
            <Calendar className="w-4 h-4" />
            أضف تواريخ البدء والانتهاء للمشروع
          </button>
        )}
      </div>

      {/* ── Columns container ─────────────────────────────────────────────── */}
      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: "62vh" }}>
        {columns.map(col => {
          const isOver = dragOverColId === col.id;
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col rounded-2xl transition-all"
              style={{
                background: isOver ? "#EDE9FE" : "#F7F5FF",
                border: `2px solid ${isOver ? "#7C3AED" : "#E9E3FF"}`,
                boxShadow: isOver ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
              }}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: project.color }} />
                  <span className="font-bold text-sm" style={{ color: "#1F1535" }}>{col.title}</span>
                  <span
                    className="text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: "#E9E3FF", color: "#7C3AED" }}>
                    {col.cards.length}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteColumn(col.id)}
                  className="p-1 rounded-lg transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100 hover:bg-red-50"
                  title="حذف العمود"
                  style={{ opacity: 0.4 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}>
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto">
                {col.cards.map(card => {
                  const pm = PRIORITY_META[card.priority as keyof typeof PRIORITY_META] ?? PRIORITY_META.MEDIUM;
                  const overdue = isCardOverdue(card.dueDate);
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={e => handleDragStart(e, card.id, col.id)}
                      onDragEnd={() => { setDraggingCardId(null); setDraggingFromColId(null); setDragOverColId(null); }}
                      onClick={() => { setEditCard(card); setEditColId(col.id); }}
                      className="bg-white rounded-xl p-3.5 group/card transition-all hover:shadow-md"
                      style={{
                        border:  overdue ? "1px solid #FCA5A5" : "1px solid #E9E3FF",
                        opacity: draggingCardId === card.id ? 0.4 : 1,
                        cursor:  draggingCardId === card.id ? "grabbing" : "grab",
                      }}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold flex-1 leading-snug" style={{ color: "#1F1535" }}>
                          {card.title}
                        </p>
                        <button
                          onClick={e => handleDeleteCard(card.id, col.id, e)}
                          className="p-0.5 rounded flex-shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-50">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>

                      {/* Description */}
                      {card.description && (
                        <p className="text-xs mb-2.5 leading-relaxed line-clamp-2" style={{ color: "#9CA3AF" }}>
                          {card.description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Priority */}
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: pm.bg, color: pm.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: pm.dot }} />
                          {pm.label}
                        </span>

                        {/* Assignee */}
                        {card.assignee && (
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "#F3F4F6", color: "#374151" }}>
                            <User className="w-2.5 h-2.5" />
                            {card.assignee.name}
                          </span>
                        )}

                        {/* Due date */}
                        {card.dueDate && (
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: overdue ? "#FEF2F2" : "#F3F4F6",
                              color:      overdue ? "#DC2626"  : "#374151",
                            }}>
                            {overdue ? <AlertCircle className="w-2.5 h-2.5" /> : <Calendar className="w-2.5 h-2.5" />}
                            {new Date(card.dueDate).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add card */}
                {addingCardCol === col.id ? (
                  <div className="bg-white rounded-xl p-3 shadow-sm"
                    style={{ border: "2px solid #7C3AED" }}>
                    <textarea
                      className="w-full text-sm resize-none focus:outline-none leading-relaxed"
                      style={{ color: "#1F1535" }}
                      placeholder="عنوان البطاقة..."
                      rows={2}
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCard(col.id); }
                        if (e.key === "Escape") { setAddingCardCol(null); setNewCardTitle(""); }
                      }}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mt-2.5">
                      <select
                        value={newCardPriority}
                        onChange={e => setNewCardPriority(e.target.value)}
                        className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                        style={{ background: "#F3EEFF", color: "#7C3AED", border: "1px solid #E9E3FF" }}>
                        <option value="LOW">منخفضة</option>
                        <option value="MEDIUM">متوسطة</option>
                        <option value="HIGH">عالية</option>
                        <option value="CRITICAL">حرجة</option>
                      </select>
                      <button
                        onClick={() => handleAddCard(col.id)}
                        className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold"
                        style={{ background: "#7C3AED" }}>
                        إضافة
                      </button>
                      <button
                        onClick={() => { setAddingCardCol(null); setNewCardTitle(""); }}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: "#7C6A9E", border: "1px solid #E9E3FF" }}>
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingCardCol(col.id); setNewCardTitle(""); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-purple-100"
                    style={{ color: "#9CA3AF" }}>
                    <Plus className="w-4 h-4" />
                    إضافة بطاقة
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add column */}
        <div className="flex-shrink-0 w-72">
          {addingCol ? (
            <div className="rounded-2xl p-4" style={{ background: "#F7F5FF", border: "2px solid #7C3AED" }}>
              <input
                className="w-full text-sm px-3 py-2.5 rounded-xl mb-3 focus:outline-none"
                style={{ background: "white", border: "1px solid #E9E3FF", color: "#1F1535" }}
                placeholder="اسم العمود..."
                value={newColTitle}
                onChange={e => setNewColTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter")  handleAddColumn();
                  if (e.key === "Escape") { setAddingCol(false); setNewColTitle(""); }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleAddColumn}
                  className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold"
                  style={{ background: "#7C3AED" }}>إضافة</button>
                <button onClick={() => { setAddingCol(false); setNewColTitle(""); }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: "#7C6A9E", border: "1px solid #E9E3FF" }}>إلغاء</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="w-full flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all hover:bg-purple-100 hover:border-purple-300"
              style={{ background: "#F7F5FF", border: "2px dashed #C4B5FD", color: "#7C3AED" }}>
              <Plus className="w-4 h-4" />
              إضافة عمود جديد
            </button>
          )}
        </div>
      </div>

      {/* ── Edit Dates Modal ───────────────────────────────────────────────── */}
      {showDateEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          dir="rtl"
          onClick={e => { if (e.target === e.currentTarget) setShowDateEdit(false); }}>
          <div className="dark-modal rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.2)" }}>
                <Calendar className="w-4 h-4" style={{ color: "#A78BFA" }} />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">تواريخ المشروع</h2>
                <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>حدد الجدول الزمني للمشروع</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>
                  تاريخ البدء
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)", colorScheme: "dark" }}
                  value={editStart}
                  onChange={e => setEditStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)", colorScheme: "dark" }}
                  value={editEnd}
                  min={editStart || undefined}
                  onChange={e => setEditEnd(e.target.value)}
                />
              </div>
              {editStart && editEnd && (
                <div className="rounded-xl p-3" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <p className="text-xs" style={{ color: "#C4B5FD" }}>
                    مدة المشروع:{" "}
                    <strong className="text-white">
                      {Math.ceil((new Date(editEnd).getTime() - new Date(editStart).getTime()) / 86400000)} يوم
                    </strong>
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={saveDates}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  حفظ التواريخ
                </button>
                <button
                  onClick={() => setShowDateEdit(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#A78BFA" }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Team Modal ─────────────────────────────────────────────────────── */}
      {showTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          dir="rtl"
          onClick={e => { if (e.target === e.currentTarget) setShowTeam(false); }}>
          <div className="dark-modal rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.2)" }}>
                  <Users className="w-4 h-4" style={{ color: "#A78BFA" }} />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">فريق المشروع</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>يرى المشروع فقط الأدمن ومدير القسم وأعضاء الفريق</p>
                </div>
              </div>
              <button onClick={() => setShowTeam(false)} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" style={{ color: "#A78BFA" }} />
              </button>
            </div>

            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {members.map(m => (
                <div key={m.userId} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <span className="text-sm text-white">
                    {m.name}
                    {m.userId === currentUserId && <span className="text-xs" style={{ color: "#7C6A9E" }}> (أنت)</span>}
                  </span>
                  {canManageTeam && m.userId !== project.createdById && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1 rounded hover:bg-red-500/10">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: "#7C6A9E" }}>لا يوجد أعضاء بعد</p>
              )}
            </div>

            {canManageTeam && (
              <div className="flex gap-2">
                <select
                  value={addMemberId}
                  onChange={e => setAddMemberId(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <option value="">اختر عضواً لإضافته...</option>
                  {users.filter(u => !members.some(m => m.userId === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!addMemberId}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  إضافة
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Card Modal ────────────────────────────────────────────────── */}
      {editCard && editColId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          dir="rtl"
          onClick={e => { if (e.target === e.currentTarget) { setEditCard(null); setEditColId(null); } }}>
          <div className="dark-modal rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.3)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.2)" }}>
                <Edit3 className="w-4 h-4" style={{ color: "#A78BFA" }} />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">تفاصيل البطاقة</h2>
                <p className="text-xs mt-0.5" style={{ color: "#7C6A9E" }}>تعديل بيانات المهمة</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>العنوان</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)" }}
                  value={editCard.title}
                  onChange={e => setEditCard(c => c ? { ...c, title: e.target.value } : c)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>الوصف</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)" }}
                  rows={3}
                  placeholder="أضف وصفاً للمهمة..."
                  value={editCard.description ?? ""}
                  onChange={e => setEditCard(c => c ? { ...c, description: e.target.value } : c)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>الأولوية</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(124,58,237,0.3)" }}
                    value={editCard.priority}
                    onChange={e => setEditCard(c => c ? { ...c, priority: e.target.value } : c)}>
                    <option value="LOW">منخفضة</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="HIGH">عالية</option>
                    <option value="CRITICAL">حرجة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>الاستحقاق</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(124,58,237,0.3)", colorScheme: "dark" }}
                    value={editCard.dueDate ? editCard.dueDate.slice(0, 10) : ""}
                    onChange={e => setEditCard(c => c ? { ...c, dueDate: e.target.value || null } : c)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#A78BFA" }}>المسؤول</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(124,58,237,0.3)" }}
                  value={editCard.assigneeId ?? ""}
                  onChange={e => setEditCard(c => c ? { ...c, assigneeId: e.target.value || null } : c)}>
                  <option value="">بدون مسؤول</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveCard}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  حفظ التغييرات
                </button>
                <button
                  onClick={() => { setEditCard(null); setEditColId(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#A78BFA" }}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
