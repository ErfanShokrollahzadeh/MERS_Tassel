import { api, queryString } from './apiClient';
import type { BlogComment,BlogCommentStatus,BlogPage,BlogPostDetail,BlogPostInput,BlogPostSummary,BlogQuery } from '@/types/blog';
export const blogKeys={all:['blog'] as const,featured:()=>['blog','featured'] as const,list:(q:BlogQuery)=>['blog','list',q] as const,detail:(s:string)=>['blog',s] as const,admin:['admin','blog'] as const,comments:(s?:BlogCommentStatus)=>['admin','blog','comments',s] as const};
export const fetchBlogPosts=(q:BlogQuery={})=>api.get<BlogPage>(`/blog${queryString(q)}`);
export const fetchFeaturedPosts=()=>api.get<BlogPostSummary[]>('/blog/featured');
export const fetchBlogPostBySlug=(slug:string)=>api.get<BlogPostDetail>(`/blog/${encodeURIComponent(slug)}`);
export const postBlogComment=(slug:string,input:{authorName:string;authorEmail:string;content:string})=>api.post<BlogComment>(`/blog/${encodeURIComponent(slug)}/comments`,input,{auth:true});
export const fetchAdminPosts=()=>api.get<BlogPostSummary[]>('/admin/blog',{auth:true,cache:'no-store'});
export const fetchAdminPost=(id:number)=>api.get<BlogPostDetail>(`/admin/blog/${id}`,{auth:true});
export const fetchAdminComments=(status?:BlogCommentStatus)=>api.get<BlogComment[]>(`/admin/blog/comments${queryString({status})}`,{auth:true});
export const moderateComment=(id:number,status:BlogCommentStatus)=>api.patch<BlogComment>(`/admin/blog/comments/${id}`,{status},{auth:true});
export const deleteComment=(id:number)=>api.delete<void>(`/admin/blog/comments/${id}`,{auth:true});
export const deletePost=(id:number)=>api.delete<void>(`/admin/blog/${id}`,{auth:true});
export function savePost(input:BlogPostInput,cover:File|null,id?:number){const f=new FormData();Object.entries(input).forEach(([k,v])=>{if(v!==undefined)f.append(k,String(v));});if(cover)f.append('coverImage',cover);return id?api.putForm<BlogPostDetail>(`/admin/blog/${id}`,f,{auth:true}):api.postForm<BlogPostDetail>('/admin/blog',f,{auth:true});}
