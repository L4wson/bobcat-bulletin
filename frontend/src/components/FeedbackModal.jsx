import { X } from "lucide-react";
import { useEffect, useState } from "react";

const TYPES = [
  { id: "suggestion", label: "SUGGESTION",    hint: "Feature ideas or improvements." },
  { id: "question",   label: "QUESTION",      hint: "Ask anything about the data or the site." },
  { id: "removal",    label: "REMOVE INFO",   hint: "Request removal of a record. Include the report number." },
];

const CONTACT = "jacobslawson04@gmail.com";

export default function FeedbackModal({ onClose }) {
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handler(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    const selected = TYPES.find((t) => t.id === type);
    const subject = encodeURIComponent(`[Bobcat Bulletin] ${selected.label}`);
    const body    = encodeURIComponent(message.trim());
    window.open(`mailto:${CONTACT}?subject=${subject}&body=${body}`, "_blank");
    onClose();
  }

  const active = TYPES.find((t) => t.id === type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md bg-term-bg border border-term-border shadow-2xl"
        style={{ boxShadow: "0 0 40px rgba(255,153,0,0.15)" }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-term-border bg-term-card">
          <span
            className="text-term-bright glow-sm tracking-widest"
            style={{ fontFamily: "VT323, monospace", fontSize: "1.3rem" }}
          >
            // TRANSMIT MESSAGE
          </span>
          <button onClick={onClose} className="text-term-dim hover:text-term-bright transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          {/* Type selector */}
          <div>
            <div className="text-term-dim text-xs tracking-widest mb-2 prompt">MESSAGE TYPE</div>
            <div className="flex gap-2">
              {TYPES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={`flex-1 term-chip text-xs tracking-widest justify-center py-2
                              ${type === id ? "active" : ""}`}
                >
                  {type === id ? `[${label}]` : label}
                </button>
              ))}
            </div>
            <p className="text-term-dim text-xs mt-2 tracking-wide">{active.hint}</p>
          </div>

          {/* Message */}
          <div>
            <div className="text-term-dim text-xs tracking-widest mb-2 prompt">COMPOSE</div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "removal"
                  ? "REPORT NUMBER AND REASON FOR REMOVAL..."
                  : type === "question"
                  ? "ENTER YOUR QUESTION..."
                  : "DESCRIBE YOUR SUGGESTION..."
              }
              rows={5}
              required
              className="term-input w-full px-3 py-2 text-xs tracking-wide resize-none rounded-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="term-btn text-xs tracking-widest">
              [CANCEL]
            </button>
            <button
              type="submit"
              className="term-btn text-xs tracking-widest border-term-bright text-term-bright hover:bg-term-bright hover:text-term-bg"
            >
              [SEND TRANSMISSION]
            </button>
          </div>

          <div className="text-term-muted text-xs text-center tracking-widest">
            OPENS MAIL CLIENT → {CONTACT}
          </div>
        </form>
      </div>
    </div>
  );
}
