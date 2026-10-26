import { useId } from "react";

// The AETHER "A": a forward-rising crossbar that reads like a stride.
// Drawn in currentColor, with the gap under the crossbar cut out (not painted),
// so it works on any background.
export default function AetherMark({ className = "size-7", title }) {
  const id = useId();
  return (
    <svg viewBox="0 0 200 200" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <mask id={id}>
        <rect width="200" height="200" fill="white" />
        <polygon points="40,150 198,104 198,120 34,166" fill="black" />
      </mask>
      <polygon points="18,182 88,18 112,18 182,182 148,182 100,70 52,182" fill="currentColor" mask={`url(#${id})`} />
      <polygon points="58,138 196,98 196,110 54,150" fill="currentColor" />
    </svg>
  );
}
