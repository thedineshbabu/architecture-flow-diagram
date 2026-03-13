import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { ServiceNodeType } from '../../types/architecture';

function ServiceNodeComponent({ data, selected }: NodeProps<ServiceNodeType>) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border-2 !bg-slate-800 !border-accent-cyan" />
      <motion.div
        className={`
          relative min-w-[160px] rounded-xl px-4 py-3
          bg-slate-800/80 backdrop-blur-md border
          shadow-lg
          ${selected ? 'border-accent-cyan shadow-accent-cyan/20' : 'border-slate-600/60'}
          ${isHovered ? 'shadow-accent-cyan/10 border-slate-500' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        style={{
          boxShadow: isHovered ? '0 0 24px rgba(56, 189, 248, 0.15)' : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-100 truncate">{data.label}</div>
            <div className="text-xs text-slate-400">Service</div>
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
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-2 !bg-slate-800 !border-accent-cyan" />
    </>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
