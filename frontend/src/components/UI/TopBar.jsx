export default function TopBar({ title, leftElement, rightElement, className = '' }) {
  return (
    <header className={`
      glass sticky top-0 z-30
      px-4 py-3 flex items-center justify-between
      min-h-[56px]
      ${className}
    `}>
      <div className="flex items-center gap-3 min-w-0">
        {leftElement}
        {title && (
          <h1 className="font-space text-lg font-semibold text-text-primary truncate">
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {rightElement}
      </div>
    </header>
  );
}