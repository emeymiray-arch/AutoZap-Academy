import type { ReactNode } from "react";

export type FrameKind = "scroll" | "filigree" | "lace" | "geometric";

const W = 1414;
const H = 1000;

type Pt = [number, number];

function p(pt: Pt) {
  return `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`;
}

function petalPath(cx: number, cy: number, angle: number, len: number, wid: number) {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const tip: Pt = [cx + ux * len, cy + uy * len];
  const c1: Pt = [cx + ux * len * 0.42 + px * wid, cy + uy * len * 0.42 + py * wid];
  const c2: Pt = [cx + ux * len * 0.78 + px * wid * 0.22, cy + uy * len * 0.78 + py * wid * 0.22];
  const c3: Pt = [cx + ux * len * 0.78 - px * wid * 0.22, cy + uy * len * 0.78 - py * wid * 0.22];
  const c4: Pt = [cx + ux * len * 0.42 - px * wid, cy + uy * len * 0.42 - py * wid];
  return `M ${cx.toFixed(1)} ${cy.toFixed(1)} C ${p(c1)}, ${p(c2)}, ${p(tip)} C ${p(c3)}, ${p(c4)}, ${cx.toFixed(1)} ${cy.toFixed(1)}`;
}

function Sheet({ color, children }: { color: string; children: ReactNode }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ color }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const pen = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Rule({ x1, y1, x2, y2, width = 1.6 }: { x1: number; y1: number; x2: number; y2: number; width?: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...pen} strokeWidth={width} />;
}

