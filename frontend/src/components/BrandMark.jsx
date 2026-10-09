import React, { useId } from 'react';

// US.ClaimBack mark: a runner in motion with a flowing ribbon trailing behind
// (moving fast to get your money back). Gradient colours come from CSS variables
// so the same mark works on dark and light surfaces:
//   --bm-c1 / --bm-c2 / --bm-c3   gradient stops, tail -> head
export default function BrandMark({ size = 36 }) {
  // Each instance gets its own gradient so per-surface CSS variables resolve correctly
  const gid = `bm${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="14 12 160 168" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="28" y1="172" x2="166" y2="30">
            <stop offset="0" className="bm-s1" />
            <stop offset=".55" className="bm-s2" />
            <stop offset="1" className="bm-s3" />
          </linearGradient>
        </defs>
        <g fill="none" stroke={`url(#${gid})`} strokeLinecap="round" strokeLinejoin="round">
          <path d="M121 60 C124 82 112 100 101 114 C116 120 128 134 127 152 C126 160 132 166 143 167" strokeWidth="13" />
          <path d="M99 116 C82 124 66 138 52 138 C44 138 38 144 36 152" strokeWidth="11" />
          <path d="M118 67 C133 69 147 61 161 47" strokeWidth="9" />
        </g>
        <circle cx="128" cy="34" r="14.5" fill={`url(#${gid})`} />
        <path
          d="M113 62 C92 52 62 58 34 82 C27 88 22 95 20 103 C42 90 64 90 82 98 C98 105 108 94 114 78 Z"
          fill={`url(#${gid})`}
        />
        <path
          d="M112 84 C96 84 78 92 62 108 C54 116 46 120 38 120 C46 128 60 128 72 122 C88 114 102 104 110 94 Z"
          fill={`url(#${gid})`}
        />
      </svg>
    </span>
  );
}

// Stacked logo: the mark above the uppercase name (used where there is room, e.g. footer)
export function BrandLockup({ markSize = 84 }) {
  return (
    <div className="brand-lockup">
      <BrandMark size={markSize} />
      <div className="brand-lockup-name">
        US.<span>CLAIMBACK</span>
      </div>
    </div>
  );
}
