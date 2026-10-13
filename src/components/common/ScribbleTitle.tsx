import type { ReactNode } from 'react';

export function ScribbleTitle({ children }: { children: ReactNode }) {
  return (
    <span className="scribble-title">
      <span className="scribble-title__text">{children}<span className="scribble-title__accent" aria-hidden="true"><svg className="scribble-title__spark" viewBox="0 0 36 36" focusable="false"><path d="m4 15 9 3M12 4l5 8M27 5l-3 9M32 22l-8-1" /></svg></span></span>
    </span>
  );
}
