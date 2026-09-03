import { api, queryString } from '@/lib/apiClient';
import type {
  BlogComment,
  BlogCommentStatus,
  BlogPage,
  BlogPostDetail,
  BlogPostInput,
  BlogPostSummary,
  BlogQuery,
} from '@/types/blog';

export const blogKeys = {
  all: ['blog'] as const,
  featured: () => ['blog', 'featured'] as const,
  list: (query: BlogQuery) => ['blog', 'list', query] as const,
  detail: (slug: string) => ['blog', 'detail', slug] as const,
};

export const adminBlogKeys = {
  all: ['admin', 'blog'] as const,
  posts: () => ['admin', 'blog', 'posts'] as const,
  post: (id: number) => ['admin', 'blog', 'posts', id] as const,
  comments: (status?: BlogCommentStatus) => ['admin', 'blog', 'comments', status ?? 'all'] as const,
};

export const fetchBlogPosts = (query: BlogQuery = {}) =>
  api.get<BlogPage>(`/blog${queryString(query)}`);

export const fetchFeaturedPosts = () =>
  api.get<BlogPostSummary[]>('/blog/featured');

export const fetchBlogPostBySlug = (slug: string) =>
  api.get<BlogPostDetail>(`/blog/${encodeURIComponent(slug)}`);

export const postBlogComment = (slug: string, input: { authorName: string; authorEmail: string; content: string }) =>
  api.post<BlogComment>(`/blog/${encodeURIComponent(slug)}/comments`, input);

export const fetchAdminPosts = () =>
  api.get<BlogPostDetail[]>('/admin/blog', { auth: true, cache: 'no-store' });

export const fetchAdminPost = (id: number) =>
  api.get<BlogPostDetail>(`/admin/blog/${id}`, { auth: true, cache: 'no-store' });

export const fetchAdminComments = (status?: BlogCommentStatus) =>
  api.get<BlogComment[]>(`/admin/blog/comments/all${queryString({ status })}`, { auth: true, cache: 'no-store' });

export const createBlogPost = (input: BlogPostInput) =>
  api.post<BlogPostDetail>('/admin/blog', input, { auth: true });

export const updateBlogPost = (id: number, input: BlogPostInput) =>
  api.put<BlogPostDetail>(`/admin/blog/${id}`, input, { auth: true });

export const deleteBlogPost = (id: number) =>
  api.delete<void>(`/admin/blog/${id}`, { auth: true });

export const moderateBlogComment = (id: number, status: BlogCommentStatus) =>
  api.patch<BlogComment>(`/admin/blog/comments/${id}`, { status }, { auth: true });

export const deleteBlogComment = (id: number) =>
  api.delete<void>(`/admin/blog/comments/${id}`, { auth: true });

export const uploadBlogCover = (file: File) => {
  const form = new FormData();
  form.append('cover', file);
  return api.postForm<string>('/admin/blog/cover', form, { auth: true });
};
