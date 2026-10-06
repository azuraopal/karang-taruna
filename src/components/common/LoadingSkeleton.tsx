import React from 'react';

const SkeletonBlock: React.FC<{ className?: string; tone?: 'light' | 'dark' }> = ({
  className = '',
  tone = 'light',
}) => <div className={`loading-skeleton loading-skeleton--${tone} ${className}`} aria-hidden="true" />;

export const PublicLoadingSkeleton: React.FC = () => (
  <main className="min-h-[70vh] bg-stone-50" aria-busy="true" aria-live="polite">
    <span className="sr-only" role="status">Memuat halaman</span>
    <section className="overflow-hidden bg-slate-950 px-5 py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <SkeletonBlock tone="dark" className="h-6 w-32 rounded-full" />
          <SkeletonBlock tone="dark" className="h-10 w-full max-w-md rounded-xl" />
          <SkeletonBlock tone="dark" className="h-10 w-4/5 max-w-sm rounded-xl" />
          <div className="space-y-2 pt-2">
            <SkeletonBlock tone="dark" className="h-3.5 w-full max-w-lg rounded-full" />
            <SkeletonBlock tone="dark" className="h-3.5 w-3/4 max-w-sm rounded-full" />
          </div>
          <SkeletonBlock tone="dark" className="mt-7 h-11 w-40 rounded-xl" />
        </div>
        <div className="relative mx-auto grid aspect-[5/4] w-full max-w-md grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <SkeletonBlock tone="dark" className="col-span-2 rounded-xl" />
          <SkeletonBlock tone="dark" className="rounded-xl" />
          <SkeletonBlock tone="dark" className="rounded-xl" />
        </div>
      </div>
    </section>

    <section className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:grid-cols-3 sm:py-18">
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <SkeletonBlock className="h-9 w-9 rounded-lg" />
          <SkeletonBlock className="h-5 w-3/5 rounded-lg" />
          <SkeletonBlock className="h-3.5 w-full rounded-full" />
          <SkeletonBlock className="h-3.5 w-4/5 rounded-full" />
        </div>
      ))}
    </section>
  </main>
);

export const AdminLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-stone-100 p-4 sm:p-6" aria-busy="true" aria-live="polite">
    <span className="sr-only" role="status">Memuat panel pengurus</span>
    <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[14rem_1fr]">
      <aside className="hidden min-h-[42rem] rounded-xl bg-slate-950 p-5 lg:block">
        <SkeletonBlock tone="dark" className="h-8 w-28 rounded-lg" />
        <div className="mt-12 space-y-3">
          {[0, 1, 2, 3, 4].map((item) => <SkeletonBlock key={item} tone="dark" className="h-10 w-full rounded-lg" />)}
        </div>
      </aside>
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
          <div className="space-y-2"><SkeletonBlock className="h-6 w-40 rounded-lg" /><SkeletonBlock className="h-3.5 w-56 rounded-full" /></div>
          <SkeletonBlock className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="space-y-4 rounded-xl bg-white p-5 shadow-sm"><SkeletonBlock className="h-9 w-9 rounded-lg" /><SkeletonBlock className="h-8 w-14 rounded-lg" /><SkeletonBlock className="h-4 w-3/4 rounded-full" /></div>)}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><SkeletonBlock className="h-64 rounded-xl bg-white" /><SkeletonBlock className="h-64 rounded-xl bg-white" /></div>
      </div>
    </div>
  </div>
);
