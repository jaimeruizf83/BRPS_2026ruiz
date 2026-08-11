import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="BRPS 2026 Ruiz — inicio">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="brand-copy">
        <strong>BRPS</strong>
        <small>2026 · Ruiz</small>
      </span>
    </Link>
  );
}
