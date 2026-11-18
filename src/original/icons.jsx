const base = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true, focusable: false };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const SearchIcon = (p) => (
  <svg {...base} {...p}><g {...stroke} strokeWidth={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></g></svg>
);
export const MoreIcon = (p) => (
  <svg {...base} {...p} fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
);
export const EditIcon = (p) => (
  <svg {...base} {...p}><g {...stroke}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="M13 7l4 4" /></g></svg>
);
export const GroupAddIcon = (p) => (
  <svg {...base} {...p}><g {...stroke}><circle cx="9" cy="8" r="3.2" /><path d="M3 19c0-3.3 2.7-5.5 6-5.5 1.3 0 2.5.3 3.4.9" /><circle cx="17.5" cy="16.5" r="4" /><path d="M17.5 14.5v4M15.5 16.5h4" /></g></svg>
);
export const ChevronDown = (p) => (
  <svg {...base} {...p}><path {...stroke} strokeWidth={2} d="m6 9 6 6 6-6" /></svg>
);
export const ChevronUp = (p) => (
  <svg {...base} {...p}><path {...stroke} strokeWidth={2} d="m6 15 6-6 6 6" /></svg>
);
export const BackIcon = (p) => (
  <svg {...base} {...p}><path {...stroke} strokeWidth={2} d="m15 5-7 7 7 7" /></svg>
);
export const CloseIcon = (p) => (
  <svg {...base} {...p}><path {...stroke} strokeWidth={2} d="m7 7 10 10M17 7 7 17" /></svg>
);
export const ChatIcon = (p) => (
  <svg {...base} {...p}><path d="M4 4h16v12H8l-4 4V4Z" fill="currentColor" /><path d="M8 8.5h8M8 12h5" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const InfoIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M12 11v6" stroke="var(--surface)" strokeWidth="2.2" strokeLinecap="round" /><circle cx="12" cy="7.5" r="1.3" fill="var(--surface)" /></svg>
);
export const SmileIcon = (p) => (
  <svg {...base} {...p}><g {...stroke}><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2" /></g><circle cx="9" cy="10" r="1.2" fill="currentColor" /><circle cx="15" cy="10" r="1.2" fill="currentColor" /></svg>
);
export const SendIcon = (p) => (
  <svg {...base} {...p}><path d="M4 4.5 21 12 4 19.5l2.5-7.5L4 4.5Z" fill="currentColor" /></svg>
);
export const ClipIcon = (p) => (
  <svg {...base} {...p}><path {...stroke} d="M16.5 7.5 9 15a2 2 0 1 0 2.8 2.8l7.8-7.8a4 4 0 0 0-5.7-5.7L6 12.2a6 6 0 0 0 8.5 8.5l6-6" /></svg>
);
