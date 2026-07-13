import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Inbox,
  KeyRound,
  Loader2,
  LogOut,
  MessageSquare,
  X,
} from "lucide-react";
import { getAdminComments, getAdminFeedback, moderateComment } from "../lib/api.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

const TABS = [
  { id: "flagged", label: "Flagged" },
  { id: "approved", label: "Live" },
  { id: "rejected", label: "Rejected" },
  { id: "feedback", label: "Feedback" },
];

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso + "Z").toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function KeyGate({ onSubmit, invalid }) {
  const [key, setKey] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (key.trim()) onSubmit(key.trim());
      }}
      className="card p-6 max-w-sm mx-auto mt-12 space-y-4"
    >
      <div className="flex items-center gap-2 text-slate-200">
        <KeyRound size={16} className="text-ucgold" />
        <h1 className="text-base font-bold">Admin access</h1>
      </div>
      <p className="text-xs text-slate-500">
        Enter the admin key to moderate comments and view feedback. The key is kept
        only in this browser.
      </p>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Admin key"
        autoFocus
        className="w-full bg-surface-700 border border-surface-500 text-slate-100 text-sm rounded-lg
                   px-3 py-2 focus:outline-none focus:border-ucgold font-mono"
      />
      {invalid && <p className="text-xs text-red-400">That key was rejected — check it and try again.</p>}
      <button
        type="submit"
        disabled={!key.trim()}
        className="btn w-full justify-center bg-ucgold/20 border border-ucgold/40 text-ucgold
                   hover:bg-ucgold/30 text-sm disabled:opacity-40"
      >
        Unlock
      </button>
    </form>
  );
}

function CommentRow({ comment, adminKey, tab }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action) => moderateComment(adminKey, comment.id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-comments"] }),
  });

  return (
    <li className="card p-4">
      {comment.flags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {comment.flags.map((f) => (
            <span
              key={f}
              className="badge bg-amber-500/15 text-amber-400 border border-amber-500/40"
            >
              {f}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed mb-2">
        {comment.body}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500 font-mono">
          <Link
            to={`/incident/${encodeURIComponent(comment.case_number)}`}
            className="underline hover:text-slate-300"
          >
            #{comment.case_number}
          </Link>
          {" · "}
          {formatDateTime(comment.submitted_at)}
          {comment.moderated_at && ` · moderated ${formatDateTime(comment.moderated_at)}`}
        </span>
        <div className="flex gap-2">
          {tab !== "approved" && (
            <button
              onClick={() => mutation.mutate("approve")}
              disabled={mutation.isPending}
              className="btn bg-green-500/15 border border-green-500/40 text-green-400
                         hover:bg-green-500/25 text-xs disabled:opacity-40"
            >
              <Check size={13} /> {tab === "rejected" ? "Restore" : "Approve"}
            </button>
          )}
          {tab !== "rejected" && (
            <button
              onClick={() => mutation.mutate("reject")}
              disabled={mutation.isPending}
              className="btn bg-red-500/15 border border-red-500/40 text-red-400
                         hover:bg-red-500/25 text-xs disabled:opacity-40"
            >
              <X size={13} /> {tab === "approved" ? "Take down" : "Reject"}
            </button>
          )}
        </div>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-400 mt-2">Action failed — try again.</p>
      )}
    </li>
  );
}

export default function Admin() {
  const [adminKey, setAdminKey] = useLocalStorage("admin_key", "");
  const [tab, setTab] = useState("flagged");

  const commentsQuery = useQuery({
    queryKey: ["admin-comments", tab, adminKey],
    queryFn: () => getAdminComments(adminKey, tab),
    enabled: !!adminKey && tab !== "feedback",
    retry: false,
    refetchInterval: false,
    staleTime: 0,
  });

  const feedbackQuery = useQuery({
    queryKey: ["admin-feedback", adminKey],
    queryFn: () => getAdminFeedback(adminKey),
    enabled: !!adminKey && tab === "feedback",
    retry: false,
    refetchInterval: false,
    staleTime: 0,
  });

  const active = tab === "feedback" ? feedbackQuery : commentsQuery;
  const unauthorized = active.isError && active.error?.message?.includes("403");

  if (!adminKey || unauthorized) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-6">
        <KeyGate onSubmit={setAdminKey} invalid={unauthorized && !!adminKey} />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-base font-bold text-slate-100">
          <MessageSquare size={16} className="text-ucgold" />
          Moderation
        </h1>
        <button
          onClick={() => setAdminKey("")}
          className="btn bg-surface-600 border border-surface-500 text-slate-400
                     hover:text-slate-100 hover:border-slate-400 text-xs"
        >
          <LogOut size={13} /> Lock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn text-xs border ${
              tab === t.id
                ? "bg-ucgold/20 border-ucgold/40 text-ucgold"
                : "bg-surface-600 border-surface-500 text-slate-400 hover:text-slate-100"
            }`}
          >
            {t.label}
            {t.id === "flagged" && tab === "flagged" && commentsQuery.data
              ? ` (${commentsQuery.data.length})`
              : ""}
          </button>
        ))}
      </div>

      {active.isLoading && (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 size={28} className="animate-spin text-ucgold" />
        </div>
      )}

      {active.isError && !unauthorized && (
        <p className="text-sm text-red-400">Failed to load — is the backend reachable?</p>
      )}

      {/* Comments tabs */}
      {tab !== "feedback" && commentsQuery.data && (
        commentsQuery.data.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <Inbox size={28} className="mb-2 text-slate-600" />
            <p className="text-sm">No {tab} comments</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {commentsQuery.data.map((c) => (
              <CommentRow key={c.id} comment={c} adminKey={adminKey} tab={tab} />
            ))}
          </ul>
        )
      )}

      {/* Feedback tab */}
      {tab === "feedback" && feedbackQuery.data && (
        feedbackQuery.data.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <Inbox size={28} className="mb-2 text-slate-600" />
            <p className="text-sm">No feedback yet</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {feedbackQuery.data.map((f) => (
              <li key={f.id} className="card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="badge bg-surface-600 border border-surface-500 text-slate-300 capitalize">
                    {f.type}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDateTime(f.submitted_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {f.message}
                </p>
                {f.contact && (
                  <p className="text-xs text-slate-500 font-mono mt-1.5">Contact: {f.contact}</p>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </main>
  );
}
