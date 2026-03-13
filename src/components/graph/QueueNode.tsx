import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { QueueNodeType } from '../../types/architecture';

function QueueNodeComponent({ data, selected }: NodeProps<QueueNodeType>) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border-2 !bg-slate-800 !border-amber-400" />
      <motion.div
        className={`
          relative min-w-[160px] rounded-xl px-4 py-3
          bg-slate-800/80 backdrop-blur-md border
          shadow-lg
          ${selected ? 'border-amber-400 shadow-amber-400/20' : 'border-slate-600/60'}
          ${isHovered ? 'shadow-amber-400/10 border-slate-500' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        style={{
          boxShadow: isHovered ? '0 0 24px rgba(251, 191, 36, 0.15)' : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-100 truncate">{data.label}</div>
            <div className="text-xs text-slate-400">Queue / Cache</div>
          </div>
        </div>
        {isHovered && data.description && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 px-3 py-2 rounded-lg bg-slate-900/95 border border-slate-600 text-xs text-slate-300 shadow-xl"
          >
            {data.description}
          </motion.div>
        )}
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-2 !bg-slate-800 !border-amber-400" />
    </>
  );
}

export const QueueNode = memo(QueueNodeComponent);
