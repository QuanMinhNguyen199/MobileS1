import { motion } from "motion/react";

export const EMBLEM_SRC = "/login/emblem.svg";

// Kích thước lấy theo trang gốc (px CSS)
export default function Welcome({ active, onLogin }) {
  return (
    <motion.div
      inert={!active}
      animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 mx-auto flex w-[548px] max-w-[calc(100%-32px)] flex-col items-center rounded-[24px] bg-white/60 px-4 pt-[27px] pb-[10px] text-center font-geist text-[#1b1d22] backdrop-blur-[40px] md:px-[35px]"
    >
      {active ? (
        <motion.img
          layoutId="emblem"
          src={EMBLEM_SRC}
          alt="Quốc huy"
          width="400"
          height="407"
          className="h-[54px] w-[53px]"
        />
      ) : (
        <div className="h-[54px] w-[53px]" aria-hidden="true" />
      )}

      <h1 className="mt-5 text-2xl leading-9 font-semibold text-balance md:text-[24px]">Chào mừng tới GeoAgent!</h1>

      <p className="mt-2 text-xs leading-[18px] text-pretty md:text-[12px]">
        Dịch vụ nhắn tin &amp; liên lạc được mã hóa, phi tập trung. Được vận hành trên{" "}
        <img src="/login/gotix.svg" alt="gotix" width="80" height="34" className="inline h-[34px] w-20 align-middle" />
      </p>

      <button
        type="button"
        onClick={onLogin}
        className="relative mt-[22px] flex h-[42.5px] w-[190px] items-center justify-center rounded-[4px] bg-[#2b78bf] px-5 text-[15px] text-white transition-colors hover:bg-[#22649f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1d22] active:bg-[#1d5689]"
      >
        <img src="/login/icon-sign-in.svg" alt="" width="18" height="18" className="absolute left-[10px] size-[18px]" />
        Đăng nhập
      </button>

      <label className="relative mt-[25px] block h-[35px] w-40">
        <span className="sr-only">Ngôn ngữ</span>
        <select
          defaultValue="vi"
          className="h-full w-full cursor-pointer appearance-none rounded-[4px] bg-transparent pr-7 pl-3 text-center text-[15px] font-semibold text-[#3f4550] hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-[#1b1d22]"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-[#3f4550]">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </label>
    </motion.div>
  );
}
