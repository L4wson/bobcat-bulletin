import { X, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { submitFeedback } from "../lib/api.js";

const TYPES = [
  { value: "suggestion", label: "Suggestion" },
  { value: "bug", label: "Bug report" },
  { value: "question", label: "Question" },
  { value: "removal", label: "Request removal" },
];

export default function FeedbackModal({ onClose }) {
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("loading");
    try {
      await submitFeedback({ type, message: message.trim(), contact: contact.trim() });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-surface-800 border border-surface-500 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-600">
          <div>
            <h2 className="text-base font-bold text-slate-100">Send feedback</h2>
            <p className="text-xs text-slate-500 mt-0.5">Suggestions, questions, or removal requests</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded hover:bg-surface-600"
          >
            <X size={16} />
          </button>
        </div>

        {status === "success" ? (
          <div className="px-5 py-10 text-center">
            <div className="text-3xl mb-3">✓</div>
            <p className="text-slate-100 font-semibold mb-1">Thanks for your feedback</p>
            <p className="text-xs text-slate-400">We'll review it shortly.</p>
            <button
              onClick={onClose}
              className="mt-6 btn bg-surface-600 border border-surface-500 text-slate-300 hover:text-slate-100 text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-5 py-4 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-surface-700 border border-surface-500 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-ucgold"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder={
                    type === "removal"
                      ? "Describe the record you'd like removed and why…"
                      : "What's on your mind?"
                  }
                  rows={5}
                  className="w-full bg-surface-700 border border-surface-500 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-ucgold resize-none placeholder:text-slate-600"
                />
                <p className="text-right text-xs text-slate-600 mt-0.5">{message.length}/2000</p>
              </div>

              {/* Contact (optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Contact email <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-surface-700 border border-surface-500 text-slate-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-ucgold placeholder:text-slate-600"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-400">Something went wrong — please try again.</p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-surface-600 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn bg-surface-600 border border-surface-500 text-slate-300 hover:text-slate-100 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!message.trim() || status === "loading"}
                className="btn bg-ucgold/20 border border-ucgold/40 text-ucgold hover:bg-ucgold/30 text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={13} />
                {status === "loading" ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
