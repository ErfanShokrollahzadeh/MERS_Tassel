'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, MousePointerClick, ShoppingBag, Users } from 'lucide-react';
import { ErrorState, TableSkeleton } from '@/components/DataStates';
import { adminKeys, fetchMarketing } from '@/lib/admin';
import { formatMoney } from '@/lib/money';

const money = (value: number) => formatMoney(value, 'tr');

function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return <b className={up ? 'trend-up' : 'trend-down'}>{up ? <ArrowUpRight /> : <ArrowDownRight />}{up ? '+' : ''}{value}%</b>;
}

export default function MarketingPage() {
  const marketing = useQuery({ queryKey: adminKeys.marketing(), queryFn: fetchMarketing });

  return <>
    <div className="admin-page-heading"><div><span className="admin-kicker">Growth intelligence</span><h1>Marketing pulse</h1><p>Acquisition, attribution and retention measured from live commerce activity.</p></div></div>
    {marketing.isPending && <div className="admin-card"><TableSkeleton rows={8} columns={4} /></div>}
    {marketing.isError && <ErrorState error={marketing.error} onRetry={() => marketing.refetch()} />}
    {marketing.isSuccess && (() => {
      const data = marketing.data;
      const funnelMaximum = Math.max(...data.funnel.map((step) => step.count), 1);
      const cards = [
        { label: 'Sessions', value: String(data.totalSessions), trend: data.sessionsChangePct, note: 'Distinct paid-order customers' },
        { label: 'Conversion rate', value: `${data.conversionRate}%`, trend: data.conversionChangePct, note: 'Orders per customer with a cart' },
        { label: 'Revenue', value: money(data.revenue), trend: data.revenueChangePct, note: 'Paid orders in the last 30 days' },
        { label: 'Acquisition cost / ROAS', value: `${money(data.acquisitionCost)} / ${data.roasMultiplier}×`, trend: null, note: 'Awaiting ad-spend integration' },
      ];
      return <>
        <section className="growth-kpis">{cards.map((card) => <article className="admin-card" key={card.label}><span>{card.label}</span><div><strong>{card.value}</strong>{card.trend !== null && <Trend value={card.trend} />}</div><small>{card.note}</small></article>)}</section>
        <section className="analytics-grid">
          <article className="admin-card analytics-wide"><header className="card-heading"><div><span>Revenue trend</span><h2>{money(data.revenue)} <small>last 30 days</small></h2></div></header><div className="chart-wrap chart-wrap--tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.revenueSeries}><defs><linearGradient id="marketing-revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8f506f" stopOpacity={.3} /><stop offset="1" stopColor="#8f506f" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="name" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fontSize: 10, fill: 'var(--ink-faint)' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--ink-faint)' }} tickFormatter={(value) => `${value} TL`} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 11 }} formatter={(value) => money(Number(value ?? 0))} /><Area type="monotone" dataKey="revenue" stroke="#8f506f" strokeWidth={2.4} fill="url(#marketing-revenue-fill)" /></AreaChart></ResponsiveContainer></div></article>
          <article className="admin-card"><header className="card-heading"><div><span>Commerce funnel</span><h2>Last 30 days</h2></div></header><div className="funnel-list">{data.funnel.map((step, index) => { const Icon = index === 0 ? Users : index === 1 ? MousePointerClick : index === 2 ? ShoppingBag : CircleDollarSign; return <div key={step.step}><Icon /><span>{step.step}<small>{Math.round(step.count * 100 / funnelMaximum)}% of visitors</small></span><strong>{step.count}</strong><i><b style={{ width: `${step.count * 100 / funnelMaximum}%` }} /></i></div>; })}</div></article>
        </section>
        <section className="analytics-grid analytics-grid--lower">
          <article className="admin-card"><header className="card-heading"><div><span>Attribution</span><h2>Top channels</h2></div></header><div className="admin-table"><table><thead><tr><th>Channel</th><th>Orders</th><th>Revenue</th><th>Share</th></tr></thead><tbody>{data.attribution.length ? data.attribution.map((row) => <tr key={row.channel}><td><strong>{row.channel}</strong></td><td>{row.orders}</td><td>{money(row.revenue)}</td><td>{row.sharePct}%</td></tr>) : <tr><td colSpan={4}>No paid orders in this period.</td></tr>}</tbody></table></div></article>
          <article className="admin-card"><header className="card-heading"><div><span>Retention</span><h2>Weekly cohorts</h2></div></header><div className="cohort-table"><div><span>Cohort (size)</span><span>W0</span><span>W1</span><span>W2</span><span>W3</span></div>{data.cohorts.map((cohort) => <div key={cohort.cohortWeek}><span>{cohort.cohortWeek} ({cohort.cohortSize})</span>{cohort.retentionPcts.map((pct, index) => <span key={index} style={{ background: `color-mix(in srgb, var(--plum) ${Math.max(pct, 4)}%, transparent)` }}>{pct}%</span>)}</div>)}</div></article>
        </section>
      </>;
    })()}
  </>;
}
