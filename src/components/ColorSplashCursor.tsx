import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Palette, Check } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  isDust?: boolean;
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
  color: string;
}

interface RippleRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

// Vibrant Holi / Festive Splash Color Palettes
const FESTIVE_COLORS = [
  '#FF007F', // Deep Pink / Rose
  '#FF5722', // Deep Orange / Saffron
  '#FFD700', // Royal Gold
  '#00E676', // Bright Green
  '#00E5FF', // Electric Cyan
  '#7C4DFF', // Vibrant Purple
  '#FF1744', // Vivid Red
  '#E040FB', // Neon Magenta
  '#FF9100', // Amber Orange
  '#00B0FF', // Sky Blue
];

const GOLDEN_COLORS = [
  '#F59E0B', '#FBBF24', '#FCD34D', '#D97706', '#B45309', '#FEF08A'
];

const NEON_COLORS = [
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F43F5E'
];

export const ColorSplashCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('rdo_cursor_splash_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [paletteMode, setPaletteMode] = useState<'festive' | 'neon' | 'golden'>(() => {
    return (localStorage.getItem('rdo_cursor_palette_mode') as any) || 'festive';
  });
  const [showMenu, setShowMenu] = useState(false);

  // Active color list based on current palette mode
  const currentColors =
    paletteMode === 'golden'
      ? GOLDEN_COLORS
      : paletteMode === 'neon'
      ? NEON_COLORS
      : FESTIVE_COLORS;

  const currentColorsRef = useRef(currentColors);
  currentColorsRef.current = currentColors;

  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  useEffect(() => {
    localStorage.setItem('rdo_cursor_splash_enabled', String(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem('rdo_cursor_palette_mode', paletteMode);
  }, [paletteMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animFrameId: number | null = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const trail: TrailPoint[] = [];
    const ripples: RippleRing[] = [];

    let prevX = -100;
    let prevY = -100;
    let colorIndex = 0;
    let isMoving = false;
    let stopMovingTimer: NodeJS.Timeout | null = null;

    // Get next vibrant color
    const getNextColor = () => {
      const list = currentColorsRef.current;
      colorIndex = (colorIndex + 1) % list.length;
      return list[colorIndex];
    };

    // Spawn color splash particles when moving ("rangu viseristhey yela annatlu")
    const spawnMoveParticles = (x: number, y: number, speed: number, angle: number) => {
      if (!isEnabledRef.current) return;

      // Density of particles scales with movement velocity
      const particleCount = Math.min(Math.floor(speed * 0.4) + 2, 7);
      const splashColor = getNextColor();

      for (let i = 0; i < particleCount; i++) {
        // Color powder spray backward / sideways relative to cursor movement
        const spraySpread = (Math.random() - 0.5) * 1.8;
        const throwAngle = angle + Math.PI + spraySpread;
        const throwSpeed = Math.random() * (speed * 0.28 + 2.5) + 0.8;

        const isDust = Math.random() > 0.45;
        const size = isDust ? Math.random() * 2.8 + 1.2 : Math.random() * 4.5 + 2.5;

        particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(throwAngle) * throwSpeed + (Math.random() - 0.5) * 1.2,
          vy: Math.sin(throwAngle) * throwSpeed + (Math.random() - 0.5) * 1.2 - 0.3,
          size,
          color: Math.random() > 0.3 ? splashColor : getNextColor(),
          alpha: Math.random() * 0.35 + 0.65,
          decay: Math.random() * 0.022 + 0.016,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
          isDust,
        });
      }

      // Add to smooth ribbon trail
      trail.push({
        x,
        y,
        time: Date.now(),
        color: splashColor,
      });

      // Keep trail capped at recent points
      if (trail.length > 20) {
        trail.shift();
      }
    };

    // Spawn 360-degree color bomb explosion on click ("rangu vesina splash")
    const spawnClickBurst = (x: number, y: number) => {
      if (!isEnabledRef.current) return;

      const burstColor = getNextColor();
      // Ripple ring
      ripples.push({
        x,
        y,
        radius: 4,
        maxRadius: 42,
        color: burstColor,
        alpha: 0.9,
      });

      // 28-36 festive flying droplets and powder clouds
      const count = 30;
      for (let i = 0; i < count; i++) {
        const rad = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const velocity = Math.random() * 6.5 + 2.5;
        const color = currentColorsRef.current[i % currentColorsRef.current.length];

        particles.push({
          x,
          y,
          vx: Math.cos(rad) * velocity,
          vy: Math.sin(rad) * velocity,
          size: Math.random() * 5 + 2.5,
          color,
          alpha: 1,
          decay: Math.random() * 0.025 + 0.018,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          isDust: Math.random() > 0.5,
        });
      }
    };

    // Pointer move listener
    const onPointerMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (prevX > 0 && prevY > 0) {
        const dx = x - prevX;
        const dy = y - prevY;
        const dist = Math.hypot(dx, dy);

        if (dist > 2) {
          const speed = Math.min(dist, 40);
          const angle = Math.atan2(dy, dx);
          spawnMoveParticles(x, y, speed, angle);
        }
      }

      prevX = x;
      prevY = y;
      isMoving = true;

      if (stopMovingTimer) clearTimeout(stopMovingTimer);
      stopMovingTimer = setTimeout(() => {
        isMoving = false;
      }, 100);
    };

    // Pointer down listener
    const onPointerDown = (e: PointerEvent) => {
      spawnClickBurst(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    // Animation Render Loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.6, 2.5);
      lastTime = time;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Clean old trail points
      const now = Date.now();
      while (trail.length > 0 && now - trail[0].time > 320) {
        trail.shift();
      }

      // 1. Draw glowing ribbon trail connecting recent cursor positions
      if (trail.length > 2 && isEnabledRef.current) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < trail.length; i++) {
          const p1 = trail[i - 1];
          const p2 = trail[i];
          const ageRatio = 1 - (now - p2.time) / 320;
          if (ageRatio <= 0) continue;

          // Glowing wake
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = p2.color;
          ctx.globalAlpha = ageRatio * 0.45;
          ctx.lineWidth = Math.max(1, (i / trail.length) * 7 * ageRatio);
          ctx.stroke();

          // Soft inner core highlight
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = ageRatio * 0.35;
          ctx.lineWidth = Math.max(0.5, (i / trail.length) * 2.5 * ageRatio);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Draw & update expanding ripple shockwaves
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 2.2 * delta;
        r.alpha -= 0.035 * delta;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, r.alpha * 0.7);
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw & update particles ("Rangu podi / Color powder droplets")
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.vx *= 0.94; // Air friction / drag
        p.vy = p.vy * 0.94 + 0.08 * delta; // Slight gravity
        p.rotation += p.vRot * delta;
        p.alpha -= p.decay * delta;
        p.size = Math.max(0, p.size - 0.03 * delta);

        if (p.alpha <= 0 || p.size <= 0.2) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        ctx.fillStyle = p.color;
        ctx.beginPath();

        if (p.isDust) {
          // Irregular soft dust particle
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Glowing color droplet with subtle soft specular
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Tiny specular glint
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.beginPath();
          ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Keep maximum particle threshold to avoid any lag
      if (particles.length > 140) {
        particles.splice(0, particles.length - 140);
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      if (stopMovingTimer) clearTimeout(stopMovingTimer);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <>
      {/* Full-screen non-blocking Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[999999] select-none"
        style={{ pointerEvents: 'none' }}
      />

      {/* Discreet floating interactive control in bottom-left */}
      <div className="fixed bottom-4 left-4 z-40 no-print">
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg border backdrop-blur-md cursor-pointer ${
              isEnabled
                ? 'bg-[#0a1b32]/85 text-amber-300 border-amber-400/50 hover:bg-[#0c2445] hover:border-amber-300 shadow-amber-900/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-600 hover:bg-slate-700 shadow-slate-900/40'
            }`}
            title="Color Splash Cursor Trail Settings"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Color Splash:</span>
            <span className={isEnabled ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>
              {isEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Settings Popover */}
          {showMenu && (
            <div className="absolute bottom-10 left-0 bg-[#08172c] border border-blue-400/40 rounded-xl p-3 shadow-2xl w-64 text-white text-xs space-y-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Color Splash Trail</span>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-slate-400 hover:text-white cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Trail Effect</span>
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                    isEnabled
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {isEnabled && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">Color Theme:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'festive', label: 'Holi / Festive', colors: ['#ff007f', '#ffc107', '#00e5ff'] },
                      { id: 'neon', label: 'Neon Glow', colors: ['#06b6d4', '#8b5cf6', '#ec4899'] },
                      { id: 'golden', label: 'Royal Gold', colors: ['#f59e0b', '#fbbf24', '#b45309'] },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setPaletteMode(theme.id as any)}
                        className={`p-1.5 rounded-lg border text-center text-[10px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          paletteMode === theme.id
                            ? 'bg-blue-600/30 border-amber-400 text-amber-200 shadow-xs'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center -space-x-1">
                          {theme.colors.map((c, idx) => (
                            <span
                              key={idx}
                              className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-tight pt-1">
                Move mouse faster to throw vibrant color splashes across the screen! Click anywhere for a color burst.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
