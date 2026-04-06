import { memo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ArchitectureNodeData } from '../../types/architecture';

const STYLE: Record<string, { ring: string; ringBg: string; icon: React.ReactNode }> = {
  ui: {
    ring: '#f472b6',
    ringBg: 'rgba(244,114,182,0.08)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    ),
  },
  service: {
    ring: '#34d399',
    ringBg: 'rgba(52,211,153,0.08)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  database: {
    ring: '#60a5fa',
    ringBg: 'rgba(96,165,250,0.08)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
  queue: {
    ring: '#fbbf24',
    ringBg: 'rgba(251,191,36,0.08)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
};

function DatadogNodeComponent({ data, selected }: NodeProps<ArchitectureNodeData & Record<string, unknown>>) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const style = STYLE[data.type] ?? STYLE.service;

  // Track mouse position globally while hovered
  useEffect(() => {
    if (!isHovered) return;
    const handler = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [isHovered]);

  const handleStyle = (visible: boolean): React.CSSProperties => ({
    width: 10,
    height: 10,
    background: visible ? style.ring : 'transparent',
    border: visible ? `2px solid #0d0d1a` : 'none',
    borderRadius: '50%',
    opacity: visible ? 0.9 : 0,
    transition: 'opacity 0.15s ease, background 0.15s ease',
    zIndex: 10,
  });

  return (
    <>
      <Handle type="target" position={Position.Top} style={handleStyle(isHovered)} />
      <Handle type="target" position={Position.Left} style={handleStyle(isHovered)} />
      <Handle type="source" position={Position.Right} style={handleStyle(isHovered)} />

      <div
        ref={nodeRef}
        className="relative flex flex-col items-center"
        onMouseEnter={(e) => {
          setIsHovered(true);
          setMousePos({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Outer glow ring on select */}
        <div
          className="relative flex items-center justify-center transition-all duration-300"
          style={{
            width: 56,
            height: 56,
          }}
        >
          {/* Glow background */}
          {selected && (
            <div
              className="absolute inset-[-8px] rounded-full animate-pulse"
              style={{ background: `${style.ring}15` }}
            />
          )}

          {/* Dark circle */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-200"
            style={{
              background: '#1a1a2e',
              boxShadow: selected
                ? `0 0 20px ${style.ring}30, inset 0 0 12px ${style.ring}10`
                : isHovered
                  ? `0 0 12px ${style.ring}15`
                  : 'none',
            }}
          />

          {/* Colored ring */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-200"
            style={{
              border: `2.5px solid ${selected ? style.ring : isHovered ? style.ring : `${style.ring}90`}`,
            }}
          />

          {/* Inner ring */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 5,
              border: `0.5px solid ${style.ring}25`,
            }}
          />

          {/* Icon */}
          <div className="relative z-10" style={{ color: style.ring }}>
            {style.icon}
          </div>
        </div>

        {/* Label */}
        <div className="mt-2 text-[11px] font-medium text-slate-400 text-center max-w-[100px] truncate">
          {data.label}
        </div>

        {/* Floating tooltip card — follows mouse, rendered via portal */}
        {isHovered && data.description && createPortal(
          <div
            className="fixed z-[9999] pointer-events-none px-4 py-3 rounded-lg text-xs text-slate-300 shadow-2xl max-w-[240px]"
            style={{
              left: mousePos.x + 16,
              top: mousePos.y - 8,
              background: 'rgba(13,13,26,0.95)',
              border: `1px solid ${style.ring}40`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="font-semibold mb-1 text-sm" style={{ color: style.ring }}>{data.label}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">{data.type}</div>
            <div className="text-slate-400 leading-relaxed">{data.description}</div>
          </div>,
          document.body
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={handleStyle(isHovered)} />
    </>
  );
}

export const DatadogNode = memo(DatadogNodeComponent);
