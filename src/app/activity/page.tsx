import { AppShell } from "@/components/layout/app-shell";
import { ActivityBoard } from "@/components/activity/activity-board";
import { requireUser } from "@server/auth/session";
import { prisma } from "@server/db";

export const dynamic = "force-dynamic";

function voteStats(
  votes: { userId: string; kind: string }[],
  userId: string,
) {
  const likes = votes.filter((v) => v.kind === "LIKE").length;
  const dislikes = votes.filter((v) => v.kind === "DISLIKE").length;
  const mine = votes.find((v) => v.userId === userId);
  const myVote = mine?.kind === "LIKE" || mine?.kind === "DISLIKE" ? mine.kind : null;
  return { likes, dislikes, myVote };
}

export default async function ActivityPage() {
  const user = await requireUser();

  const posts = await prisma.activityPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, nickname: true, avatarUrl: true, role: true } },
      award: true,
      votes: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, nickname: true, avatarUrl: true, role: true } },
          award: true,
          votes: true,
        },
      },
    },
    take: 50,
  });

  const payload = posts.map((p) => {
    const vs = voteStats(p.votes, user.id);
    return {
      id: p.id,
      body: p.body,
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      likes: vs.likes,
      dislikes: vs.dislikes,
      myVote: vs.myVote as "LIKE" | "DISLIKE" | null,
      awardedAz: p.award?.azAmount ?? null,
      replies: p.replies.map((r) => {
        const rvs = voteStats(r.votes, user.id);
        return {
          id: r.id,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
          author: r.author,
          likes: rvs.likes,
          dislikes: rvs.dislikes,
          myVote: rvs.myVote as "LIKE" | "DISLIKE" | null,
          awardedAz: r.award?.azAmount ?? null,
        };
      }),
    };
  });

  return (
    <AppShell user={user} title="Активность">
      <ActivityBoard
        posts={payload}
        isAdmin={user.role === "ADMIN"}
        currentUserId={user.id}
      />
    </AppShell>
  );
}
