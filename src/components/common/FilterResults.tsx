import type { ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';

import { filterTransition } from '../../utils/filterMotion';

/** Keep controls mounted/focused; only cross-fade the results of a filter change. */
export function FilterResults({ filterKey, children }: { filterKey: string; children: ReactNode }) {
  const reduced = !!useReducedMotion();
  return <MotionConfig reducedMotion="user">
    <div data-filter-results="" className="relative">
      <AnimatePresence initial={false} mode="wait">
        <motion.div key={filterKey} data-filter-key={filterKey} {...filterTransition(reduced)}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  </MotionConfig>;
}
