'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminPost } from '@/lib/blog';
import { BlogPostEditor } from './BlogPostEditor';

export function BlogEditor({ id }: { id?: number }) {
  const post = useQuery({
    queryKey: ['admin', 'blog', id],
    queryFn: () => fetchAdminPost(id!),
    enabled: id !== undefined && Number.isFinite(id),
  });

  if (id && post.isPending) return <p className="admin-empty">Opening story…</p>;
  if (id && post.isError) return <p className="admin-empty form-error">{post.error.message}</p>;

  return <BlogPostEditor post={post.data} />;
}
