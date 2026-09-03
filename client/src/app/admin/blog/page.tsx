'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Check, FileText, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/DataStates';
import {
  blogKeys,
  deleteComment,
  deletePost,
  fetchAdminComments,
  fetchAdminPosts,
  moderateComment,
} from '@/lib/blog';
import { mediaUrl } from '@/lib/apiClient';
import { useToastStore } from '@/stores/toast';
import type { BlogCommentStatus, BlogPostSummary } from '@/types/blog';

type Tab = 'articles' | 'comments';
const commentFilters: Array<{ label: string; value: BlogCommentStatus | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 0 },
  { label: 'Approved', value: 1 },
  { label: 'Rejected', value: 2 },
];

export default function AdminBlogPage() {
  const [tab, setTab] = useState<Tab>('articles');
  const [status, setStatus] = useState<BlogCommentStatus | undefined>(0);
  const [pendingDelete, setPendingDelete] = useState<BlogPostSummary | null>(null);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  const posts = useQuery({ queryKey: blogKeys.admin, queryFn: fetchAdminPosts });
  const comments = useQuery({
    queryKey: blogKeys.comments(status),
    queryFn: () => fetchAdminComments(status),
    enabled: tab === 'comments',
  });

  const refreshComments = () => queryClient.invalidateQueries({ queryKey: ['admin', 'blog', 'comments'] });
  const moderate = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: BlogCommentStatus }) => moderateComment(id, nextStatus),
    onSuccess: (_comment, variables) => {
      void refreshComments();
      void queryClient.invalidateQueries({ queryKey: blogKeys.admin });
      showToast({ tone: 'success', title: variables.nextStatus === 1 ? 'Comment approved' : 'Comment rejected' });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not moderate comment', message: error instanceof Error ? error.message : '' }),
  });
  const removeComment = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      void refreshComments();
      showToast({ tone: 'success', title: 'Comment deleted' });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not delete comment', message: error instanceof Error ? error.message : '' }),
  });
  const removePost = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.admin });
      void queryClient.invalidateQueries({ queryKey: blogKeys.all });
      showToast({ tone: 'success', title: 'Story deleted', message: `${pendingDelete?.title ?? 'The story'} was removed.` });
      setPendingDelete(null);
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not delete story', message: error instanceof Error ? error.message : '' }),
  });

  const published = posts.data?.filter((post) => post.isPublished).length ?? 0;
  const pending = comments.data?.filter((comment) => comment.status === 0).length ?? 0;

  return (
    <>
      <div className="admin-page-heading journal-admin-heading">
        <div>
          <span className="admin-kicker">Editorial workspace</span>
          <h1>Journal &amp; Stories</h1>
          <p>Write atelier stories, publish them to the storefront, and tend to reader conversations.</p>
        </div>
        <Link className="admin-button admin-button--primary" href="/admin/blog/new">
          <Plus size={16} /> New story
        </Link>
      </div>

      <section className="journal-stats" aria-label="Journal overview">
        <div className="admin-card"><FileText /><span>All stories</span><strong>{posts.data?.length ?? '—'}</strong><small>Drafts and published</small></div>
        <div className="admin-card"><BookOpen /><span>Published</span><strong>{posts.data ? published : '—'}</strong><small>Visible in the journal</small></div>
        <div className="admin-card"><MessageCircle /><span>Pending review</span><strong>{tab === 'comments' && comments.data ? pending : '—'}</strong><small>Reader conversations</small></div>
      </section>

      <section className="admin-card journal-workspace">
        <div className="journal-tabs" role="tablist" aria-label="Journal management">
          <button role="tab" aria-selected={tab === 'articles'} className={tab === 'articles' ? 'active' : ''} onClick={() => setTab('articles')}>
            <BookOpen size={17} /> Articles
          </button>
          <button role="tab" aria-selected={tab === 'comments'} className={tab === 'comments' ? 'active' : ''} onClick={() => setTab('comments')}>
            <MessageCircle size={17} /> Comment moderation
          </button>
        </div>

        {tab === 'articles' ? (
          <div role="tabpanel">
            {posts.isPending && <TableSkeleton rows={6} columns={6} />}
            {posts.isError && <ErrorState error={posts.error} onRetry={() => posts.refetch()} />}
            {posts.data && (posts.data.length ? (
              <div className="journal-table admin-table">
                <table>
                  <thead><tr><th>Story</th><th>Category</th><th>Comments</th><th>Status</th><th>Published</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>{posts.data.map((post) => (
                    <tr key={post.id}>
                      <td data-label="Story"><div className="journal-story-cell">
                        {post.coverImagePath ? <img src={mediaUrl(post.coverImagePath)} alt="" /> : <span className="journal-story-placeholder"><BookOpen size={18} /></span>}
                        <div><strong>{post.title}</strong><small>/{post.slug}</small></div>
                      </div></td>
                      <td data-label="Category">{post.category}</td>
                      <td data-label="Comments">{post.commentsCount}</td>
                      <td data-label="Status"><span className={`status ${post.isPublished ? 'status--active' : 'status--pending'}`}>{post.isPublished ? 'Published' : 'Draft'}</span></td>
                      <td data-label="Published">{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(post.publishedAt))}</td>
                      <td><div className="row-actions">
                        <Link href={`/admin/blog/${post.id}`} title={`Edit ${post.title}`}><Pencil size={15} /></Link>
                        <button type="button" onClick={() => setPendingDelete(post)} title={`Delete ${post.title}`}><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <EmptyState title="Your journal is ready" message="Create the first atelier story and publish it to the storefront." action={<Link className="admin-button admin-button--primary" href="/admin/blog/new"><Plus size={15} /> New story</Link>} />)}
          </div>
        ) : (
          <div className="journal-comments" role="tabpanel">
            <div className="journal-comment-filters" aria-label="Filter comments">
              {commentFilters.map((filter) => <button key={filter.label} className={status === filter.value ? 'active' : ''} onClick={() => setStatus(filter.value)}>{filter.label}</button>)}
            </div>
            {comments.isPending && <TableSkeleton rows={4} columns={2} />}
            {comments.isError && <ErrorState error={comments.error} onRetry={() => comments.refetch()} />}
            {comments.data && (comments.data.length ? <div className="moderation-list">{comments.data.map((comment) => (
              <article key={comment.id}>
                <header><div><strong>{comment.authorName}</strong><span>on {comment.postTitle}</span></div><time>{new Date(comment.createdAt).toLocaleString()}</time></header>
                <p>{comment.content}</p>
                <footer>
                  {comment.status !== 1 && <button onClick={() => moderate.mutate({ id: comment.id, nextStatus: 1 })} disabled={moderate.isPending}><Check size={15} /> Approve</button>}
                  {comment.status !== 2 && <button onClick={() => moderate.mutate({ id: comment.id, nextStatus: 2 })} disabled={moderate.isPending}><X size={15} /> Reject</button>}
                  <button className="danger-text" onClick={() => removeComment.mutate(comment.id)} disabled={removeComment.isPending}><Trash2 size={15} /> Delete</button>
                </footer>
              </article>
            ))}</div> : <EmptyState title="No comments here" message="Comments matching this filter will appear here for review." />)}
          </div>
        )}
      </section>

      {pendingDelete && <div className="modal-root">
        <button className="modal-scrim" onClick={() => setPendingDelete(null)} aria-label="Close confirmation" />
        <div className="invite-modal glass-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-story-title">
          <header><div><span className="admin-kicker">Delete story</span><h2 id="delete-story-title">{pendingDelete.title}</h2></div><button className="icon-button" onClick={() => setPendingDelete(null)}><X /></button></header>
          <p>This removes the story from the storefront. This action cannot be undone from the workspace.</p>
          <div><button className="admin-button admin-button--secondary" onClick={() => setPendingDelete(null)}>Cancel</button><button className="admin-button admin-button--danger" onClick={() => removePost.mutate(pendingDelete.id)} disabled={removePost.isPending}>{removePost.isPending ? 'Deleting…' : 'Delete story'}</button></div>
        </div>
      </div>}
    </>
  );
}
