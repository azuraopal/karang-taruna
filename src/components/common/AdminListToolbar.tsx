import React from 'react';
import { motion } from 'framer-motion';
import { ListFilter, Search } from 'lucide-react';

interface AdminListToolbarProps {
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
}

export const AdminListToolbar: React.FC<AdminListToolbarProps> = ({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  searchLabel = 'Cari data',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.985 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.7 }}
    className={`flex w-full flex-col gap-2 md:gap-0 md:flex-row md:items-stretch ${onSearchChange ? 'md:max-w-[36rem]' : 'md:w-fit md:max-w-full'} md:overflow-hidden md:rounded-2xl md:border md:border-stone-200 md:bg-white md:p-1.5 md:shadow-sm`}
  >
    {onSearchChange && (
      <motion.label
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, delay: 0.08, ease: 'easeOut' }}
        className="relative block min-w-0 flex-1"
      >
        <span className="sr-only">{searchLabel}</span>
        <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={searchValue || ''}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-12 w-full rounded-xl border border-stone-300 bg-white py-2 pl-10 pr-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 md:min-h-11 md:border-transparent md:bg-transparent md:shadow-none md:hover:bg-stone-50 md:focus-visible:bg-stone-50 md:focus-visible:ring-inset"
        />
      </motion.label>
    )}
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: 0.13, ease: 'easeOut' }}
      className={`flex min-w-0 flex-wrap items-center gap-1.5 ${onSearchChange ? 'md:border-l md:border-stone-100 md:pl-1.5' : ''}`}
    >
      {children}
    </motion.div>
  </motion.div>
);

interface AdminToolbarSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export const AdminToolbarSelect: React.FC<AdminToolbarSelectProps> = ({ label, value, onChange, children }) => (
  <motion.label whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 23 }} className="relative inline-flex min-h-12 w-full items-center rounded-xl border border-stone-300 bg-white pl-3 pr-2 shadow-sm transition-colors hover:bg-stone-50 md:min-h-11 md:min-w-44 md:w-auto md:border-0 md:bg-stone-50 md:shadow-none md:hover:bg-stone-100">
    <ListFilter className="pointer-events-none h-4 w-4 shrink-0 text-slate-400" />
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 min-w-0 flex-1 cursor-pointer bg-transparent px-2 text-xs font-bold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
    >
      {children}
    </select>
  </motion.label>
);
