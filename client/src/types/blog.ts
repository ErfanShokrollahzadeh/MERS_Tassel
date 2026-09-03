import type { Paged } from '@/lib/apiClient';

export type BlogCommentStatus = 0 | 1 | 2;

export type BlogComment = {
  id: number;
  postId: number;
  postTitle: string;
  authorName: string;
  content: string;
  status: BlogCommentStatus;
  createdAt: string;
};

export type BlogPostSummary = {
  id: number;
  title: string;
  titleTr?: string | null;
  slug: string;
  excerpt: string;
  excerptTr?: string | null;
  coverImagePath?: string | null;
  authorName: string;
  category: string;
  tags?: string | null;
  readingTimeMinutes: number;
  isPublished: boolean;
  publishedAt: string;
  commentsCount: number;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string;
  contentTr?: string | null;
  authorAvatarPath?: string | null;
  comments: BlogComment[];
};

export type BlogQuery = {
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type BlogPage = Paged<BlogPostSummary>;

export type BlogPostInput = {
  title: string;
  titleTr?: string;
  slug: string;
  excerpt: string;
  excerptTr?: string;
  content: string;
  contentTr?: string;
  authorName: string;
  category: string;
  tags?: string;
  readingTimeMinutes: number;
  isPublished: boolean;
  publishedAt?: string;
  removeCoverImage?: boolean;
};
