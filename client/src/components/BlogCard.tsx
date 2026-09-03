'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import type { BlogPostSummary } from '@/types/blog';
export function BlogCard({post}:{post:BlogPostSummary}) { const {locale}=useI18n(); const title=locale==='tr'&&post.titleTr?post.titleTr:post.title; const excerpt=locale==='tr'&&post.excerptTr?post.excerptTr:post.excerpt; return <article className="blog-card"><Link className="blog-card__image" href={`/blog/${post.slug}`}>{post.coverImagePath?<MediaImage src={post.coverImagePath} alt={title} sizes="(max-width: 800px) 100vw, 33vw"/>:<span className="blog-card__placeholder"/>}<span>{post.category}</span></Link><div className="blog-card__copy"><time>{new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(post.publishedAt))}</time><h3><Link href={`/blog/${post.slug}`}>{title}</Link></h3><p>{excerpt}</p><footer><span>{post.readingTimeMinutes} min read</span><Link href={`/blog/${post.slug}`} aria-label={title}><ArrowUpRight size={18}/></Link></footer></div></article> }
