'use client';

import { useEffect, useState } from 'react';
import { Clock3, Search, ShieldCheck, X } from 'lucide-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys, fetchAdminUsers, updateUserRole } from '@/lib/admin';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import { useAuthStore } from '@/stores/auth';

const PAGE_SIZE = 15;
const ROLES = ['Admin', 'Staff', 'Customer'] as const;
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debounced]);

  const query = { search: debounced || undefined, page, pageSize: PAGE_SIZE };

  const users = useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => fetchAdminUsers(query),
    placeholderData: keepPreviousData,
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: (typeof ROLES)[number] }) => updateUserRole(id, role),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast({ tone: 'success', title: 'Role updated', message: `${user.email} is now ${user.role}.` });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not change the role', message: error instanceof Error ? error.message : '' }),
  });

  const result = users.data;
  const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">Access control</span><h1>People &amp; roles</h1><p>Everyone with an account, and the access each of them holds.</p></div>
      </div>

      <section className="role-legend">
        {ROLES.map((role) => (
          <article className="admin-card" key={role}>
            <ShieldCheck size={17} />
            <div>
              <strong>{role}</strong>
              <small>
                {role === 'Admin' ? 'Full access to this workspace.' : role === 'Staff' ? 'Signed-in account, no workspace access yet.' : 'Storefront shopper.'}
              </small>
            </div>
          </article>
        ))}
      </section>

      <div className="admin-card table-card">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" />
            {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
          </label>
        </div>

        {users.isPending && <TableSkeleton rows={8} columns={5} />}
        {users.isError && <ErrorState error={users.error} onRetry={() => users.refetch()} />}

        {result && (result.items.length ? (
          <>
            <div className="admin-table admin-table--large">
              <table>
                <thead><tr><th>Person</th><th>Joined</th><th>Orders</th><th>Lifetime spend</th><th>Role</th></tr></thead>
                <tbody>
                  {result.items.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="customer-cell">
                            <span>{`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || '—'}</span>
                            <section><strong>{user.firstName} {user.lastName}{isSelf && <em className="self-badge">you</em>}</strong><small>{user.email}</small></section>
                          </div>
                        </td>
                        <td><time><Clock3 size={13} /> {dateFormat.format(new Date(user.dateJoined))}</time></td>
                        <td>{user.orderCount}</td>
                        <td>{money(user.lifetimeSpend)}</td>
                        <td>
                          <label className="status-select">
                            <select
                              value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              onChange={(event) => changeRole.mutate({ id: user.id, role: event.target.value as (typeof ROLES)[number] })}
                              disabled={changeRole.isPending}
                              aria-label={`Role for ${user.email}`}
                            >
                              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {result.items.length} of {result.total} people</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                {Array.from({ length: result.totalPages }).map((_, index) => (
                  <button key={index} className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>
                ))}
                <button disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="Nobody matches that search" message="Try a different name or email address." />
        ))}
      </div>
    </>
  );
}
