
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="Askim candles Logo"
      {...props}
    >
      <style>
        {`
          .logo-text {
            font-family: var(--font-geist-sans), 'Arial', sans-serif;
            font-size: 24px;
            font-weight: 600;
            fill: hsl(var(--foreground));
          }
          .logo-highlight {
            fill: hsl(var(--accent));
          }
        `}
      </style>
      <text x="10" y="35" className="logo-text">
        Askim<tspan className="logo-highlight"> </tspan>candles
      </text>
    </svg>
  );
}
