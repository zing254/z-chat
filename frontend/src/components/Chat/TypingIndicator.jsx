export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-neon-violet animate-breath"
          style={{
            animationDelay: `${i * 0.15}s`,
            boxShadow: '0 0 6px rgba(176, 38, 255, 0.4)',
          }}
        />
      ))}
      <span className="text-text-placeholder font-body text-[10px] ml-1">typing</span>
    </div>
  );
}