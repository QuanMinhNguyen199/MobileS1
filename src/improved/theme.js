import { useSyncExternalStore } from "react";

// Giao diện sáng/tối. Ba lựa chọn: "system" (mặc định, không lưu gì), "light", "dark".
// Lựa chọn được ghi vào <meta name="color-scheme">; CSS (index.css) đưa nó vào color-scheme,
// và màu trong src/tokens.css dùng light-dark() nên tự đổi theo. Script trong index.html áp lựa chọn trước khi vẽ.
const KEY = "color-scheme";
const CHANGE = "geoagent:color-scheme-change";
const meta = () => document.querySelector('meta[name="color-scheme"]');

const read = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};

const apply = (pref) => {
  const m = meta();
  if (m) m.content = pref === "system" ? "light dark" : pref;
};

// Chọn "Theo hệ thống" thì xóa giá trị đã lưu, để trang lại đi theo máy khi máy đổi sáng/tối.
const save = (pref) => {
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // Không lưu được (chặn dữ liệu trang): vẫn áp cho lần mở này
  }
  apply(pref);
  // storage không phát trong chính tab vừa đổi. Báo cho cả sidebar desktop và mobile.
  window.dispatchEvent(new Event(CHANGE));
};

// Meta là trạng thái đang áp dụng, kể cả khi trình duyệt chặn localStorage.
const currentPreference = () => {
  const value = meta()?.content;
  return value === "light" || value === "dark" ? value : "system";
};
const subscribePreference = (notify) => {
  const onStorage = (event) => {
    if (event.key !== KEY && event.key !== null) return;
    apply(read());
    notify();
  };
  window.addEventListener(CHANGE, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, notify);
    window.removeEventListener("storage", onStorage);
  };
};

const dark = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const subscribeSystem = (cb) => {
  dark?.addEventListener("change", cb);
  return () => dark?.removeEventListener("change", cb);
};
const systemIsDark = () => Boolean(dark?.matches);

// [lựa chọn, đổi lựa chọn, máy đang tối?]
export function useColorScheme() {
  const pref = useSyncExternalStore(subscribePreference, currentPreference, () => "system");
  const systemDark = useSyncExternalStore(subscribeSystem, systemIsDark, () => false);
  return [pref, save, systemDark];
}
