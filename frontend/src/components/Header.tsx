import { useEffect, useRef, useState } from "react";
import { FiLogOut, FiMoon, FiSun, FiUpload, FiUser } from "react-icons/fi";
import {  useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { classNames } from "../utils/classNames";
import { Logo } from "./Logo";

type Props = {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenUpload: () => void;
  queueButton?: React.ReactNode;
};

export function Header({
  isDark,
  onToggleTheme,
  onOpenUpload,
  queueButton,
}: Props) {
  const auth = useAuth();
  const navigate = useNavigate();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleAccountMenu() {
    setIsAccountMenuOpen((v) => !v);
  }

  function handleLogout() {
    auth.logout();
    setIsAccountMenuOpen(false);
    navigate("/", { replace: true });
  }

  function handleLoginClick() {
    setIsAccountMenuOpen(false);
    navigate("/login");
  }

  function handleRegisterClick() {
    setIsAccountMenuOpen(false);
    navigate("/register");
  }

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

          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={toggleAccountMenu}
              className={classNames(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-in-out",
                isDark
                  ? "border-white/10 bg-[#1A1D24] text-white hover:border-[#2563EB] hover:text-[#60A5FA]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB]"
              )}
              aria-label="Account"
              title="Аккаунт"
            >
              <FiUser />
            </button>

            {isAccountMenuOpen && (
              <div
                className={classNames(
                  "absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border shadow-lg",
                  isDark
                    ? "border-white/10 bg-[#111318] text-white"
                    : "border-slate-200 bg-white text-slate-900"
                )}
              >
                {!auth.isAuthenticated ? (
                  <div className="flex flex-col p-2">
                    <button
                      onClick={handleLoginClick}
                      className={classNames(
                        "rounded-lg px-3 py-2 text-left text-sm transition",
                        isDark
                          ? "hover:bg-white/5"
                          : "hover:bg-slate-50"
                      )}
                    >
                      Войти
                    </button>

                    <button
                      onClick={handleRegisterClick}
                      className={classNames(
                        "rounded-lg px-3 py-2 text-left text-sm transition",
                        isDark
                          ? "hover:bg-white/5"
                          : "hover:bg-slate-50"
                      )}
                    >
                      Зарегистрироваться
                    </button>
                  </div>
                ) : (
                  <div className="p-2">
                    <div
                      className={classNames(
                        "mb-2 rounded-lg px-3 py-2",
                        isDark ? "bg-white/5" : "bg-slate-50"
                      )}
                    >
                      <div className="text-sm font-medium">
                        {auth.user?.display_name ?? "Пользователь"}
                      </div>
                      <div
                        className={classNames(
                          "mt-1 text-xs",
                          isDark ? "text-white/50" : "text-slate-500"
                        )}
                      >
                        {auth.user?.email}
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className={classNames(
                        "inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                        isDark
                          ? "hover:bg-red-500/10 hover:text-red-300"
                          : "hover:bg-red-50 hover:text-red-600"
                      )}
                    >
                      <FiLogOut />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}