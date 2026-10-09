// 站点的字标和圆环标记：页面用 Wordmark 画站名（size 是高度，单位像素），RingMark 是小标记，转起来就是加载动画。
// Wordmark 前面的图标就是 LogoMark：和 favicon.ico、icon.png、apple-icon.png 用同一张图（site/brand/logo.svg 内联在这里），
// 所以浏览器标签、手机桌面图标和网页左上角看到的是同一个标志。改了 logo.svg 要同步改这里（底色、形状和配色都跟着品牌走）。
import { useId } from "react";
import { SITE } from "../site.ts";

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  return (
    <span className={`inline-flex items-center font-black leading-none tracking-[-0.03em] ${className}`} style={{ fontSize: Math.round(size * 0.92) }} aria-label={title} role="img">
      <LogoMark className="mr-[0.3em] size-[1em] shrink-0" />
      <span aria-hidden="true">{SITE.name}</span>
    </span>
  );
}

/** The site's logo: the network behind the bolt, on the dark tile. Same picture as the icons at the site root. */
export function LogoMark({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17242c" />
          <stop offset="1" stopColor="#0a1115" />
        </linearGradient>
        <linearGradient id={`${id}-bolt`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#7bf7e0" />
          <stop offset="0.5" stopColor="#2ce2e8" />
          <stop offset="1" stopColor="#1494b8" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="116" fill={`url(#${id}-bg)`} />

      {/* 电网：输电线与变电站，闪电经过的地方断开，让闪电始终是主体 */}
      <g stroke="#2ce2e8" strokeOpacity="0.32" strokeWidth="11" strokeLinecap="round" fill="none">
        <path d="M96 156 H176" />
        <path d="M336 156 H416" />
        <path d="M96 356 H176" />
        <path d="M336 356 H416" />
        <path d="M96 156 V356" />
        <path d="M416 156 V356" />
      </g>
      <g fill="#2ce2e8" fillOpacity="0.5">
        <circle cx="96" cy="156" r="16" />
        <circle cx="416" cy="156" r="16" />
        <circle cx="96" cy="356" r="16" />
        <circle cx="416" cy="356" r="16" />
      </g>

      {/* 闪电，压在电网中央 */}
      <path fill={`url(#${id}-bolt)`} d="M296 84 L156 286 h76 l-20 142 156 -220 h-90 z" />
    </svg>
  );
}

/** A ring with a dot; spinning, it is the loader. */
export function RingMark({ className = "", spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g style={spinning ? { transformOrigin: "12px 12px", animation: "spin-slow 1.1s linear infinite" } : undefined}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="42 15" />
      </g>
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}
