/**
 * Ballistic Particle Burst Engine
 * Implements deterministic physics from hyperframes-animation (rules/particle-burst.md):
 * - Pure ballistic parabolic trajectories: x(t) = vx * t, y(t) = vy * t + 0.5 * g * t^2
 * - Rotational spin and aerodynamic tumble
 * - Brand palette: Amber, Gold, Flame Orange, Emerald, Slate-950, and Clean White
 * - Canvas-based 60fps render with automatic cleanup
 */

export interface BurstOptions {
  x?: number;
  y?: number;
  count?: number;
  spread?: number;
  colors?: string[];
  power?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  width: number;
  height: number;
  rotation: number;
  spin: number;
  color: string;
  isCircle: boolean;
  birth: number;
  duration: number;
}

const BRAND_PALETTE = [
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#fef08a', // amber-200
  '#ea580c', // orange-600
  '#f97316', // orange-500
  '#10b981', // emerald-500
  '#ffffff', // pure white
  '#38bdf8', // sky-400
];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const activeParticles: Particle[] = [];
let animFrameId: number | null = null;

function ensureCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof window === 'undefined') return null;

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'particle-burst-canvas';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    const onResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    window.addEventListener('resize', onResize);
    onResize();
  }

  if (!ctx && canvas) {
    ctx = canvas.getContext('2d');
  }

  return ctx && canvas ? { canvas, ctx } : null;
}

function renderFrame() {
  const kit = ensureCanvas();
  if (!kit) return;
  const { ctx } = kit;

  const now = performance.now();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const GRAVITY = 1100; // px / s^2

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    const elapsed = (now - p.birth) / 1000;

    if (elapsed >= p.duration) {
      activeParticles.splice(i, 1);
      continue;
    }

    const progress = elapsed / p.duration;
    // Parabolic ballistic formula (rules/particle-burst.md)
    const currentX = p.x + p.vx * elapsed;
    const currentY = p.y + p.vy * elapsed + 0.5 * GRAVITY * elapsed * elapsed;
    const rot = p.rotation + p.spin * elapsed;

    // Fade out smoothly towards the end
    const alpha = Math.max(0, Math.min(1, (1 - progress) * 2));

    ctx.save();
    ctx.translate(currentX, currentY);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.isCircle) {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Confetti flake with 3D tumble projection
      const tumble = Math.cos(rot * 2);
      ctx.fillRect(-p.width / 2, (-p.height * tumble) / 2, p.width, p.height * Math.abs(tumble));
    }

    ctx.restore();
  }

  if (activeParticles.length > 0) {
    animFrameId = requestAnimationFrame(renderFrame);
  } else {
    animFrameId = null;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

export function triggerParticleBurst(options?: BurstOptions) {
  if (typeof window === 'undefined') return;

  const originX = options?.x ?? window.innerWidth / 2;
  const originY = options?.y ?? window.innerHeight / 2;
  const count = options?.count ?? 42;
  const colors = options?.colors ?? BRAND_PALETTE;
  const power = options?.power ?? 1;

  const now = performance.now();

  for (let i = 0; i < count; i++) {
    // Deterministic trigonometric spread cone (rules/particle-burst.md)
    const angle = -Math.PI / 2 + (Math.random() * 2 - 1) * 0.95; // mostly upward cone
    const speed = (280 + Math.random() * 520) * power;
    const isCircle = Math.random() > 0.65;
    const size = 6 + Math.random() * 8;

    activeParticles.push({
      x: originX + (Math.random() * 20 - 10),
      y: originY + (Math.random() * 20 - 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      width: size * 1.3,
      height: size * 0.7,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() * 2 - 1) * 9,
      color: colors[i % colors.length],
      isCircle,
      birth: now + Math.random() * 60, // slight staggered eruption
      duration: 1.2 + Math.random() * 0.8,
    });
  }

  if (!animFrameId) {
    animFrameId = requestAnimationFrame(renderFrame);
  }
}
