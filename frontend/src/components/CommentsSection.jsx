import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, ShieldAlert } from "lucide-react";
import { getComments, submitComment } from "../lib/api.js";

const MIN_LEN = 10;
const MAX_LEN = 1000;

function formatSubmitted(iso) {
  if (!iso) return "";
  return new Date(iso + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommentsSection({ caseNumber }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitted, setSubmitted] = useState(null); // null | "approved" | "flagged"

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", caseNumber],
    queryFn: () => getComments(caseNumber),
  });

  const mutation = useMutation({
    mutationFn: () => submitComment(caseNumber, { body: body.trim(), website }),
    onSuccess: (res) => {
      setBody("");
      setSubmitted(res.status);
      qc.invalidateQueries({ queryKey: ["comments", caseNumber] });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (body.trim().length < MIN_LEN || mutation.isPending) return;
    mutation.mutate();
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
        <MessageSquare size={15} className="text-slate-500" />
        Community information
        {comments.length > 0 && (
          <span className="text-slate-500 font-normal">({comments.length})</span>
        )}
      </h2>

      {/* Approved comments */}
      {!isLoading && comments.length === 0 && (
        <p className="text-xs text-slate-500 mb-4">
          No community information yet. Know something about this incident? Share it below.
        </p>
      )}

      {comments.length > 0 && (
        <ul className="space-y-3 mb-4">
          {comments.map((c) => (
            <li key={c.id} className="card p-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {c.body}
              </p>
              <p className="text-xs text-slate-600 font-mono mt-2">
                Anonymous · {formatSubmitted(c.submitted_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Submission form */}
      {submitted ? (
        <div className="card p-4 text-center">
          {submitted === "approved" ? (
            <p className="text-sm text-slate-200 font-semibold mb-1">Posted — thanks for sharing</p>
          ) : (
            <>
              <p className="text-sm text-slate-200 font-semibold mb-1">Held for review</p>
              <p className="text-xs text-slate-500">
                Your comment may mention a person or contact info, so a moderator will
                review it before it appears.
              </p>
            </>
          )}
          <button
            onClick={() => setSubmitted(null)}
            className="mt-3 text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Add another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <p className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-slate-600" />
            <span>
              Anonymous — posts immediately. Don't include names or other identifying
              details about individuals; comments that appear to are held for moderator
              review. Community-submitted information is not verified. If you witnessed
              a crime, contact UCPD at (209) 228-2677.
            </span>
          </p>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
            placeholder="Share what you know about this incident…"
            rows={3}
            className="w-full bg-surface-700 border border-surface-500 text-slate-100 text-sm rounded-lg
                       px-3 py-2 focus:outline-none focus:border-ucgold resize-none placeholder:text-slate-600"
          />

          {/* Honeypot — hidden from real users, bots fill it in */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600 font-mono">
              {body.trim().length < MIN_LEN
                ? `At least ${MIN_LEN} characters`
                : `${body.length}/${MAX_LEN}`}
            </span>
            <button
              type="submit"
              disabled={body.trim().length < MIN_LEN || mutation.isPending}
              className="btn bg-ucgold/20 border border-ucgold/40 text-ucgold hover:bg-ucgold/30 text-sm
                         flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={13} />
              {mutation.isPending ? "Submitting…" : "Submit anonymously"}
            </button>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-400">
              {mutation.error?.message?.startsWith("HTTP 429")
                ? "You're submitting too quickly — try again later."
                : mutation.error?.message || "Something went wrong — please try again."}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
