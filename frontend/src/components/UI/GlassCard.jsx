export default function GlassCard({ children, className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-surface-container bg-opacity-40 backdrop-blur-[24px] backdrop-saturate-[180%] border border-glass-border rounded-lg p-6',
    elevated: 'bg-surface-container-high bg-opacity-50 backdrop-blur-[24px] backdrop-saturate-[180%] border border-glass-border rounded-lg p-6 shadow-[0_0_20px_rgba(0,240,255,0.05)]',
    floating: 'bg-surface-container-highest bg-opacity-60 backdrop-blur-[32px] backdrop-saturate-[180%] border border-glass-border rounded-xl p-6 shadow-[0_0_40px_rgba(176,38,255,0.08)]',
  };

  return (
    <div className={`${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </div>
  );
}