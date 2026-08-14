'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Bell, ChevronLeft, CircleHelp, Command, LayoutDashboard, Megaphone, Menu, Moon, Package, Search, Settings, ShoppingBag, Sun, TicketCheck, Users, X } from 'lucide-react';

const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: '12' },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/marketing', label: 'Growth', icon: BarChart3 },
  { href: '/admin/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/admin/support', label: 'Support', icon: TicketCheck, badge: '3' },
  { href: '/admin/users', label: 'People & roles', icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'; };

  return (
    <div className={`admin-app${collapsed ? ' admin-app--collapsed' : ''}`}>
      <a className="skip-link" href="#admin-main">Skip to workspace</a>
      <aside className={`admin-sidebar glass-panel${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="admin-brand"><Link href="/admin" className="wordmark"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link><button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <div className="workspace-switcher"><span className="workspace-avatar">MA</span><div><strong>MERS Atelier</strong><small>Commerce workspace</small></div></div>
        <nav className="admin-nav" aria-label="Admin navigation">{links.map(({ href, label, icon: Icon, badge }) => { const active = pathname === href || (href !== '/admin' && pathname.startsWith(href)); return <Link key={href} href={href} className={active ? 'active' : ''} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span>{badge && <b>{badge}</b>}</Link>; })}</nav>
        <div className="admin-nav admin-nav--secondary"><a href="#"><Settings size={18} /><span>Settings</span></a><a href="#"><CircleHelp size={18} /><span>Help center</span></a></div>
        <div className="admin-profile"><span>DS</span><div><strong>Derya Selin</strong><small>Owner</small></div><button aria-label="Profile menu">•••</button></div>
        <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft size={17} /></button>
      </aside>
      <div className="admin-stage">
        <header className="admin-topbar glass-bar"><button className="icon-button mobile-admin-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><button className="command-trigger" onClick={() => setCommandOpen(true)}><Search size={16} /><span>Search anything…</span><kbd><Command size={11} /> K</kbd></button><div className="topbar-actions"><Link href="/" className="view-store">View store ↗</Link><button className="icon-button" onClick={toggleTheme}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button notification-button"><Bell size={18} /><i /></button></div></header>
        <main id="admin-main" className="admin-main">{children}</main>
      </div>
      {commandOpen && <div className="command-modal" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={() => setCommandOpen(false)}><div className="command-box glass-overlay" onMouseDown={(event) => event.stopPropagation()}><div><Search size={18} /><input autoFocus placeholder="Search orders, products, customers…" /><kbd>esc</kbd></div><p>Quick navigation</p>{links.slice(0,6).map(({ href,label,icon:Icon }) => <Link key={href} href={href} onClick={() => setCommandOpen(false)}><Icon size={17} />{label}<span>Open ↗</span></Link>)}</div></div>}
    </div>
  );
}
