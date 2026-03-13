import { motion } from 'framer-motion';

export function LoadingState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-accent-cyan"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <p className="text-slate-400 text-sm">Loading architecture...</p>
    </motion.div>
  );
}
