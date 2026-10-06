"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendChatMessageAction, type ActionState } from "@/app/actions/social";

const empty: ActionState = {};

export function ChatComposer({ threadId }: { threadId: string }) {
  const [state, action, pending] = useActionState(sendChatMessageAction, empty);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-3 flex gap-2">
      <input type="hidden" name="threadId" value={threadId} />
      <input
        name="body"
        required
        placeholder="Сообщение…"
        className="az-input az-input-rect flex-1 py-2 text-sm"
        autoComplete="off"
      />
      <button type="submit" disabled={pending} className="az-btn az-btn-accent text-sm">
        Отправить
      </button>
    </form>
  );
}
