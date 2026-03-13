import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

const PARTICLE_OFFSETS = [0, 0.33, 0.66];
const PARTICLE_COLOR = '#38bdf8';
const EDGE_COLOR = 'rgba(56, 189, 248, 0.4)';
const DURATION = 2.5;

function AnimatedFlowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <g className="react-flow__edge-group">
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: EDGE_COLOR,
          strokeWidth: 2,
        }}
      />
      {PARTICLE_OFFSETS.map((offset) => (
        <circle key={`${id}-particle-${offset}`} r="4" fill={PARTICLE_COLOR}>
          <animateMotion
            dur={`${DURATION}s`}
            repeatCount="indefinite"
            path={edgePath}
            begin={`${offset}s`}
          />
        </circle>
      ))}
    </g>
  );
}

export const AnimatedFlowEdge = memo(AnimatedFlowEdgeComponent);
