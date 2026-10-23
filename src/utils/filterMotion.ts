export function filterTransition(reduced: boolean) {
  return {
    initial: reduced ? false as const : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: reduced ? 1 : 0, y: reduced ? 0 : -4 },
    transition: { duration: reduced ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] as const },
  };
}
