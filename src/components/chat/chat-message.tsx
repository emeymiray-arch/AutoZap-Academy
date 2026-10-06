"use client";

import { useActionState, useEffect, useState } from "react";
import {
  deleteChatMessageAction,
  updateChatMessageAction,
  type ActionState,
} from "@/app/actions/social";
import { displayName } from "@/lib/user";

const empty: ActionState = {};

type Sender = {
  id: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
};

export function ChatMessageBubble({
  message,
  mine,
}: {
  message: {
    id: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    sender: Sender;
  };
  mine: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateChatMessageAction, empty);
  const edited = new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > 1000;

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          mine
            ? "bg-[rgba(3,96,253,0.35)] text-white"
            : "border border-white/15 bg-white/5 text-white/90"
        }`}
      >
        {!mine ? (
          <p className="mb-0.5 text-[0.65rem] font-semibold text-[var(--cyan)]">
            {displayName(message.sender)}
          </p>
        ) : null}

        {editing ? (
          <form action={action} className="space-y-2">
            <input type="hidden" name="messageId" value={message.id} />
            <textarea
              name="body"
              required
              defaultValue={message.body}
              rows={3}
              className="az-input az-input-rect w-full text-sm"
            />
            {state.error ? <p className="text-[0.65rem] text-rose-300">{state.error}</p> : null}
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="az-btn az-btn-accent px-2.5 py-1 text-xs">
                {pending ? "…" : "Сохранить"}
              </button>
              <button
                type="button"
                className="az-btn az-btn-ghost px-2.5 py-1 text-xs"
                onClick={() => setEditing(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.body}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6rem] opacity-60">
              <span>
                {new Date(message.createdAt).toLocaleString("ru-RU")}
                {edited ? " · изм." : ""}
              </span>
              {mine ? (
                <>
                  <button
                    type="button"
                    className="hover:text-white hover:opacity-100"
                    onClick={() => setEditing(true)}
                  >
                    изменить
                  </button>
                  <form action={deleteChatMessageAction} className="inline">
                    <input type="hidden" name="messageId" value={message.id} />
                    <button type="submit" className="hover:text-rose-300 hover:opacity-100">
                      удалить
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
