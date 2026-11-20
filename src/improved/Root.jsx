import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import App from "./App.jsx";
import Welcome, { EMBLEM_SRC } from "./components/Welcome.jsx";
import { LOGIN_ASSETS } from "./assets.js";

// Máy tính: welcome → auth (logo ở giữa, chờ xác thực) → fly (logo bay vào sidebar) → reveal (mở app hình tròn) → app
// Điện thoại (header không có quốc huy, không có chỗ để logo hạ cánh):
//   welcome → auth → reveal kiểu "rèm": cả màn đăng nhập đỏ cùng quốc huy trượt lên, app nằm sẵn bên dưới hiện rõ dần → app
const AUTH_MS = 1300;
const REVEAL_AFTER_FLY_MS = 420;
const flight = { type: "spring", bounce: 0, visualDuration: 0.55 };
const revealEase = [0.65, 0, 0.35, 1];
const lift = { type: "spring", bounce: 0, visualDuration: 0.6 };

export default function Root() {
  const [phase, setPhase] = useState("welcome");
  const [target, setTarget] = useState(null);
  const [curtain, setCurtain] = useState(false); // điện thoại: chuyển cảnh kiểu rèm
  const [loginError, setLoginError] = useState("");
  const logoRef = useRef(null);
  const reduce = useReducedMotion();

  const radius = useMotionValue(0);
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const clipPath = useTransform(() => `circle(${radius.get()}px at ${cx.get()}px ${cy.get()}px)`);

  // Giả lập xác thực: thay bằng lời gọi API thật, chuyển pha khi có kết quả
  useEffect(() => {
    if (phase !== "auth") return;
    const t = setTimeout(() => {
      // Giả lập lỗi: mất mạng thì quay lại màn đăng nhập kèm thông báo (khi nối API: lỗi từ máy chủ)
      if (!navigator.onLine) {
        setLoginError("Không kết nối được máy chủ. Kiểm tra mạng rồi đăng nhập lại.");
        setPhase("welcome");
        return;
      }
      // Máy tính: quốc huy bay vào sidebar. Điện thoại: không có chỗ hạ cánh nên dùng chuyển cảnh kiểu rèm.
      const el = logoRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setTarget({ x: r.left, y: r.top, w: r.width, h: r.height });
        setPhase(reduce ? "reveal" : "fly");
      } else {
        setCurtain(!reduce);
        setPhase("reveal");
      }
    }, reduce ? 500 : AUTH_MS);
    return () => clearTimeout(t);
  }, [phase, reduce]);

  // Bắt đầu mở app khi logo gần hạ cánh để hai chuyển động nối liền
  useEffect(() => {
    if (phase !== "fly") return;
    const t = setTimeout(() => setPhase("reveal"), REVEAL_AFTER_FLY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Mở app theo hình tròn từ tâm logo (máy tính)
  useEffect(() => {
    if (phase !== "reveal" || reduce || curtain || !target) return;
    const x = target.x + target.w / 2;
    const y = target.y + target.h / 2;
    cx.set(x);
    cy.set(y);
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const controls = animate(radius, r, { duration: 0.8, ease: revealEase });
    controls.then(() => setPhase("app"));
    return () => controls.stop();
  }, [phase, reduce, curtain, target, cx, cy, radius]);

  useEffect(() => {
    if (phase === "app") document.getElementById("chat-title")?.focus({ preventScroll: true });
  }, [phase]);

  const login = () => {
    setLoginError("");
    setPhase("auth");
  };

  // Đăng xuất: về màn đăng nhập, đặt lại chuyển cảnh, focus vào nút Đăng nhập
  const logout = () => {
    setTarget(null);
    setCurtain(false);
    radius.set(0);
    setPhase("welcome");
    requestAnimationFrame(() => document.querySelector("[data-login-button]")?.focus());
  };

  const appMounted = phase !== "welcome";
  const appVisible = phase === "reveal" || phase === "app";
  const lifting = curtain && phase === "reveal"; // rèm đang kéo lên

  return (
    <>
      {phase !== "app" && (
        // Điện thoại: màn đăng nhập nằm trên app và trượt lên khỏi màn hình (rèm). Máy tính: nằm dưới app.
        <motion.div
          className={`fixed inset-0 grid grid-cols-[minmax(0,1fr)] place-items-center overflow-y-auto bg-frame py-10 ${curtain ? "z-[25]" : ""}`}
          initial={false}
          animate={{ y: lifting ? "-100%" : 0 }}
          transition={lift}
          onAnimationComplete={() => lifting && setPhase("app")}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url("${LOGIN_ASSETS.background}")` }} />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-black"
            initial={false}
            animate={{ opacity: phase === "welcome" ? 0 : 0.18 }}
            transition={{ duration: 0.4 }}
          />
          <Welcome active={phase === "welcome"} onLogin={login} error={loginError} />
        </motion.div>
      )}

      {appMounted && (
        <motion.div
          className="fixed inset-0 z-20 bg-surface"
          inert={phase !== "app"}
          aria-hidden={phase !== "app"}
          // Kiểu rèm: ghi rõ clipPath "none" — bỏ style khỏi props không xóa vòng tròn bán kính 0 Motion đã ghi lên phần tử
          style={curtain ? { clipPath: "none" } : reduce || phase === "app" ? undefined : { clipPath, willChange: "clip-path" }}
          initial={reduce ? { opacity: 0 } : curtain ? { opacity: 0.6, scale: 0.96 } : false}
          animate={reduce ? { opacity: appVisible ? 1 : 0 } : curtain ? (appVisible ? { opacity: 1, scale: 1 } : { opacity: 0.6, scale: 0.96 }) : undefined}
          transition={curtain ? lift : { duration: 0.4 }}
          onAnimationComplete={() => reduce && phase === "reveal" && setPhase("app")}
        >
          <App logoRef={logoRef} logoHidden={phase !== "app"} onLogout={logout} />
        </motion.div>
      )}

      {/* Lớp logo: nằm trên app để vòng tròn mở không cắt mất logo. Điện thoại: đi lên cùng rèm. */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {(phase === "auth" || (reduce && phase === "reveal") || lifting) && (
            <motion.div
              className="absolute inset-0 grid place-items-center"
              initial={false}
              animate={lifting ? { y: "-100%" } : { opacity: phase === "auth" ? 1 : 0 }}
              transition={lifting ? lift : { duration: 0.3 }}
            >
              <div className="relative grid size-[160px] place-items-center">
                <motion.svg
                  viewBox="0 0 160 160"
                  aria-hidden="true"
                  className="absolute inset-0 animate-spin [animation-duration:1.4s] motion-reduce:animate-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  <circle cx="80" cy="80" r="74" fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="3" />
                  <circle cx="80" cy="80" r="74" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="110 355" />
                </motion.svg>
                <motion.img
                  layoutId="emblem"
                  transition={flight}
                  src={EMBLEM_SRC}
                  alt=""
                  width="400"
                  height="407"
                  className="h-[106px] w-[104px] drop-shadow-[0_6px_16px_rgb(80_0_0_/_0.35)]"
                />
              </div>
              <motion.p
                role="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="absolute top-[calc(50%+96px)] text-[15px] font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_0.35)]">
                Đang đăng nhập…
              </motion.p>
            </motion.div>
        )}

        {!reduce && target && (phase === "fly" || phase === "reveal") && (
          <motion.img
            layoutId="emblem"
            transition={flight}
            src={EMBLEM_SRC}
            alt=""
            width="400"
            height="407"
            className="absolute"
            style={{ left: target.x, top: target.y, width: target.w, height: target.h }}
          />
        )}
      </div>
    </>
  );
}
