import React, { useEffect, useRef, useState } from 'react';

// Returns [ref, visible]; flips to true once the element scrolls into view.
export function useInView(options = { threshold: 0.18 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, visible];
}

// Fade-and-rise wrapper; `delay` staggers siblings (ms).
export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const [ref, visible] = useInView();
  const [settled, setSettled] = useState(false);

  // Once the entrance has played, drop the stagger delay so hover transitions stay snappy.
  useEffect(() => {
    if (!visible) return undefined;
    const id = setTimeout(() => setSettled(true), delay + 900);
    return () => clearTimeout(id);
  }, [visible, delay]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${settled ? 0 : delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Odometer-style number: every digit rolls up its own 0-9 strip when scrolled into view.
export function RollingNumber({ value, className = '' }) {
  const [ref, visible] = useInView({ threshold: 0.4 });
  const chars = String(value).split('');
  let digitIndex = 0;

  return (
    <span ref={ref} className={`roll-number ${className}`.trim()} aria-label={String(value)}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return <span key={i} aria-hidden="true">{ch}</span>;
        }
        const target = Number(ch);
        const delay = digitIndex * 90;
        digitIndex += 1;
        return (
          <span key={i} className="roll-digit" aria-hidden="true">
            <span
              className="roll-digit-strip"
              style={{
                transform: `translateY(${visible ? -target * 1.15 : 0}em)`,
                '--roll-delay': `${delay}ms`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
