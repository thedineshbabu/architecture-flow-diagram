import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

const EDGE_COLOR = 'rgba(100, 116, 139, 0.25)';
const ACTIVE_EDGE_COLOR = 'rgba(180, 195, 220, 0.6)';

const SEQ_COLORS = [
  '#60a5fa', '#34d399', '#fbbf24', '#f472b6',
  '#a78bfa', '#fb923c', '#22d3ee', '#e879f9',
];

function AnimatedFlowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps) {
  const curvature = (data?.curvature as number | undefined) ?? 0;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offsetX = (-dy / len) * curvature * 80;
  const offsetY = (dx / len) * curvature * 80;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: curvature !== 0 ? Math.abs(curvature) * 1.5 : 0.25,
    ...(curvature !== 0 && {
      sourceControlX: sourceX + offsetX + dx * 0.25,
      sourceControlY: sourceY + offsetY + dy * 0.25,
      targetControlX: targetX + offsetX - dx * 0.25,
      targetControlY: targetY + offsetY - dy * 0.25,
    }),
  });

  const isHighlighted = data?.highlighted as boolean | undefined;
  const isDimmed = data?.dimmed as boolean | undefined;
  const flowDirection = (data?.flowDirection as string | undefined) ?? 'unidirectional';
  const isBidirectional = flowDirection === 'bidirectional';
  const sequence = data?.sequence as number | undefined;
  const label = data?.label as string | undefined;
  const showLabels = data?.showLabels as boolean | undefined;

  const strokeColor = isDimmed ? 'rgba(50, 50, 70, 0.08)' : isHighlighted ? ACTIVE_EDGE_COLOR : EDGE_COLOR;
  const strokeWidth = isHighlighted ? 1.8 : selected ? 2 : 1;

  const seqDelay = sequence != null ? `${(sequence - 1) * 0.6}s` : '0s';
  const seqColor = sequence != null ? SEQ_COLORS[(sequence - 1) % SEQ_COLORS.length] : ACTIVE_EDGE_COLOR;

  // Sequence badge position near source
  const badgeX = sourceX + (targetX - sourceX) * 0.15 + offsetX * 0.3;
  const badgeY = sourceY + (targetY - sourceY) * 0.15 + offsetY * 0.3;

  // Arrow positions for endpoints
  const arrowSize = 6;
  // Target arrow — at ~90% along the line
  const tArrX = sourceX + dx * 0.88 + offsetX * 0.12;
  const tArrY = sourceY + dy * 0.88 + offsetY * 0.12;
  // Source arrow — at ~12% along the line (for bidirectional)
  const sArrX = sourceX + dx * 0.12 + offsetX * 0.88;
  const sArrY = sourceY + dy * 0.12 + offsetY * 0.88;
  // Angle from source to target
  const angle = Math.atan2(dy + offsetY, dx + offsetX);
  const angleDeg = (angle * 180) / Math.PI;

  // Unique marker IDs per edge
  const markerId = `arrow-${id}`;
  const markerIdReverse = `arrow-rev-${id}`;

  return (
    <g className="react-flow__edge-group">
      {/* SVG marker definitions for arrowheads */}
      <defs>
        {/* Forward arrow (target end) */}
        <marker
          id={markerId}
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={arrowSize - 1}
          refY={arrowSize / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M0,0 L${arrowSize},${arrowSize / 2} L0,${arrowSize} Z`}
            fill={isHighlighted ? seqColor : selected ? '#f87171' : strokeColor}
            opacity={isDimmed ? 0.3 : isHighlighted ? 0.9 : 0.6}
          />
        </marker>
        {/* Reverse arrow (source end) — for bidirectional */}
        {isBidirectional && (
          <marker
            id={markerIdReverse}
            markerWidth={arrowSize}
            markerHeight={arrowSize}
            refX={1}
            refY={arrowSize / 2}
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path
              d={`M${arrowSize},0 L0,${arrowSize / 2} L${arrowSize},${arrowSize} Z`}
              fill={isHighlighted ? seqColor : selected ? '#f87171' : strokeColor}
              opacity={isDimmed ? 0.3 : isHighlighted ? 0.9 : 0.6}
            />
          </marker>
        )}
      </defs>

      {/* Base edge — solid for default state */}
      {!isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke={selected ? '#f87171' : strokeColor}
          strokeWidth={strokeWidth}
          opacity={isDimmed ? 0.3 : 0.6}
          markerEnd={`url(#${markerId})`}
          markerStart={isBidirectional ? `url(#${markerIdReverse})` : undefined}
        />
      )}

      {/* Highlighted state — single animated dash with arrowheads */}
      {isHighlighted && (
        <>
          {/* Faint solid underlay */}
          <path
            d={edgePath}
            fill="none"
            stroke={seqColor}
            strokeWidth={1}
            opacity={0.1}
          />

          {/* Animated dashes — same style for both uni and bi */}
          <path
            d={edgePath}
            fill="none"
            stroke={seqColor}
            strokeWidth={1.8}
            strokeDasharray="8 5"
            markerEnd={`url(#${markerId})`}
            markerStart={isBidirectional ? `url(#${markerIdReverse})` : undefined}
            opacity={0}
          >
            <animate
              attributeName="opacity"
              from="0"
              to="0.85"
              begin={seqDelay}
              dur="0.3s"
              fill="freeze"
            />
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-26"
              begin={seqDelay}
              dur="1s"
              repeatCount="indefinite"
            />
          </path>

          {/* Bidirectional: subtle pulsing glow on the line to hint at two-way */}
          {isBidirectional && (
            <path
              d={edgePath}
              fill="none"
              stroke={seqColor}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0}
            >
              <animate
                attributeName="opacity"
                values="0;0.15;0"
                begin={seqDelay}
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          )}
        </>
      )}

      {/* Sequence badge near source */}
      {isHighlighted && sequence != null && (
        <g transform={`translate(${badgeX}, ${badgeY})`} opacity={0}>
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            begin={seqDelay}
            dur="0.3s"
            fill="freeze"
          />
          <circle r="10" fill={seqColor} opacity={0.9} />
          <circle r="10" fill="none" stroke="#0d0d1a" strokeWidth={1.5} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0d0d1a"
            fontSize={10}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={700}
          >
            {sequence}
          </text>
        </g>
      )}

      {/* Edge label */}
      {isHighlighted && label && (
        <g transform={`translate(${labelX}, ${labelY})`} opacity={0}>
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            begin={seqDelay}
            dur="0.3s"
            fill="freeze"
          />
          <rect
            x={-44}
            y={-11}
            width={88}
            height={22}
            rx={4}
            fill="rgba(13,13,26,0.92)"
            stroke={`${seqColor}40`}
            strokeWidth={0.5}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#c8d2e6"
            fontSize={9}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      )}

      {/* Always-visible label when showLabels is on (and not already shown by highlight) */}
      {!isHighlighted && !isDimmed && showLabels && label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-44}
            y={-11}
            width={88}
            height={22}
            rx={4}
            fill="rgba(13,13,26,0.85)"
            stroke="rgba(100,116,139,0.2)"
            strokeWidth={0.5}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(148,163,184,0.7)"
            fontSize={9}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={500}
          >
            {label}
          </text>
        </g>
      )}

      {/* Default state: sequence badge */}
      {!isHighlighted && !isDimmed && sequence != null && (
        <g transform={`translate(${badgeX}, ${badgeY})`}>
          <circle r="7" fill="rgba(13,13,26,0.8)" stroke="rgba(148,163,184,0.3)" strokeWidth={0.5} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(148,163,184,0.6)"
            fontSize={8}
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight={600}
          >
            {sequence}
          </text>
        </g>
      )}
    </g>
  );
}

export const AnimatedFlowEdge = memo(AnimatedFlowEdgeComponent);