function mirrorPath(d: string) {
  return d.replace(/(-?\d+(?:\.\d+)?)[ \t]+(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${y} ${x}`);
}

/** Calligraphic corner: one open curl per arm, reflected across the diagonal. */
function CornerArt() {
  const upper = [
    "M 248 46",
    "C 176 46, 142 34, 118 16",
    "C 92 4, 52 12, 42 40",
    "C 32 68, 64 96, 102 80",
    "C 128 70, 130 48, 110 40",
    "C 94 33, 80 46, 90 58",
    "M 42 40",
    "C 24 22, 22 24, 40 42",
  ].join(" ");

  return (
    <g {...pen}>
      <path d={upper} />
      <path d={mirrorPath(upper)} />
      <path d="M 90 58 C 76 74, 74 76, 58 90" />
      <path d={petalPath(68, 68, -Math.PI * 0.75, 24, 6.5)} />
      <path d={petalPath(86, 86, Math.PI * 0.25, 16, 4.6)} />
      <circle cx="90" cy="58" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="58" cy="90" r="1.7" fill="currentColor" stroke="none" />
    </g>
  );
}

function CenterPiece({ half = 96 }: { half?: number }) {
  return (
    <g {...pen} strokeWidth="1.5">
      <path d={`M ${-half} 0 H -40`} />
      <path d={`M ${half} 0 H 40`} />
      <path d="M -40 0 C -40 -18, -16 -20, -14 -6 C -12 6, -30 8, -26 -8" />
      <path d="M 40 0 C 40 -18, 16 -20, 14 -6 C 12 6, 30 8, 26 -8" />
      <path d="M 0 -9 L 5.2 0 L 0 9 L -5.2 0 Z" />
      <circle cx="0" cy="0" r="1.5" fill="currentColor" stroke="none" />
    </g>
  );
}

function PlacedCorners({ scale, ox }: { scale: number; ox: number }) {
  const sw = 1.7 / scale;
  return (
    <>
      <g transform={`translate(${ox} ${ox}) scale(${scale})`} strokeWidth={sw}>
        <CornerArt />
      </g>
      <g transform={`translate(${W - ox} ${ox}) scale(${-scale} ${scale})`} strokeWidth={sw}>
        <CornerArt />
      </g>
      <g transform={`translate(${ox} ${H - ox}) scale(${scale} ${-scale})`} strokeWidth={sw}>
        <CornerArt />
      </g>
      <g transform={`translate(${W - ox} ${H - ox}) scale(${-scale})`} strokeWidth={sw}>
        <CornerArt />
      </g>
    </>
  );
}

function EdgeRules({
  outer,
  inner,
  corner,
  gap,
  sides,
}: {
  outer: number;
  inner?: number;
  corner: number;
  gap: number;
  sides: boolean;
}) {
  const midX = W / 2;
  const midY = H / 2;
  const width = 1.55;
  return (
    <g>
      <Rule x1={corner} y1={outer} x2={midX - gap} y2={outer} width={width} />
      <Rule x1={midX + gap} y1={outer} x2={W - corner} y2={outer} width={width} />
      <Rule x1={corner} y1={H - outer} x2={midX - gap} y2={H - outer} width={width} />
      <Rule x1={midX + gap} y1={H - outer} x2={W - corner} y2={H - outer} width={width} />
      {sides ? (
        <>
          <Rule x1={outer} y1={corner} x2={outer} y2={midY - gap} width={width} />
          <Rule x1={outer} y1={midY + gap} x2={outer} y2={H - corner} width={width} />
          <Rule x1={W - outer} y1={corner} x2={W - outer} y2={midY - gap} width={width} />
          <Rule x1={W - outer} y1={midY + gap} x2={W - outer} y2={H - corner} width={width} />
        </>
      ) : (
        <>
          <Rule x1={outer} y1={corner} x2={outer} y2={H - corner} width={width} />
          <Rule x1={W - outer} y1={corner} x2={W - outer} y2={H - corner} width={width} />
        </>
      )}
      {inner ? (
        <rect x={inner} y={inner} width={W - inner * 2} height={H - inner * 2} {...pen} strokeWidth="1.05" />
      ) : null}
    </g>
  );
}

function ScrollFrame({ color }: { color: string }) {
  const ox = 8;
  const scale = 1;
  const rule = ox + 46 * scale;
  const along = ox + 248 * scale;
  const half = 96;
  return (
    <Sheet color={color}>
      <EdgeRules outer={rule} inner={116} corner={along} gap={half} sides={false} />
      <PlacedCorners scale={scale} ox={ox} />
      <g transform={`translate(${W / 2} ${rule})`}>
        <CenterPiece half={half} />
      </g>
      <g transform={`translate(${W / 2} ${H - rule}) scale(1 -1)`}>
        <CenterPiece half={half} />
      </g>
    </Sheet>
  );
}

function FiligreeFrame({ color }: { color: string }) {
  const ox = 10;
  const scale = 0.72;
  const rule = ox + 46 * scale;
  const along = ox + 248 * scale;
  const half = 78;
  return (
    <Sheet color={color}>
      <EdgeRules outer={rule} inner={102} corner={along} gap={half} sides />
      <PlacedCorners scale={scale} ox={ox} />
      <g transform={`translate(${W / 2} ${rule})`}>
        <CenterPiece half={half} />
      </g>
      <g transform={`translate(${W / 2} ${H - rule}) scale(1 -1)`}>
        <CenterPiece half={half} />
      </g>
      <g transform={`translate(${rule} ${H / 2}) rotate(-90)`}>
        <CenterPiece half={half} />
      </g>
      <g transform={`translate(${W - rule} ${H / 2}) rotate(90)`}>
        <CenterPiece half={half} />
      </g>
    </Sheet>
  );
}

function scallop(a0: number, a1: number, b: number, waves: number, amp: number, axis: "h" | "v") {
  const step = (a1 - a0) / waves;
  let d = axis === "h" ? `M ${a0.toFixed(1)} ${b.toFixed(1)}` : `M ${b.toFixed(1)} ${a0.toFixed(1)}`;
  for (let i = 0; i < waves; i++) {
    const bulge = i % 2 === 0 ? amp : -amp * 0.35;
    const mid = a0 + step * (i + 0.5);
    const end = a0 + step * (i + 1);
    d +=
      axis === "h"
        ? ` Q ${mid.toFixed(1)} ${(b + bulge).toFixed(1)}, ${end.toFixed(1)} ${b.toFixed(1)}`
        : ` Q ${(b + bulge).toFixed(1)} ${mid.toFixed(1)}, ${b.toFixed(1)} ${end.toFixed(1)}`;
  }
  return d;
}

function Rosette({ cx, cy, r = 12 }: { cx: number; cy: number; r?: number }) {
  return (
    <g {...pen} strokeWidth="1.35">
      <circle cx={cx} cy={cy} r={r} />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={petalPath(cx, cy, (i * Math.PI) / 4, r * 0.7, r * 0.24)} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.28} />
      <circle cx={cx} cy={cy} r="1.3" fill="currentColor" stroke="none" />
    </g>
  );
}

function ScrollLink({
  a,
  b,
  line,
  axis,
  outward,
}: {
  a: number;
  b: number;
  line: number;
  axis: "h" | "v";
  outward: number;
}) {
  const mid = (a + b) / 2;
  const lift = 16 * outward;
  const d =
    axis === "h"
      ? `M ${a} ${line} C ${a + 18} ${line + lift}, ${mid - 14} ${line + lift}, ${mid} ${line} C ${mid + 14} ${line - lift}, ${b - 18} ${line - lift}, ${b} ${line}`
      : `M ${line} ${a} C ${line + lift} ${a + 18}, ${line + lift} ${mid - 14}, ${line} ${mid} C ${line - lift} ${mid + 14}, ${line - lift} ${b - 18}, ${line} ${b}`;
  const leafOut = axis === "h" ? (outward < 0 ? -Math.PI / 2 : Math.PI / 2) : outward < 0 ? Math.PI : 0;
  const leafIn = leafOut + Math.PI;
  const crest =
    axis === "h"
      ? { x: (a + mid) / 2, y: line + lift * 0.65 }
      : { x: line + lift * 0.65, y: (a + mid) / 2 };
  const trough =
    axis === "h"
      ? { x: (mid + b) / 2, y: line - lift * 0.65 }
      : { x: line - lift * 0.65, y: (mid + b) / 2 };

  return (
    <g {...pen} strokeWidth="1.3">
      <path d={d} />
      <path d={petalPath(crest.x, crest.y, leafOut, 11, 3.4)} />
      <path d={petalPath(trough.x, trough.y, leafIn, 11, 3.4)} />
    </g>
  );
}

function LaceFrame({ color }: { color: string }) {
  const outer = 24;
  const vine = 58;
  const inner = 108;
  const side = 132;
  const xs = distribute(168, W - 168, 108);
  const ys = distribute(168, H - 168, 108);
  const links = (points: number[], line: number, axis: "h" | "v", outward: number, key: string) =>
    points.slice(0, -1).map((value, i) => (
      <ScrollLink
        key={`${key}-${i}`}
        a={value + 14}
        b={points[i + 1] - 14}
        line={line}
        axis={axis}
        outward={outward}
      />
    ));

  return (
    <Sheet color={color}>
      <path d={scallop(side, W - side, outer, 18, -16, "h")} {...pen} strokeWidth="1.55" />
      <path d={scallop(side, W - side, H - outer, 18, 16, "h")} {...pen} strokeWidth="1.55" />
      <path d={scallop(side, H - side, outer, 11, -16, "v")} {...pen} strokeWidth="1.55" />
      <path d={scallop(side, H - side, W - outer, 11, 16, "v")} {...pen} strokeWidth="1.55" />
      <g {...pen} strokeWidth="1.3">
        <path d={`M ${side} ${outer} C 46 ${outer}, ${outer} 46, ${outer} ${side}`} />
        <path d={`M ${W - side} ${outer} C ${W - 46} ${outer}, ${W - outer} 46, ${W - outer} ${side}`} />
        <path d={`M ${side} ${H - outer} C 46 ${H - outer}, ${outer} ${H - 46}, ${outer} ${H - side}`} />
        <path d={`M ${W - side} ${H - outer} C ${W - 46} ${H - outer}, ${W - outer} ${H - 46}, ${W - outer} ${H - side}`} />
      </g>
      <rect x={inner} y={inner} width={W - inner * 2} height={H - inner * 2} {...pen} strokeWidth="1.45" />
      <rect x={inner + 8} y={inner + 8} width={W - (inner + 8) * 2} height={H - (inner + 8) * 2} {...pen} strokeWidth="0.9" />
      {links(xs, vine, "h", -1, "top")}
      {links(xs, H - vine, "h", 1, "bot")}
      {links(ys, vine, "v", -1, "left")}
      {links(ys, W - vine, "v", 1, "right")}
      <ScrollLink a={vine + 18} b={xs[0] - 14} line={vine} axis="h" outward={-1} />
      <ScrollLink a={xs[xs.length - 1] + 14} b={W - vine - 18} line={vine} axis="h" outward={-1} />
      <ScrollLink a={vine + 18} b={xs[0] - 14} line={H - vine} axis="h" outward={1} />
      <ScrollLink a={xs[xs.length - 1] + 14} b={W - vine - 18} line={H - vine} axis="h" outward={1} />
      <ScrollLink a={vine + 18} b={ys[0] - 14} line={vine} axis="v" outward={-1} />
      <ScrollLink a={ys[ys.length - 1] + 14} b={H - vine - 18} line={vine} axis="v" outward={-1} />
      <ScrollLink a={vine + 18} b={ys[0] - 14} line={W - vine} axis="v" outward={1} />
      <ScrollLink a={ys[ys.length - 1] + 14} b={H - vine - 18} line={W - vine} axis="v" outward={1} />
      {xs.map((x) => (
        <Rosette key={`tx-${x}`} cx={x} cy={vine} />
      ))}
      {xs.map((x) => (
        <Rosette key={`bx-${x}`} cx={x} cy={H - vine} />
      ))}
      {ys.map((y) => (
        <Rosette key={`ly-${y}`} cx={vine} cy={y} />
      ))}
      {ys.map((y) => (
        <Rosette key={`ry-${y}`} cx={W - vine} cy={y} />
      ))}
      <Rosette cx={vine} cy={vine} r={16} />
      <Rosette cx={W - vine} cy={vine} r={16} />
      <Rosette cx={vine} cy={H - vine} r={16} />
      <Rosette cx={W - vine} cy={H - vine} r={16} />
    </Sheet>
  );
}

function distribute(start: number, end: number, target: number) {
  const span = end - start;
  const gaps = Math.max(2, Math.round(span / target));
  const step = span / gaps;
  return Array.from({ length: gaps + 1 }, (_, i) => start + step * i);
}

function Bead({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g {...pen} strokeWidth="1.35">
      <circle cx={cx} cy={cy} r="11" />
      <circle cx={cx} cy={cy} r="5.2" strokeWidth="1.1" />
      <circle cx={cx} cy={cy} r="1.35" fill="currentColor" stroke="none" />
    </g>
  );
}

/** Small flower between chain beads on the geometric frame. */
function Bloom({
  cx,
  cy,
  n = 4,
  len = 6.5,
  wid = 2.1,
  width = 1.15,
  dot = 1.1,
}: {
  cx: number;
  cy: number;
  n?: number;
  len?: number;
  wid?: number;
  width?: number;
  dot?: number;
}) {
  return (
    <g {...pen} strokeWidth={width}>
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={petalPath(cx, cy, (i * Math.PI * 2) / n + Math.PI / n, len, wid)} />
      ))}
      <circle cx={cx} cy={cy} r={dot} fill="currentColor" stroke="none" />
    </g>
  );
}

function GeometricFrame({ color }: { color: string }) {
  const edge = 58;
  const r = 11;
  const xs = distribute(edge, W - edge, 44);
  const ys = distribute(edge, H - edge, 44);

  const hSegs = (yOuter: number, yInner: number, y: number) =>
    xs.slice(0, -1).map((x, i) => {
      const a = x + r;
      const b = xs[i + 1] - r;
      const mid = (x + xs[i + 1]) / 2;
      return { a, b, yOuter, yInner, mid, y, key: `${y}-${i}` };
    });

  const vSegs = (xOuter: number, xInner: number, x: number) =>
    ys.slice(0, -1).map((y, i) => {
      const a = y + r;
      const b = ys[i + 1] - r;
      const mid = (y + ys[i + 1]) / 2;
      return { a, b, xOuter, xInner, mid, x, key: `${x}-${i}` };
    });

  const top = hSegs(edge - r, edge + r, edge);
  const bottom = hSegs(H - edge + r, H - edge - r, H - edge);
  const left = vSegs(edge - r, edge + r, edge);
  const right = vSegs(W - edge + r, W - edge - r, W - edge);

  return (
    <Sheet color={color}>
      <g {...pen} strokeWidth="1.45">
        {top.map((s) => (
          <g key={s.key}>
            <line x1={s.a} y1={s.yOuter} x2={s.b} y2={s.yOuter} />
            <line x1={s.a} y1={s.yInner} x2={s.b} y2={s.yInner} />
          </g>
        ))}
        {bottom.map((s) => (
          <g key={s.key}>
            <line x1={s.a} y1={s.yOuter} x2={s.b} y2={s.yOuter} />
            <line x1={s.a} y1={s.yInner} x2={s.b} y2={s.yInner} />
          </g>
        ))}
        {left.map((s) => (
          <g key={`l-${s.key}`}>
            <line x1={s.xOuter} y1={s.a} x2={s.xOuter} y2={s.b} />
            <line x1={s.xInner} y1={s.a} x2={s.xInner} y2={s.b} />
          </g>
        ))}
        {right.map((s) => (
          <g key={`r-${s.key}`}>
            <line x1={s.xOuter} y1={s.a} x2={s.xOuter} y2={s.b} />
            <line x1={s.xInner} y1={s.a} x2={s.xInner} y2={s.b} />
          </g>
        ))}
      </g>
      {xs.map((x) => (
        <Bead key={`t-${x}`} cx={x} cy={edge} />
      ))}
      {xs.map((x) => (
        <Bead key={`b-${x}`} cx={x} cy={H - edge} />
      ))}
      {ys.slice(1, -1).map((y) => (
        <Bead key={`l-${y}`} cx={edge} cy={y} />
      ))}
      {ys.slice(1, -1).map((y) => (
        <Bead key={`r-${y}`} cx={W - edge} cy={y} />
      ))}
      {top.map((s) => (
        <Bloom key={`tf-${s.key}`} cx={s.mid} cy={s.y} n={4} len={6.5} wid={2.1} width={1.15} dot={1.1} />
      ))}
      {bottom.map((s) => (
        <Bloom key={`bf-${s.key}`} cx={s.mid} cy={s.y} n={4} len={6.5} wid={2.1} width={1.15} dot={1.1} />
      ))}
      {left.map((s) => (
        <Bloom key={`lf-${s.key}`} cx={s.x} cy={s.mid} n={4} len={6.5} wid={2.1} width={1.15} dot={1.1} />
      ))}
      {right.map((s) => (
        <Bloom key={`rf-${s.key}`} cx={s.x} cy={s.mid} n={4} len={6.5} wid={2.1} width={1.15} dot={1.1} />
      ))}
    </Sheet>
  );
}

export function CertificateFrame({ kind, color }: { kind: FrameKind; color: string }) {
  if (kind === "filigree") return <FiligreeFrame color={color} />;
  if (kind === "lace") return <LaceFrame color={color} />;
  if (kind === "geometric") return <GeometricFrame color={color} />;
  return <ScrollFrame color={color} />;
}
