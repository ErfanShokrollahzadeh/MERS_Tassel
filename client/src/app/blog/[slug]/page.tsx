import type {Metadata} from 'next';import {ArticlePage} from './ArticlePage';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;return {title:`${slug.replaceAll('-',' ')} | MERS Journal`}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <ArticlePage slug={slug}/>}
