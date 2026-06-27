"use client";

import { useState, useRef } from "react";
import { Paperclip, FileText, Download, Upload, X, FileImage, File } from "lucide-react";
import toast from "react-hot-toast";

interface Attachment { id: string; fileName: string; fileUrl: string; uploadedAt: string; }

interface Props {
  ticketId:    string;
  attachments: Attachment[];
  canUpload:   boolean;
}

const ALLOWED = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx";

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg","jpeg","png","gif","webp"].includes(ext || "")) return <FileImage className="w-4 h-4" />;
  if (ext === "pdf") return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

function formatSize(url: string) { return ""; }

export default function TicketAttachments({ ticketId, attachments: initial, canUpload }: Props) {
  const [list,    setList]    = useState<Attachment[]>(initial);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const valid: File[] = [];
    Array.from(fl).forEach(f => {
      if (f.size > 2 * 1024 * 1024) { toast.error(`${f.name}: الحجم أكبر من 2MB`); return; }
      valid.push(f);
    });
    setPending(p => [...p, ...valid]);
  };

  const upload = async () => {
    if (!pending.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      pending.forEach(f => fd.append("files", f));
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const created: Attachment[] = await res.json();
      setList(l => [...l, ...created]);
      setPending([]);
      toast.success("تم رفع المرفقات بنجاح");
    } catch (e: any) {
      toast.error(e.message || "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl p-5 shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="w-4 h-4" style={{ color: "#7C3AED" }} />
        <h3 className="font-bold text-sm" style={{ color: "#1F1535" }}>
          المرفقات {list.length > 0 && <span className="text-purple-500 font-normal">({list.length})</span>}
        </h3>
      </div>

      {/* Existing attachments */}
      {list.length === 0 && !canUpload && (
        <p className="text-sm text-purple-500 text-center py-4">لا توجد مرفقات</p>
      )}
      {list.length > 0 && (
        <ul className="space-y-2 mb-4">
          {list.map(a => (
            <li key={a.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-purple-100 bg-white/5 hover:bg-purple-900/20 transition-colors">
              <span style={{ color: "#7C3AED" }}>{fileIcon(a.fileName)}</span>
              <span className="flex-1 text-sm text-purple-200 truncate">{a.fileName}</span>
              <a href={a.fileUrl} target="_blank" rel="noreferrer" download={a.fileName}
                className="p-1.5 rounded-lg hover:bg-purple-900 transition-colors"
                style={{ color: "#5B21B6" }}>
                <Download className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Upload section */}
      {canUpload && (
        <div className="space-y-3">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors hover:bg-purple-900/20"
            style={{ borderColor: "#7C3AED" }}>
            <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: "#7C3AED" }} />
            <p className="text-xs text-gray-500">اسحب ملفات أو اضغط للاختيار</p>
            <p className="text-xs text-purple-500 mt-1">الحد الأقصى للملف: 2MB</p>
            <input ref={fileRef} type="file" multiple className="hidden" accept={ALLOWED}
              onChange={e => addFiles(e.target.files)} />
          </div>

          {/* Pending list */}
          {pending.length > 0 && (
            <ul className="space-y-1">
              {pending.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-amber-700 bg-yellow-50 rounded-lg px-3 py-2">
                  <FileText className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button onClick={() => setPending(p => p.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pending.length > 0 && (
            <button onClick={upload} disabled={uploading}
              className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: uploading ? "#9dd274" : "#7C3AED" }}>
              {uploading ? "جارٍ الرفع..." : `رفع ${pending.length} ملف`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
