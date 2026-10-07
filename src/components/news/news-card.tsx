import { deleteNewsAction } from "@/app/actions/social";

export function NewsCard({
  id,
  title,
  body,
  meta,
  canDelete = false,
  compact = false,
}: {
  id: string;
  title: string;
  body: string;
  meta?: string;
  canDelete?: boolean;
  compact?: boolean;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/80 bg-white p-3 text-black shadow-[0_0_0_1px_rgba(3,205,253,0.2),0_10px_28px_rgba(3,205,253,0.18)] md:p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#03cdfd] via-[#7dd3fc] to-[#0360fd]" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className={`font-black text-black ${compact ? "text-sm md:text-base" : "text-base md:text-lg"}`}>
            {title}
          </h4>
          <p
            className={`mt-1 leading-snug text-black/80 ${
              compact ? "line-clamp-2 text-xs md:text-sm" : "whitespace-pre-wrap text-sm md:text-base"
            }`}
          >
            {body}
          </p>
          {meta ? <p className="mt-2 text-[0.7rem] font-semibold text-black/50">{meta}</p> : null}
        </div>
        {canDelete ? (
          <form action={deleteNewsAction} className="shrink-0">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="text-[0.7rem] font-bold text-black/45 hover:text-rose-600 md:text-xs"
            >
              удалить
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
