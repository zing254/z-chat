export default function NeonButton({ children, onClick, type = 'button', loading = false, disabled = false, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-transparent border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-bg-void hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]',
    skeleton: 'relative bg-transparent border-2 border-transparent text-text-primary font-semibold',
    danger: 'bg-transparent border border-danger-orange text-danger-orange hover:bg-danger-orange hover:text-white hover:shadow-[0_0_20px_rgba(255,69,0,0.3)]',
    ghost: 'bg-transparent border border-white/10 text-text-meta hover:text-text-primary hover:border-white/20',
  };

  const isSkeleton = variant === 'skeleton';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant] || variants.primary}
        px-6 py-3 rounded font-body font-medium text-sm
        transition-all duration-300 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
      style={isSkeleton ? {
        backgroundImage: 'linear-gradient(90deg, #00F0FF, #B026FF, #00F0FF)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'shimmer 2s linear infinite',
        border: '2px solid transparent',
        borderImage: 'linear-gradient(90deg, #00F0FF, #B026FF) 1',
      } : {}}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      ) : children}
    </button>
  );
}