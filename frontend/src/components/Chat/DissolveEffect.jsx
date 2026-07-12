import { useRef, useEffect, useState } from 'react';

export default function DissolveEffect({ text, onComplete, duration = 3000 }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('countdown');

  useEffect(() => {
    const timer = setTimeout(() => setPhase('dissolving'), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'dissolving') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 400;
    const height = canvas.height = 120;

    ctx.font = '48px "Inter", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 20, height / 2);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const particles = [];

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 128) {
          particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            opacity: 1,
            size: Math.random() * 2 + 1,
          });
        }
      }
    }

    const capped = particles.slice(0, 500);
    ctx.clearRect(0, 0, width, height);

    const startTime = performance.now();
    let animId;

    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        cancelAnimationFrame(animId);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, width, height);
      capped.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.opacity = 1 - progress;

        ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [phase, text, duration, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      {phase === 'countdown' && (
        <div className="flex items-center gap-2">
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#FF4500" strokeWidth="2" fill="none"
              strokeDasharray="63" strokeDashoffset="20" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-sm text-danger-orange">
            Message dissolves in 3s...
          </span>
        </div>
      )}
      <canvas ref={canvasRef} className="border border-glass-border rounded-lg" />
    </div>
  );
}