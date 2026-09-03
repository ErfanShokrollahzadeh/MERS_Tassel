'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, BarChart3, Bell, BookOpen, ChevronLeft, CircleHelp, Command, LayoutDashboard, Megaphone, Menu, MessageCircle, Moon, Package, Search, Settings, ShoppingBag, Sparkles, Sun, TicketCheck, Users, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/exchanges', label: 'Exchanges', icon: ArrowLeftRight },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/blog', label: 'Journal & Stories', icon: BookOpen },
  { href: '/admin/settings', label: 'Site settings', icon: Settings },
  { href: '/admin/users', label: 'People & roles', icon: Users },
  { href: '/admin/marketing', label: 'Growth', icon: BarChart3 },
  { href: '/admin/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/admin/popups', label: 'Popups & Modals', icon: Sparkles },
  { href: '/admin/support', label: 'Support', icon: TicketCheck },
];




export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const signOut = useAuthStore((state) => state.signOut);

  const isLoginRoute = pathname === '/admin/login';
  const isWorkspaceUser = user?.role === 'admin' || user?.role === 'staff';
  const links = user?.role === 'staff' ? adminLinks.filter((link) => link.href === '/admin/support') : adminLinks;

  // Admins receive the full workspace; Staff is a deliberately narrow support-only role.
  useEffect(() => {
    if (!hasHydrated || isLoginRoute) return;
    if (!isWorkspaceUser) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    } else if (user.role === 'staff' && !pathname.startsWith('/admin/support')) {
      router.replace('/admin/support');
    }
  }, [hasHydrated, isLoginRoute, isWorkspaceUser, pathname, router, user]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/admin/login');
  };

  // The login screen renders on its own, without the workspace chrome around it.
  if (isLoginRoute) return <>{children}</>;

  if (!hasHydrated || !user || !isWorkspaceUser) {
    return <div className="admin-gate"><span className="skeleton-block admin-gate__bar" /><p>Checking your workspace access…</p></div>;
  }

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || 'MT';

  return (
    <div className={`admin-app${collapsed ? ' admin-app--collapsed' : ''}`}>
      <a className="skip-link" href="#admin-main">Skip to workspace</a>
      <aside className={`admin-sidebar glass-panel${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="admin-brand"><Link href="/admin" className="wordmark"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <div className="workspace-switcher"><span className="workspace-avatar">MA</span><div><strong>MERS Atelier</strong><small>{user.role === 'staff' ? 'Support workspace' : 'Commerce workspace'}</small></div></div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return <Link key={href} href={href} className={active ? 'active' : ''} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="admin-nav admin-nav--secondary">
          <a href="https://app.crisp.chat/" target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /><span>Crisp Inbox ↗</span></a>
          <Link href="/"><CircleHelp size={18} /><span>View storefront</span></Link>
        </div>
        <div className="admin-profile">
          <span>{initials}</span>
          <div><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small></div>
          <button onClick={handleSignOut} aria-label="Sign out">Sign out</button>
        </div>
        <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft size={17} /></button>
      </aside>

      {mobileOpen && <div className="admin-sidebar-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <div className="admin-stage">
        <header className="admin-topbar glass-bar">
          <button className="icon-button mobile-admin-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <button className="command-trigger" onClick={() => setCommandOpen(true)}><Search size={16} /><span>Jump to a section…</span><kbd><Command size={11} /> K</kbd></button>
          <div className="topbar-actions"><Link href="/" className="view-store">View store ↗</Link><button className="icon-button" onClick={toggleTheme}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button"><Bell size={18} /></button></div>
        </header>
        <main id="admin-main" className="admin-main">{children}</main>
      </div>

      {commandOpen && (
        <div className="command-modal" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={() => setCommandOpen(false)}>
          <div className="command-box glass-overlay" onMouseDown={(event) => event.stopPropagation()}>
            <div><Search size={18} /><input autoFocus placeholder="Jump to a section…" /><kbd>esc</kbd></div>
            <p>Quick navigation</p>
            {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setCommandOpen(false)}><Icon size={17} />{label}<span>Open ↗</span></Link>)}
          </div>
        </div>
      )}
    </div>
  );
}
