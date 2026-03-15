import { FiMoon, FiSun, FiUpload, FiUser } from "react-icons/fi";
import { Logo } from "./Logo";
import { classNames } from "../utils/classNames";

type Props = {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenUpload: () => void;
  queueButton?: React.ReactNode;
};

export function Header({ isDark, onToggleTheme, onOpenUpload, queueButton }: Props) {
  return (
    <header
      className={classNames(
        "sticky top-0 z-40 border-b backdrop-blur-md transition-[background-color,border-color,color] duration-500 ease-in-out",
        isDark
          ? "border-white/10 bg-[#111318]/95"
          : "border-black/5 bg-white/90"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Logo isDark={isDark} />
        </div>

        <div className="hidden flex-1 px-6 md:block">
          <div className="mx-auto max-w-xl">
            <input
              placeholder="Поиск видео..."
              className={classNames(
                "h-10 w-full rounded-md border px-4 text-sm outline-none transition-[background-color,border-color,color,box-shadow] duration-500 ease-in-out",
                isDark
                  ? "border-white/10 bg-[#1A1D24] text-white placeholder:text-white/35 focus:border-[#2563EB]"
                  : "border-slate-200 bg-white text-[#111827] placeholder:text-slate-400 focus:border-[#2563EB]"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={classNames(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-in-out",
              isDark
                ? "border-white/10 bg-[#1A1D24] text-white hover:border-[#2563EB]"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
            )}
            aria-label="Toggle theme"
            title="Сменить тему"
          >
            <span className="transition-transform duration-500 ease-in-out hover:rotate-12">
              {isDark ? <FiSun /> : <FiMoon />}
            </span>
          </button>

          {queueButton}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-lg"
          >
            <FiUpload />
            Загрузить
          </button>

          <button
            className={classNames(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-in-out",
              isDark
                ? "border-white/10 bg-[#1A1D24] text-white hover:border-[#2563EB] hover:text-[#60A5FA]"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
            )}
            aria-label="Account"
            title="Account"
          >
            <FiUser />
          </button>
        </div>
      </div>
    </header>
  );
}