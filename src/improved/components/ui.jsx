import { AssistantIcon } from "../icons.jsx";

// Mỗi người một sắc nhạt cố định theo chữ cái đầu: nhận diện, không phải dữ liệu
// Màu lấy từ token avatar/* (src/tokens.css), khớp biến thể Tone=Red/Amber/Teal/Violet của component Avatar trong Figma
const TINTS = [
  ["var(--avatar-red-bg)", "var(--avatar-red-fg)"],
  ["var(--avatar-amber-bg)", "var(--avatar-amber-fg)"],
  ["var(--avatar-teal-bg)", "var(--avatar-teal-fg)"],
  ["var(--avatar-violet-bg)", "var(--avatar-violet-fg)"],
];
const tintFor = (name) => TINTS[name.trim().codePointAt(0) % TINTS.length];

export function Avatar({ name, size = 40, status = false, tone = "tint", className = "" }) {
  // Trên nền đỏ: một tông trắng mờ chung, tránh nhiều màu avatar cạnh tranh với sidebar
  const tones = { frame: ["var(--avatar-frame-bg)", "var(--on-frame)"], selected: ["var(--avatar-selected-bg)", "var(--on-frame-active)"] };
  const [bg, fg] = tones[tone] ?? tintFor(name);
  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center rounded-full font-semibold ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.42) }}
    >
      {name.trim().charAt(0).toUpperCase()}
      {status && (
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-avatar-status-ring bg-avatar-status" />
      )}
    </span>
  );
}

export function BotAvatar({ size = 32 }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-bot-avatar-bg font-semibold text-bot-avatar-icon"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {/* Dấu hiệu thương hiệu dạng khối: lớn hơn icon nét một chút để chữ G và hai mắt còn rõ ở cỡ 22–28px */}
      <AssistantIcon size={Math.round(size * 0.76)} />
    </span>
  );
}

export function IconButton({ label, children, className = "", tone = "sheet", ...rest }) {
  const tones = {
    sheet: "text-icon-button-icon hover:bg-icon-button-bg-hover hover:text-icon-button-icon-hover",
    frame: "text-sidebar-icon hover:bg-sidebar-item-bg-hover hover:text-sidebar-text",
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
