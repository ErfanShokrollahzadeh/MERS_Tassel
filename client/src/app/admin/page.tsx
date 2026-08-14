'use client';

import Link from 'next/link';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Box, CircleDollarSign, Eye, MoreHorizontal, PackageCheck, ShoppingBag, Users } from 'lucide-react';
import { orders, products, revenueSeries } from '@/data/store';

const metrics = [
  { label: 'Net revenue', value: '$42,680', trend: '+18.4%', up: true, icon: CircleDollarSign, data: [12,15,13,19,18,24,29] },
  { label: 'Orders', value: '305', trend: '+12.1%', up: true, icon: ShoppingBag, data: [8,11,10,14,13,18,21] },
  { label: 'Conversion', value: '3.84%', trend: '+0.42%', up: true, icon: Eye, data: [7,9,8,8,11,12,14] },
  { label: 'Returning customers', value: '38.2%', trend: '-1.8%', up: false, icon: Users, data: [16,15,17,15,14,13,14] },
];

export default function AdminOverview() {
  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">Friday, 14 August</span><h1>Good morning, Derya.</h1><p>Here’s what is happening across your atelier today.</p></div><div><button className="admin-button admin-button--secondary">Export report</button><Link href="/admin/products" className="admin-button admin-button--primary">Add product</Link></div></div>
    <section className="metric-grid">{metrics.map((metric) => <article className="metric-card glass-panel" key={metric.label}><header><span>{metric.label}</span><metric.icon size={17} /></header><div className="metric-value"><strong>{metric.value}</strong><span className={metric.up ? 'trend-up' : 'trend-down'}>{metric.up ? <ArrowUpRight /> : <ArrowDownRight />}{metric.trend}</span></div><div className="metric-spark"><ResponsiveContainer width="100%" height="100%"><AreaChart data={metric.data.map((value,index) => ({ index,value }))}><defs><linearGradient id={`grad-${metric.label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--plum)" stopOpacity={.35}/><stop offset="1" stopColor="var(--plum)" stopOpacity={0}/></linearGradient></defs><Area dataKey="value" stroke="var(--plum)" fill={`url(#grad-${metric.label})`} strokeWidth={2} dot={false}/></AreaChart></ResponsiveContainer></div><small>Compared with last week</small></article>)}</section>
    <section className="dashboard-grid">
      <article className="admin-card revenue-card"><header className="card-heading"><div><span>Revenue pulse</span><h2>$42,680 <small>this week</small></h2></div><select><option>Last 7 days</option><option>Last 30 days</option></select></header><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueSeries}><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8f506f" stopOpacity={.3}/><stop offset="1" stopColor="#8f506f" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--ink-faint)'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--ink-faint)'}} tickFormatter={(v) => `$${v/1000}k`}/><Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:12,fontSize:11}}/><Area type="monotone" dataKey="revenue" stroke="#8f506f" strokeWidth={2.4} fill="url(#revenue-fill)"/></AreaChart></ResponsiveContainer></div></article>
      <article className="admin-card sales-card"><header className="card-heading"><div><span>Sales goal</span><h2>84%</h2></div><button><MoreHorizontal size={18}/></button></header><div className="goal-ring" style={{'--progress':'84%' } as React.CSSProperties}><div><strong>$42.6k</strong><span>of $50k</span></div></div><p><ArrowUpRight size={14}/> You’re $7,320 away from the August goal.</p></article>
    </section>
    <section className="dashboard-grid dashboard-grid--lower">
      <article className="admin-card recent-orders"><header className="card-heading"><div><span>Recent orders</span><h2>Latest activity</h2></div><Link href="/admin/orders">View all <ArrowRight size={14}/></Link></header><div className="admin-table"><table><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>{orders.slice(0,5).map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.date}</small></td><td>{order.customer}</td><td><span className={`status status--${order.status.toLowerCase()}`}>{order.status}</span></td><td><strong>${order.total}</strong></td></tr>)}</tbody></table></div></article>
      <article className="admin-card top-products"><header className="card-heading"><div><span>Product pulse</span><h2>Top pieces</h2></div><Link href="/admin/products">Manage <ArrowRight size={14}/></Link></header>{products.slice(0,4).map((product,index) => <div className="top-product" key={product.id}><img src={product.image} alt=""/><div><strong>{product.name}</strong><small>{124-index*19} sold · ${product.price.amount}</small></div><span>{index===0?<PackageCheck/>:<Box/>}</span></div>)}</article>
    </section>
  </>;
}
