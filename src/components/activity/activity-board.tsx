"use client";

import { useActionState, useEffect, useState } from "react";
import {
  awardActivityAction,
  createActivityPostAction,
  createActivityReplyAction,
  deleteActivityPostAction,
  deleteActivityReplyAction,
  toggleActivityVoteAction,
  updateActivityPostAction,
  updateActivityReplyAction,
  type ActionState,
} from "@/app/actions/social";
import { displayName, initials } from "@/lib/user";
import Link from "next/link";
import { ThumbsDown, ThumbsUp } from "lucide-react";

const empty: ActionState = {};

type Author = {
  id: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: string;
};

type VoteState = "LIKE" | "DISLIKE" | null;

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  likes: number;
  dislikes: number;
  myVote: VoteState;
  awardedAz: number | null;
};

type Post = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  likes: number;
  dislikes: number;
  myVote: VoteState;
  awardedAz: number | null;
  replies: Reply[];
};

function Avatar({ user, size = 28 }: { user: Author; size?: number }) {
  const label = displayName(user);
  const cls = `rounded-full object-cover`;
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={cls}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="az-brand-grad grid place-items-center rounded-full text-[0.55rem] font-bold text-white"
      style={{ width: size, height: size }}
    >
      {initials(label)}
    </span>
  );
}

function TireAward({ postId, replyId }: { postId?: string; replyId?: string }) {
  const [state, action, pending] = useActionState(awardActivityAction, empty);
  const [amount, setAmount] = useState(10);

  return (
    <form action={action} className="inline-flex items-center gap-1">
      {postId ? <input type="hidden" name="postId" value={postId} /> : null}
      {replyId ? <input type="hidden" name="replyId" value={replyId} /> : null}
      <input type="hidden" name="azAmount" value={amount} />
      <button
        type="button"
        aria-label="Меньше"
        className="grid h-5 w-5 place-items-center rounded-full text-[0.65rem] text-[var(--muted)] hover:bg-white/10 hover:text-white"
        onClick={() => setAmount((n) => Math.max(1, n - 5))}
      >
        −
      </button>
      <button
        type="submit"
        disabled={pending}
        title={`Начислить ${amount} AZ`}
        className="az-tire relative grid h-9 w-9 place-items-center rounded-full transition hover:scale-105 disabled:opacity-60"
      >
        <span className="az-tire-hub text-[0.65rem] font-extrabold tabular-nums text-white">
          {pending ? "…" : amount}
        </span>
      </button>
      <button
        type="button"
        aria-label="Больше"
        className="grid h-5 w-5 place-items-center rounded-full text-[0.65rem] text-[var(--muted)] hover:bg-white/10 hover:text-white"
        onClick={() => setAmount((n) => Math.min(500, n + 5))}
      >
        +
      </button>
      {state.error ? <span className="text-[0.6rem] text-rose-300">{state.error}</span> : null}
    </form>
  );
}

