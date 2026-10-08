import React from 'react';
import { ShieldCheck } from 'lucide-react';

// Lime tile + shield mark, used in the navbar, drawer and footer.
export default function BrandMark({ size = 36 }) {
  return (
    <span
      className="brand-mark"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <ShieldCheck size={Math.round(size * 0.58)} strokeWidth={2.4} />
    </span>
  );
}
