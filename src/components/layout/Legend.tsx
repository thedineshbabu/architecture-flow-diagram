import { motion } from 'framer-motion';

const LEGEND_ITEMS = [
  { type: 'service', label: 'Service', color: 'bg-accent-cyan/80', border: 'border-accent-cyan' },
  { type: 'database', label: 'Database', color: 'bg-emerald-400/80', border: 'border-emerald-400' },
  { type: 'queue', label: 'Queue / Cache', color: 'bg-amber-400/80', border: 'border-amber-400' },
] as const;

export function Legend() {
  return (
    <motion.div
      className="absolute top-4 left-4 z-10 px-4 py-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-600/60 shadow-lg"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
        Node Types
      </div>
      <ul className="space-y-2">
        {LEGEND_ITEMS.map((item, i) => (
          <motion.li
            key={item.type}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.15 + i * 0.1 }}
          >
            <span
              className={`w-3 h-3 rounded-sm ${item.color} border ${item.border}`}
            />
            <span className="text-sm text-slate-300">{item.label}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
