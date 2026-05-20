import { X, Lightbulb, HelpCircle, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";

const TYPES = [
  { id: "suggestion", label: "Suggestion", icon: Lightbulb, hint: "Feature ideas, design improvements, anything you'd like to see." },
  { id: "question",   label: "Question",   icon: HelpCircle, hint: "Ask anything about the data or how the site works." },
  { id: "removal",    label: "Remove info", icon: ShieldOff,  hint: "Request removal of a specific incident. Include the report number if you have it." },
];

const CONTACT = "jacobslawson04@gmail.com";

export default function FeedbackModal({ onClose }) {
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    const selected = TYPES.find((t) => t.id === type);
    const subject = encodeURIComponent(`[Bobcat Bulletin] ${selected.label}`);
    const body = encodeURIComponent(message.trim());
    window.open(`mailto:${CONTACT}?subject=${subject}&body=${body}`, "_blank");
    onClose();
  }

  const active = TYPES.find((t) => t.id === type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-surface-800 border border-surface-500 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-600">
          <div>
            <h2 className="text-base font-bold text-slate-100">Get in touch</h2>
            <p className="text-xs text-slate-500 mt-0.5">Suggestions, questions, or data removal requests</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-surface-600"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Type picker */}
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border text-xs font-medium
                            transition-colors cursor-pointer
                            ${type === id
                              ? "border-ucgold text-ucgold bg-ucgold/10"
                              : "border-surface-500 text-slate-400 hover:border-slate-500 hover:text-slate-200 bg-surface-700"
                            }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Hint */}
          <p className="text-xs text-slate-500 leading-relaxed">{active.hint}</p>

          {/* Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === "removal"
                ? "Report number and reason for removal…"
                : type === "question"
                ? "What would you like to know?"
                : "What would you like to see added or changed?"
            }
            rows={4}
            required
            className="w-full bg-surface-700 border border-surface-500 rounded-lg px-3 py-2.5 text-sm
                       text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400
                       resize-none transition-colors"
          />

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-surface-700 border border-surface-500 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-ucblue border border-ucblue text-white hover:bg-ucblue/80"
            >
              Open email
            </button>
          </div>

          <p className="text-xs text-slate-600 text-center">
            Opens your mail client to send to {CONTACT}
          </p>
        </form>
      </div>
    </div>
  );
}
