export function Avatar({ name, size = "md", status = false }) {
  const sizes = {
    md: "size-10 text-lg",
    lg: "size-[33.6px] text-xl md:size-[40px] md:text-[1.28rem]",
    xl: "size-12 text-2xl md:size-[48px] md:text-[1.6rem]",
    sm: "size-8 text-base md:size-[32px] md:text-[15px]",
  };
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand ${sizes[size]}`}
    >
      {name.trim().charAt(0).toUpperCase()}
      {status && (
        <span className="absolute right-0 bottom-0.5 size-[8px] rounded-full border-[1.2px] border-ink-2 bg-surface" />
      )}
    </span>
  );
}

export function IconButton({ label, children, className = "", ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-grid size-10 shrink-0 [&_svg]:size-6 place-items-center rounded-full text-ink-2 hover:bg-surface-2 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Biểu tượng trợ lý GeoAgent, cùng hình với logo ở chân sidebar
export function BotAvatar() {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full border border-white/60 md:size-[32px] bg-[radial-gradient(circle_at_35%_30%,#ffd84d,var(--gold)_60%,#e49a00)] text-base font-extrabold text-brand-bar md:text-[16px]"
    >
      G
    </span>
  );
}
