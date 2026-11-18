import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import App from "./App.jsx";
import Welcome, { EMBLEM_SRC } from "./components/Welcome.jsx";
import { LOGIN_ASSETS } from "./assets.js";

// welcome → auth (logo ở giữa, chờ xác thực) → fly (logo bay về góc trái) → reveal (mở app hình tròn) → app
const AUTH_MS = 1300;
const REVEAL_AFTER_FLY_MS = 420;
const flight = { type: "spring", bounce: 0, visualDuration: 0.55 };
const revealEase = [0.65, 0, 0.35, 1];

export default function Root() {
  const [phase, setPhase] = useState("welcome");
  const [target, setTarget] = useState(null);
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
      const r = logoRef.current.getBoundingClientRect();
      setTarget({ x: r.left, y: r.top, w: r.width, h: r.height });
      setPhase(reduce ? "reveal" : "fly");
    }, reduce ? 500 : AUTH_MS);
    return () => clearTimeout(t);
  }, [phase, reduce]);

  // Bắt đầu mở app khi logo gần hạ cánh để hai chuyển động nối liền
  useEffect(() => {
    if (phase !== "fly") return;
    const t = setTimeout(() => setPhase("reveal"), REVEAL_AFTER_FLY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Mở app theo hình tròn từ tâm logo
  useEffect(() => {
    if (phase !== "reveal" || reduce || !target) return;
    const x = target.x + target.w / 2;
    const y = target.y + target.h / 2;
    cx.set(x);
    cy.set(y);
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const controls = animate(radius, r, { duration: 0.8, ease: revealEase });
    controls.then(() => setPhase("app"));
    return () => controls.stop();
  }, [phase, reduce, target, cx, cy, radius]);

  useEffect(() => {
    if (phase === "app") document.getElementById("chat-title")?.focus({ preventScroll: true });
  }, [phase]);

  const appMounted = phase !== "welcome";
  const appVisible = phase === "reveal" || phase === "app";

  return (
    <>
      {phase !== "app" && (
        <div className="fixed inset-0 grid grid-cols-[minmax(0,1fr)] place-items-center overflow-y-auto bg-frame py-10">
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url("${LOGIN_ASSETS.background}")` }} />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-black"
            initial={false}
            animate={{ opacity: phase === "welcome" ? 0 : 0.18 }}
            transition={{ duration: 0.4 }}
          />
          <Welcome active={phase === "welcome"} onLogin={() => setPhase("auth")} />
        </div>
      )}

      {appMounted && (
        <motion.div
          className="fixed inset-0 z-20 bg-surface"
          inert={phase !== "app"}
          aria-hidden={phase !== "app"}
          style={reduce || phase === "app" ? undefined : { clipPath, willChange: "clip-path" }}
          initial={reduce ? { opacity: 0 } : false}
          animate={reduce ? { opacity: appVisible ? 1 : 0 } : undefined}
          transition={{ duration: 0.4 }}
          onAnimationComplete={() => reduce && phase === "reveal" && setPhase("app")}
        >
          <App logoRef={logoRef} logoHidden={phase !== "app"} />
        </motion.div>
      )}

      {/* Lớp logo bay: nằm trên app để vòng tròn mở không cắt mất logo */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {(phase === "auth" || (reduce && phase === "reveal")) && (
            <motion.div
              className="absolute inset-0 grid place-items-center"
              animate={{ opacity: phase === "auth" ? 1 : 0 }}
              transition={{ duration: 0.3 }}
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
