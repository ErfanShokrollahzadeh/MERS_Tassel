'use client';

import Link from 'next/link';
import { useState, type PointerEvent, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

export function MagneticLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const move = (event: PointerEvent<HTMLAnchorElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const box = event.currentTarget.getBoundingClientRect();
    setOffset({ x: (event.clientX - box.left - box.width / 2) * .16, y: (event.clientY - box.top - box.height / 2) * .2 });
  };
  return <Link href={href} className={`${className} magnetic-link`} onPointerMove={move} onPointerLeave={() => setOffset({ x: 0, y: 0 })} style={{ transform: `translate3d(${offset.x}px,${offset.y}px,0)` }}>{children}</Link>;
}
