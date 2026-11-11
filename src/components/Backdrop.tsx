import type { CSSProperties } from 'react';

export function Blob({
  size,
  color,
  opacity,
  pos,
}: {
  size: number;
  color: string;
  opacity: number;
  pos: CSSProperties;
}) {
  return (
    <div
      className="blob"
      aria-hidden="true"
      style={{ width: size, height: size, opacity, '--c': color, ...pos } as CSSProperties}
    />
  );
}

/** Grid and three colour blobs behind every dark hero. */
export function HeroBackdrop() {
  return (
    <>
      <div className="gridbg" aria-hidden="true" />
      <Blob size={560} color="#3B5BFF" opacity={0.5} pos={{ right: -120, top: -60 }} />
      <Blob size={460} color="#7C4DFF" opacity={0.32} pos={{ left: -180, top: 260 }} />
      <Blob size={380} color="#22D3EE" opacity={0.22} pos={{ right: 260, bottom: -200 }} />
    </>
  );
}
