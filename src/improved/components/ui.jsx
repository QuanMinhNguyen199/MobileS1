import { AssistantIcon } from "../icons.jsx";

// Mỗi người một sắc nhạt cố định theo chữ cái đầu: nhận diện, không phải dữ liệu
const TINTS = [
  ["#f8e3e1", "#8a1c22"],
  ["#f6ecd6", "#6e4a08"],
  ["#e3eef0", "#1f5560"],
  ["#ece6f3", "#4e3a6e"],
];
const tintFor = (name) => TINTS[name.trim().codePointAt(0) % TINTS.length];

export function Avatar({ name, size = 40, status = false, tone = "tint", className = "" }) {
  // Trên nền đỏ: một tông trắng mờ chung, tránh nhiều màu avatar cạnh tranh với sidebar
  const tones = { frame: ["rgb(255 247 240 / 0.16)", "var(--on-frame)"], selected: ["#f6dcd6", "var(--brand)"] };
  const [bg, fg] = tones[tone] ?? tintFor(name);
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center rounded-full font-semibold ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.42) }}
    >
      {name.trim().charAt(0).toUpperCase()}
      {status && (
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface bg-[#9a8f8c]" />
      )}
    </span>
  );
}

export function BotAvatar({ size = 32 }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-frame font-semibold text-gold"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      <AssistantIcon size={Math.round(size * 0.68)} />
    </span>
  );
}

export function IconButton({ label, children, className = "", tone = "sheet", ...rest }) {
  const tones = {
    sheet: "text-ink-2 hover:bg-surface-2 hover:text-ink",
    frame: "text-on-frame-muted hover:bg-frame-hover hover:text-on-frame",
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-5 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
