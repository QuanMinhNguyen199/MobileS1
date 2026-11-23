import { motion } from "motion/react";
import { LOGIN_ASSETS } from "../assets.js";
import { SignInIcon, WarningIcon } from "../icons.jsx";

export const LOGO_SRC = LOGIN_ASSETS.logo;

export default function Welcome({ active, onLogin, error = "" }) {
  return (
    <motion.div
      inert={!active}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 mx-auto flex w-[420px] max-w-[calc(100%-32px)] flex-col items-center rounded-2xl bg-login-card-bg px-6 pt-9 pb-6 text-center text-login-card-text shadow-card md:px-10"
    >
      {active ? (
        <motion.img layoutId="logo" src={LOGO_SRC} alt="GeoAgent" width="512" height="512" className="size-[72px]" />
      ) : (
        <div className="size-[72px]" aria-hidden="true" />
      )}

      <h1 className="mt-5 text-display text-balance">Chào mừng tới GeoAgent</h1>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-login-card-text-muted">Trợ lý AI cho nghiệp vụ thuế và kế toán.</p>

      {/* Đăng nhập thất bại: báo ngay trên nút, giữ nút để thử lại */}
      <p role="alert" className="m-0 w-full empty:hidden">
        {error && (
          <span className="mt-5 flex items-start gap-2 text-left text-sm text-login-card-error">
            <WarningIcon size={16} className="mt-0.5 shrink-0" />
            {error}
          </span>
        )}
      </p>

      <button
        type="button"
        data-login-button
        onClick={onLogin}
        className={`${error ? "mt-4" : "mt-7"} flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-button-primary-bg text-button text-button-primary-label transition-colors hover:bg-button-primary-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:bg-button-primary-bg-pressed`}
      >
        <SignInIcon size={18} />
        Đăng nhập
      </button>

      <div className="mt-5 flex w-full items-center justify-center border-t border-login-card-divider pt-4 text-small text-login-card-text-muted">
        <span className="flex items-center gap-1.5">
          Vận hành trên
          <img src={LOGIN_ASSETS.gotix} alt="gotix" width="56" height="24" className="invert-on-dark h-6 w-14" />
        </span>
      </div>
    </motion.div>
  );
}
