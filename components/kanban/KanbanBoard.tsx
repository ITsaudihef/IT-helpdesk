"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowRight, Calendar, User } from "lucide-react";
import toast from "react-hot-toast";

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

interface ProjectData {
  id: string;
  title: string;
  description?: string | null;
  color: string;
  createdBy: { name: string };
  columns: ColumnData[];
}

interface Props {
  project: ProjectData;
  users: Array<{ id: string; name: string }>;
  currentUserId: string;
  isAdmin: boolean;
}

const PRIORITY_META = {
  LOW:      { label: "منخفضة", color: "#16A34A", bg: "#D1FAE5" },
  MEDIUM:   { label: "متوسطة", color: "#2563EB", bg: "#DBEAFE" },
  HIGH:     { label: "عالية",  color: "#D97706", bg: "#FEF3C7" },
  CRITICAL: { label: "حرجة",   color: "#DC2626", bg: "#FEF2F2" },
} as const;

export default function KanbanBoard({ project, users, currentUserId, isAdmin }: Props) {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnData[]>(
    [...project.columns].sort((a, b) => a.order - b.order)
  );
  const [draggingCardId, setDraggingCardId]     = useState<string | null>(null);
  const [draggingFromColId, setDraggingFromColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId]       = useState<string | null>(null);
  const [addingCardCol, setAddingCardCol]       = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle]         = useState("");
  const [newCardPriority, setNewCardPriority]   = useState("MEDIUM");
  const [addingCol, setAddingCol]               = useState(false);
  const [newColTitle, setNewColTitle]           = useState("");

  // Card detail modal
  const [editCard, setEditCard]   = useState<CardData | null>(null);
  const [editColId, setEditColId] = useState<string | null>(null);

  // ── Drag and Drop ──────────────────────────────────────────────────────────

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

  const handleDragLeave = () => setDragOverColId(null);

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggingCardId) return;
    if (targetColId === draggingFromColId) {
      setDraggingCardId(null); setDraggingFromColId(null);
      return;
    }

    const fromColId = draggingFromColId!;
    const cardId    = draggingCardId;

    // Optimistic move
    let movedCard: CardData | undefined;
    setColumns(prev => {
      const next = prev.map(col => {
        if (col.id === fromColId) {
          movedCard = col.cards.find(c => c.id === cardId);
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        }
        return col;
      });
      return next.map(col => {
        if (col.id === targetColId && movedCard) {
          return { ...col, cards: [...col.cards, { ...movedCard, order: col.cards.length }] };
        }
        return col;
      });
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

  const handleDragEnd = () => {
    setDraggingCardId(null); setDraggingFromColId(null); setDragOverColId(null);
  };

  // ── Add Card ───────────────────────────────────────────────────────────────

  const handleAddCard = async (colId: string) => {
    if (!newCardTitle.trim()) return;
    const title    = newCardTitle.trim();
    const priority = newCardPriority;
    setNewCardTitle(""); setNewCardPriority("MEDIUM"); setAddingCardCol(null);

    const tempId = `temp-${Date.now()}`;
    setColumns(prev => prev.map(col => col.id === colId
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
      setColumns(prev => prev.map(col => col.id === colId
        ? { ...col, cards: col.cards.map(c => c.id === tempId ? card : c) }
        : col
      ));
    } catch {
      toast.error("فشل إنشاء البطاقة");
      setColumns(prev => prev.map(col => ({ ...col, cards: col.cards.filter(c => c.id !== tempId) })));
    }
  };

  // ── Add Column ────────────────────────────────────────────────────────────

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

  // ── Delete ─────────────────────────────────────────────────────────────────

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

  // ── Edit Card ──────────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalCards = columns.reduce((s, c) => s + c.cards.length, 0);

  return (
    <div>
      {/* Board header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/kanban" className="p-2 rounded-xl hover:bg-purple-100 transition-colors"
            style={{ color: "#7C3AED" }} title="العودة للمشاريع">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: project.color }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1F1535" }}>{project.title}</h1>
            {project.description && (
              <p className="text-sm" style={{ color: "#7C6A9E" }}>{project.description}</p>
            )}
          </div>
        </div>
        <span className="text-sm" style={{ color: "#7C6A9E" }}>
          {columns.length} أعمدة · {totalCards} بطاقة
        </span>
      </div>

      {/* Columns container */}
      <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: "65vh" }}>
        {columns.map(col => {
          const isOver = dragOverColId === col.id;
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col rounded-2xl transition-all"
              style={{
                background:  isOver ? "rgba(124,58,237,0.06)" : "#F0EBF8",
                border:      `2px solid ${isOver ? "#7C3AED" : "#E9E3FF"}`,
                boxShadow:   isOver ? "0 0 0 3px rgba(124,58,237,0.15)" : "none",
              }}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: project.color }} />
                  <span className="font-semibold text-sm" style={{ color: "#1F1535" }}>{col.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "#E9E3FF", color: "#7C3AED" }}>
                    {col.cards.length}
                  </span>
                </div>
                <button onClick={() => handleDeleteColumn(col.id)}
                  className="p-1 rounded-lg transition-colors hover:bg-red-50" title="حذف العمود">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto">
                {col.cards.map(card => {
                  const pm = PRIORITY_META[card.priority as keyof typeof PRIORITY_META] ?? PRIORITY_META.MEDIUM;
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={e => handleDragStart(e, card.id, col.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => { setEditCard(card); setEditColId(col.id); }}
                      className="bg-white rounded-xl p-3 cursor-pointer transition-all hover:shadow-md"
                      style={{
                        border:   "1px solid #E9E3FF",
                        opacity:  draggingCardId === card.id ? 0.45 : 1,
                        cursor:   draggingCardId === card.id ? "grabbing" : "grab",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium flex-1 leading-snug" style={{ color: "#1F1535" }}>
                          {card.title}
                        </p>
                        <button
                          onClick={e => handleDeleteCard(card.id, col.id, e)}
                          className="p-0.5 rounded flex-shrink-0 hover:bg-red-50">
                          <Trash2 className="w-3 h-3 text-red-300 hover:text-red-500" />
                        </button>
                      </div>

                      {card.description && (
                        <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "#7C6A9E" }}>
                          {card.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: pm.bg, color: pm.color }}>
                          {pm.label}
                        </span>
                        {card.assignee && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#7C6A9E" }}>
                            <User className="w-3 h-3" />{card.assignee.name}
                          </span>
                        )}
                        {card.dueDate && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#7C6A9E" }}>
                            <Calendar className="w-3 h-3" />
                            {new Date(card.dueDate).toLocaleDateString("ar-SA")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add card inline */}
                {addingCardCol === col.id ? (
                  <div className="bg-white rounded-xl p-3" style={{ border: "1px solid #7C3AED" }}>
                    <textarea
                      className="w-full text-sm resize-none focus:outline-none"
                      style={{ color: "#1F1535" }}
                      placeholder="عنوان البطاقة..."
                      rows={2}
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddCard(col.id); }
                        if (e.key === "Escape")               { setAddingCardCol(null); setNewCardTitle(""); }
                      }}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mt-2">
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
                      <button onClick={() => handleAddCard(col.id)}
                        className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold"
                        style={{ background: "#7C3AED" }}>
                        إضافة
                      </button>
                      <button onClick={() => { setAddingCardCol(null); setNewCardTitle(""); }}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ color: "#7C6A9E", border: "1px solid #E9E3FF" }}>
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingCardCol(col.id); setNewCardTitle(""); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all hover:bg-purple-50"
                    style={{ color: "#7C3AED" }}>
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
            <div className="rounded-2xl p-4" style={{ background: "#F0EBF8", border: "2px solid #7C3AED" }}>
              <input
                className="w-full text-sm px-3 py-2 rounded-lg mb-3 focus:outline-none"
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
                  style={{ background: "#7C3AED" }}>
                  إضافة
                </button>
                <button onClick={() => { setAddingCol(false); setNewColTitle(""); }}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ color: "#7C6A9E", border: "1px solid #E9E3FF" }}>
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all hover:bg-purple-100"
              style={{ background: "#F0EBF8", border: "2px dashed #C4B5FD", color: "#7C3AED" }}>
              <Plus className="w-4 h-4" />
              إضافة عمود
            </button>
          )}
        </div>
      </div>

      {/* Edit Card Modal */}
      {editCard && editColId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" dir="rtl"
          onClick={e => { if (e.target === e.currentTarget) { setEditCard(null); setEditColId(null); } }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ background: "#100835", border: "1px solid rgba(124,58,237,0.25)" }}>
            <h2 className="font-bold text-white mb-5">تفاصيل البطاقة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A78BFA" }}>العنوان</label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.3)" }}
                  value={editCard.title}
                  onChange={e => setEditCard(c => c ? { ...c, title: e.target.value } : c)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A78BFA" }}>الوصف</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,58,237,0.3)" }}
                  rows={3}
                  value={editCard.description ?? ""}
                  onChange={e => setEditCard(c => c ? { ...c, description: e.target.value } : c)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#A78BFA" }}>الأولوية</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
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
                  <label className="block text-xs font-medium mb-1" style={{ color: "#A78BFA" }}>تاريخ الاستحقاق</label>
                  <input type="date"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(124,58,237,0.3)" }}
                    value={editCard.dueDate ? editCard.dueDate.slice(0, 10) : ""}
                    onChange={e => setEditCard(c => c ? { ...c, dueDate: e.target.value || null } : c)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#A78BFA" }}>المسؤول</label>
                <select
                  className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(124,58,237,0.3)" }}
                  value={editCard.assigneeId ?? ""}
                  onChange={e => setEditCard(c => c ? { ...c, assigneeId: e.target.value || null } : c)}>
                  <option value="">بدون مسؤول</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveCard}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
                  حفظ
                </button>
                <button onClick={() => { setEditCard(null); setEditColId(null); }}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A78BFA" }}>
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
