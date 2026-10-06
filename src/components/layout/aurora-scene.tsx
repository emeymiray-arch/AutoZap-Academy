export function AuroraScene() {
  return (
    <div className="aurora" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="aurora-scene"
        src="/bg/scene-3d.jpg"
        alt=""
        draggable={false}
      />
      <div className="aurora-veil" />
    </div>
  );
}
