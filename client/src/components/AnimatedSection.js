'use client';

import { useEffect, useRef } from 'react';

/**
 * AnimatedSection - Wraps content with Intersection Observer for scroll reveal animations.
 * Uses CSS class toggling for smooth fade-in/slide-up on scroll.
 */
export default function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (entry.target) {
                entry.target.classList.add('revealed');
              }
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
