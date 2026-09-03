import type {Metadata} from 'next';import {BlogListing} from './BlogListing';
export const metadata:Metadata={title:'Journal | MERS Tassel',description:'Stories of craftsmanship, considered materials and personal style from the MERS atelier.'};
export default function BlogPage(){return <BlogListing/>}
