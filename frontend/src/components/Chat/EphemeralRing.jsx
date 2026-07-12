import { useState, useEffect } from 'react';

export default function EphemeralRing({ ttl, createdAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const elapsed = (now - createdAt) / 1000;
  const progress = Math.max(0, 1 - elapsed / ttl);
  const circumference = 2 * Math.PI * 6;

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" className="inline-flex shrink-0">
      <circle cx="8" cy="8" r="6" stroke="rgba(255,69,0,0.2)" strokeWidth="1.5" fill="none" />
      <circle
        cx="8" cy="8" r="6"
        stroke="#FF4500"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        transform="rotate(-90 8 8)"
        className="transition-[stroke-dashoffset] duration-200 linear"
      />
    </svg>
  );
}
