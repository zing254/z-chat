export default function BurnedLog({ timestamp }) {
  return (
    <div className="flex items-center justify-center py-1">
      <span className="font-mono text-[10px] italic text-danger-orange opacity-60">
        Message burned at {new Date(timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}