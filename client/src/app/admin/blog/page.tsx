'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pen, Plus, Trash2, X } from 'lucide-react';
import { mediaUrl } from '@/lib/apiClient';
import {
  adminBlogKeys,
  blogKeys,
  deleteBlogComment,
  deleteBlogPost,
  fetchAdminComments,
  fetchAdminPosts,
  moderateBlogComment,
} from '@/lib/blog';
import { useToastStore } from '@/stores/toast';
import type { BlogCommentStatus } from '@/types/blog';

type AdminAction =
  | { kind: 'delete-post'; id: number; title: string }
  | { kind: 'delete-comment'; id: number }
  | { kind: 'moderate'; id: number; status: BlogCommentStatus };

const commentFilters: { label: string; value?: BlogCommentStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All' },
];

export default function AdminBlog() {
  const [tab, setTab] = useState<'posts' | 'comments'>('posts');
  const [status, setStatus] = useState<BlogCommentStatus | undefined>('pending');
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const posts = useQuery({
    queryKey: adminBlogKeys.posts(),
    queryFn: fetchAdminPosts,
    enabled: tab === 'posts',
  });
  const comments = useQuery({
    queryKey: adminBlogKeys.comments(status),
    queryFn: () => fetchAdminComments(status),
    enabled: tab === 'comments',
  });
  const action = useMutation({
    mutationFn: async (item: AdminAction) => {
      if (item.kind === 'delete-post') await deleteBlogPost(item.id);
      else if (item.kind === 'delete-comment') await deleteBlogComment(item.id);
      else await moderateBlogComment(item.id, item.status);
    },
    onSuccess: async (_, item) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminBlogKeys.all }),
        queryClient.invalidateQueries({ queryKey: blogKeys.all }),
      ]);
      showToast({
        tone: 'success',
        title: item.kind === 'delete-post'
          ? 'Story removed'
          : item.kind === 'delete-comment'
            ? 'Comment deleted'
            : item.status === 'approved' ? 'Comment approved' : 'Comment rejected',
      });
    },
    onError: (error) => showToast({
      tone: 'error',
      title: 'Journal action failed',
      message: error instanceof Error ? error.message : '',
    }),
  });

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="eyebrow">Editorial studio</span>
          <h1>Journal & Stories</h1>
          <p>Publish atelier stories and cultivate thoughtful conversation.</p>
        </div>
        <Link className="admin-button admin-button--primary" href="/admin/blog/new"><Plus size={16} /> New Story</Link>
      </header>

      <div className="admin-tabs" role="tablist" aria-label="Journal workspace">
        <button type="button" role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Articles</button>
        <button type="button" role="tab" aria-selected={tab === 'comments'} className={tab === 'comments' ? 'active' : ''} onClick={() => setTab('comments')}>Comment Moderation</button>
      </div>

      {tab === 'posts' ? (
        <section className="admin-card admin-table-wrap" role="tabpanel">
          {posts.isPending && <p className="admin-empty">Loading stories…</p>}
          {posts.isError && <p className="admin-empty form-error">Stories could not be loaded.</p>}
          {posts.data?.length === 0 && <p className="admin-empty">No stories yet. Create the first atelier note.</p>}
          {posts.data && posts.data.length > 0 && (
            <table className="admin-table">
              <thead><tr><th>Cover</th><th>Title</th><th>Category</th><th>Comments</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {posts.data.map((post) => (
                  <tr key={post.id}>
                    <td>{post.coverImagePath ? <img className="admin-blog-thumb" src={mediaUrl(post.coverImagePath)} alt="" /> : <span className="admin-blog-thumb admin-blog-thumb--empty" />}</td>
                    <td><strong>{post.title}</strong></td>
                    <td>{post.category}</td>
                    <td>{post.comments.length}</td>
                    <td><span className={`status-pill ${post.isPublished ? 'status-pill--success' : ''}`}>{post.isPublished ? 'Published' : 'Draft'}</span></td>
                    <td>{new Date(post.publishedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/admin/blog/${post.id}`} aria-label={`Edit ${post.title}`}><Pen size={16} /></Link>
                        <button
                          type="button"
                          aria-label={`Delete ${post.title}`}
                          disabled={action.isPending}
                          onClick={() => window.confirm(`Delete “${post.title}”?`) && action.mutate({ kind: 'delete-post', id: post.id, title: post.title })}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : (
        <section role="tabpanel">
          <div className="admin-filter-row" role="group" aria-label="Comment status">
            {commentFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                className={status === filter.value ? 'active' : ''}
                aria-pressed={status === filter.value}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {comments.isPending && <p className="admin-empty">Loading comments…</p>}
          {comments.isError && <p className="admin-empty form-error">Comments could not be loaded.</p>}
          {comments.data?.length === 0 && <p className="admin-empty">No comments in this view.</p>}
          <div className="moderation-list">
            {comments.data?.map((item) => (
              <article className="admin-card moderation-card" key={item.id}>
                <header>
                  <div><strong>{item.authorName}</strong><span> on {item.postTitle}</span></div>
                  <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
                </header>
                <p>{item.content}</p>
                <footer>
                  <button type="button" disabled={action.isPending || item.status === 'approved'} onClick={() => action.mutate({ kind: 'moderate', id: item.id, status: 'approved' })}><Check size={15} /> Approve</button>
                  <button type="button" disabled={action.isPending || item.status === 'rejected'} onClick={() => action.mutate({ kind: 'moderate', id: item.id, status: 'rejected' })}><X size={15} /> Reject</button>
                  <button type="button" disabled={action.isPending} onClick={() => window.confirm('Permanently delete this comment?') && action.mutate({ kind: 'delete-comment', id: item.id })}><Trash2 size={15} /> Delete</button>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
