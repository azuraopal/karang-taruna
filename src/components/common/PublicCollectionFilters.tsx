import { useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, X, SlidersHorizontal, ChevronDown, Check, LayoutGrid, Users, HeartHandshake, Trophy, BookOpen, Megaphone, Palette, Leaf, GraduationCap, BriefcaseBusiness, Sparkles } from 'lucide-react';

interface Props {
  label: string;
  options: string[];
  counts: Record<string, number>;
  selected: string;
  onSelect: (value: string) => void;
  searchLabel: string;
  query: string;
  onSearch: (value: string) => void;
  resultText: string;
}

function categoryIcon(category: string) {
  if (category === 'Semua') return LayoutGrid;
  if (/olahraga/i.test(category)) return Trophy;
  if (/sosial/i.test(category)) return HeartHandshake;
  if (/pendidikan|kerohanian/i.test(category)) return BookOpen;
  if (/seni|kreativitas/i.test(category)) return Palette;
  if (/lingkungan/i.test(category)) return Leaf;
  if (/pelatihan|psdm/i.test(category)) return GraduationCap;
  if (/pengumuman/i.test(category)) return Megaphone;
  if (/ekonomi|program/i.test(category)) return BriefcaseBusiness;
  if (/pengurus/i.test(category)) return Users;
  return Sparkles;
}

export function PublicCollectionFilters({ label, options, counts, selected, onSelect, searchLabel, query, onSearch, resultText }: Props) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const mobileFilters = useRef<HTMLDetailsElement>(null);
  const hasFilter = Boolean(query || selected !== 'Semua');
  const renderOptions = (mobile = false) => options.map((option) => {
    const Icon = categoryIcon(option);
    const active = selected === option;
    return <motion.button key={option} type="button" aria-pressed={active}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: reduceMotion ? 0 : 0.12 }}
      className="collection-choice" title={counts[option] === 0 ? `${option}: belum ada data` : undefined}
      onClick={() => {
        onSelect(option);
        if (mobile && mobileFilters.current) {
          mobileFilters.current.open = false;
          mobileFilters.current.querySelector('summary')?.focus();
        }
      }}>
      <Icon size={17} className="collection-choice__icon" aria-hidden="true" />
      <span className="collection-choice__label">{option}</span>
      <span className="collection-choice__count" aria-label={`${counts[option] ?? 0} item`}>{counts[option] ?? 0}</span>
      <motion.span initial={false} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.16 }} className="collection-choice__check" aria-hidden="true"><Check size={14} /></motion.span>
    </motion.button>;
  });

  return (
    <div className="collection-tools">
      <div className="collection-tools__top">
        <div className="collection-search">
          <label htmlFor={`${id}-search`} className="sr-only">{searchLabel}</label>
          <Search aria-hidden="true" size={20} className="collection-search__icon" />
          <input id={`${id}-search`} type="search" value={query} onChange={(event) => onSearch(event.target.value)} placeholder={searchLabel} />
          {query && <button type="button" onClick={() => onSearch('')} aria-label={`Hapus pencarian: ${searchLabel}`} className="collection-search__clear"><X size={18} /></button>}
        </div>
        <div className="collection-tools__status">
          <span className="collection-tools__dot" aria-hidden="true" />
          <p role="status" aria-live="polite" aria-atomic="true">{resultText}</p>
          {hasFilter && <button type="button" onClick={() => { onSearch(''); onSelect('Semua'); }} className="collection-tools__reset"><X size={14} aria-hidden="true" />Hapus filter</button>}
        </div>
      </div>
      <div className="collection-tools__desktop">
        <div className="collection-tools__caption"><SlidersHorizontal size={15} aria-hidden="true" /><span>{label}</span><span className="collection-tools__rule" /></div>
        <div className="collection-tools__options" role="group" aria-label={`Filter ${label.toLowerCase()}`}>{renderOptions()}</div>
      </div>
      <details ref={mobileFilters} className="collection-tools__mobile">
        <summary><SlidersHorizontal size={18} aria-hidden="true" /><span>{label}<strong>{selected}</strong></span><span className="collection-tools__total">{options.length - 1}</span><ChevronDown size={18} className="collection-tools__chevron" aria-hidden="true" /></summary>
        <div className="collection-tools__options" role="group" aria-label={`Filter ${label.toLowerCase()}`}>{renderOptions(true)}</div>
      </details>
    </div>
  );
}
