import Link from "next/link";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import type { AuthorizedUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/format";
import { Brand } from "./Brand";

const nav = [
  { href: "/dashboard", label: "Resumen", icon: "⌂" },
  { href: "/organizaciones", label: "Organizaciones", icon: "◇" },
  { href: "/campanas", label: "Campañas", icon: "◎" },
  { href: "/equipo", label: "Equipo", icon: "♙" },
];

export function AppShell({
  user,
  children,
}: {
  user: AuthorizedUser;
  children: React.ReactNode;
}) {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand href="/dashboard" />
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {nav.map((item) => (
            <Link href={item.href} key={item.href}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="avatar" aria-hidden="true">
            {user.displayName.charAt(0).toUpperCase()}
          </span>
          <div>
            <strong>{user.displayName}</strong>
            <small>{ROLE_LABELS[user.role]}</small>
          </div>
          <Link
            className="signout"
            href={chatGPTSignOutPath("/")}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            ↗
          </Link>
        </div>
      </aside>
      <div className="app-content">
        <header className="mobile-header">
          <Brand href="/dashboard" />
          <span className="avatar" aria-hidden="true">
            {user.displayName.charAt(0).toUpperCase()}
          </span>
        </header>
        <nav className="mobile-nav" aria-label="Navegación móvil">
          {nav.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