function VoteRow({
  postId,
  replyId,
  likes,
  dislikes,
  myVote,
  awardedAz,
  isAdmin,
}: {
  postId?: string;
  replyId?: string;
  likes: number;
  dislikes: number;
  myVote: VoteState;
  awardedAz: number | null;
  isAdmin: boolean;
}) {
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <form action={toggleActivityVoteAction} className="inline">
        {postId ? <input type="hidden" name="postId" value={postId} /> : null}
        {replyId ? <input type="hidden" name="replyId" value={replyId} /> : null}
        <input type="hidden" name="kind" value="LIKE" />
        <button
          type="submit"
          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[0.7rem] ${
            myVote === "LIKE" ? "text-[var(--cyan)]" : "text-[var(--muted)] hover:text-white"
          }`}
          aria-label="Лайк"
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${myVote === "LIKE" ? "fill-current" : ""}`} />
          <span className="tabular-nums">{likes}</span>
        </button>
      </form>
      <form action={toggleActivityVoteAction} className="inline">
        {postId ? <input type="hidden" name="postId" value={postId} /> : null}
        {replyId ? <input type="hidden" name="replyId" value={replyId} /> : null}
        <input type="hidden" name="kind" value="DISLIKE" />
        <button
          type="submit"
          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[0.7rem] ${
            myVote === "DISLIKE" ? "text-rose-300" : "text-[var(--muted)] hover:text-white"
          }`}
          aria-label="Дизлайк"
        >
          <ThumbsDown className={`h-3.5 w-3.5 ${myVote === "DISLIKE" ? "fill-current" : ""}`} />
          <span className="tabular-nums">{dislikes}</span>
        </button>
      </form>

      {awardedAz != null ? (
        <span className="az-tire az-tire-awarded relative ml-1 grid h-7 w-7 place-items-center rounded-full">
          <span className="az-tire-hub text-[0.55rem] font-extrabold text-[var(--cyan)]">
            +{awardedAz}
          </span>
        </span>
      ) : isAdmin ? (
        <TireAward postId={postId} replyId={replyId} />
      ) : null}
    </div>
  );
}

function EditableBody({
  body,
  canEdit,
  onUpdate,
  onDelete,
  deleteField,
  deleteId,
  textClassName,
}: {
  body: string;
  canEdit: boolean;
  onUpdate: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  onDelete: (formData: FormData) => Promise<void> | void;
  deleteField: "postId" | "replyId";
  deleteId: string;
  textClassName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(onUpdate, empty);

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  if (!canEdit) {
    return <p className={textClassName}>{body}</p>;
  }

  if (editing) {
    return (
      <form action={action} className="mt-0.5 space-y-1.5">
        <input type="hidden" name={deleteField} value={deleteId} />
        <textarea
          name="body"
          required
          defaultValue={body}
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
    );
  }

  return (
    <div>
      <p className={textClassName}>{body}</p>
      <div className="mt-1 flex gap-2 text-[0.65rem] text-[var(--muted)]">
        <button type="button" className="hover:text-[var(--cyan)]" onClick={() => setEditing(true)}>
          изменить
        </button>
        <form action={onDelete}>
          <input type="hidden" name={deleteField} value={deleteId} />
          <button type="submit" className="hover:text-rose-300">
            удалить
          </button>
        </form>
      </div>
    </div>
  );
}

export function ActivityBoard({
  posts,
  isAdmin,
  currentUserId,
}: {
  posts: Post[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [postState, postAction, postPending] = useActionState(createActivityPostAction, empty);

  return (
    <div className="space-y-2">
      <form action={postAction} className="flex gap-2">
        <input
          name="body"
          required
          placeholder="Ваш вопрос…"
          className="az-input az-input-rect flex-1 py-2 text-sm"
        />
        <button type="submit" disabled={postPending} className="az-btn az-btn-accent shrink-0 px-3 text-xs">
          {postPending ? "…" : "→"}
        </button>
        {postState.error ? (
          <p className="basis-full text-[0.7rem] text-rose-300">{postState.error}</p>
        ) : null}
      </form>

      {posts.map((post) => {
        const canEditPost = post.author.id === currentUserId || isAdmin;
        return (
          <article key={post.id} className="border-b border-white/10 py-2.5">
            <div className="flex items-start gap-2">
              <Link href={`/participants/${post.author.id}`} className="shrink-0 pt-0.5">
                <Avatar user={post.author} size={28} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                  <Link
                    href={`/participants/${post.author.id}`}
                    className="text-xs font-semibold text-white hover:text-[var(--cyan)]"
                  >
                    {displayName(post.author)}
                  </Link>
                  <span className="text-[0.6rem] text-[var(--muted)]">
                    {new Date(post.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <EditableBody
                  body={post.body}
                  canEdit={canEditPost}
                  onUpdate={updateActivityPostAction}
                  onDelete={deleteActivityPostAction}
                  deleteField="postId"
                  deleteId={post.id}
                  textClassName="mt-0.5 whitespace-pre-wrap text-sm leading-snug text-white/90"
                />

                <VoteRow
                  postId={post.id}
                  likes={post.likes}
                  dislikes={post.dislikes}
                  myVote={post.myVote}
                  awardedAz={post.awardedAz}
                  isAdmin={isAdmin}
                />

                {post.replies.length > 0 ? (
                  <ul className="mt-1.5 space-y-1.5 border-l border-white/10 pl-2.5">
                    {post.replies.map((reply) => {
                      const canEditReply = reply.author.id === currentUserId || isAdmin;
                      return (
                        <li key={reply.id} className="flex items-start gap-1.5">
                          <Link
                            href={`/participants/${reply.author.id}`}
                            className="shrink-0 pt-0.5"
                          >
                            <Avatar user={reply.author} size={22} />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/participants/${reply.author.id}`}
                              className="text-[0.7rem] font-semibold text-white/90"
                            >
                              {displayName(reply.author)}
                            </Link>
                            <EditableBody
                              body={reply.body}
                              canEdit={canEditReply}
                              onUpdate={updateActivityReplyAction}
                              onDelete={deleteActivityReplyAction}
                              deleteField="replyId"
                              deleteId={reply.id}
                              textClassName="whitespace-pre-wrap text-[0.8rem] leading-snug text-white/85"
                            />
                            <VoteRow
                              replyId={reply.id}
                              likes={reply.likes}
                              dislikes={reply.dislikes}
                              myVote={reply.myVote}
                              awardedAz={reply.awardedAz}
                              isAdmin={isAdmin}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                <ReplyForm postId={post.id} />
              </div>
            </div>
          </article>
        );
      })}

      {posts.length === 0 ? (
        <p className="px-1 text-sm text-[var(--muted)]">Пока нет вопросов — будьте первым.</p>
      ) : null}
    </div>
  );
}

function ReplyForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(createActivityReplyAction, empty);
  return (
    <form action={action} className="mt-1.5 flex gap-1.5">
      <input type="hidden" name="postId" value={postId} />
      <input
        name="body"
        required
        placeholder="Ответ…"
        className="az-input az-input-rect flex-1 py-1.5 text-xs"
      />
      <button type="submit" disabled={pending} className="az-btn az-btn-ghost px-2.5 py-1.5 text-xs">
        →
      </button>
      {state.error ? <span className="text-[0.65rem] text-rose-300">{state.error}</span> : null}
    </form>
  );
}
