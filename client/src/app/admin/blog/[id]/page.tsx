'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminPost } from '@/lib/blog';
import { BlogPostEditor } from '@/components/admin/BlogPostEditor';

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const q = useQuery({
    queryKey: ['admin', 'blog', id],
    queryFn: () => fetchAdminPost(Number(id)),
  });

  if (q.isPending) return <p className="admin-empty">Opening story…</p>;
  if (q.isError) return <p className="admin-empty form-error">{q.error.message}</p>;
  return <BlogPostEditor post={q.data} />;
}
