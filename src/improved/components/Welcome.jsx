import { motion } from "motion/react";
import { LOGIN_ASSETS } from "../assets.js";
import { ChevronDown, SignInIcon } from "../icons.jsx";

export const EMBLEM_SRC = LOGIN_ASSETS.emblem;

export default function Welcome({ active, onLogin }) {
  return (
    <motion.div
      inert={!active}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 mx-auto flex w-[420px] max-w-[calc(100%-32px)] flex-col items-center rounded-2xl bg-login-card-bg px-6 pt-9 pb-6 text-center text-login-card-text shadow-card md:px-10"
    >
      {active ? (
        <motion.img layoutId="emblem" src={EMBLEM_SRC} alt="Quốc huy" width="400" height="407" className="h-[73px] w-[72px]" />
      ) : (
        <div className="h-[73px] w-[72px]" aria-hidden="true" />
      )}

      <h1 className="mt-5 text-display text-balance">Chào mừng tới GeoAgent</h1>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-login-card-text-muted">Dịch vụ nhắn tin và liên lạc được mã hóa, phi tập trung.</p>

      <button
        type="button"
        onClick={onLogin}
        className="mt-7 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-button-primary-bg text-button text-button-primary-label transition-colors hover:bg-button-primary-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:bg-button-primary-bg-pressed"
      >
        <SignInIcon size={18} />
        Đăng nhập
      </button>

      <div className="mt-5 flex w-full items-center justify-between border-t border-login-card-divider pt-4 text-small text-login-card-text-muted">
        <span className="flex items-center gap-1.5">
          Vận hành trên
          <img src={LOGIN_ASSETS.gotix} alt="gotix" width="56" height="24" className="invert-on-dark h-6 w-14" />
        </span>
        <label className="relative">
          <span className="sr-only">Ngôn ngữ</span>
          <select
            defaultValue="vi"
            className="h-8 cursor-pointer appearance-none rounded-lg bg-transparent pr-7 pl-2 text-small font-medium text-login-card-text hover:bg-select-bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-login-card-text-muted" />
        </label>
      </div>
    </motion.div>
  );
}
