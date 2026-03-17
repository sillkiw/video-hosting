import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Header } from "../components/Header";
import { useAuth } from "../auth/useAuth";
import { humanizeError, isApiError } from "../api/errors";
import type { AuthPageProps } from "../types/authPageProps";
import { classNames } from "../utils/classNames";

export function LoginPage({ isDark, setIsDark }: AuthPageProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitError(null);
    setFieldErrors([]);
    setIsSubmitting(true);

    try {
      await auth.login({ email, password });
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      if (isApiError(err)) {
        const uiErr = humanizeError(err);
        setSubmitError(uiErr.description ?? uiErr.title);
        setFieldErrors(uiErr.fieldErrors ?? []);
      } else {
        setSubmitError("Не удалось войти. Попробуйте ещё раз.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={classNames(
        "min-h-screen transition-[background-color,color] duration-500 ease-in-out",
        isDark ? "bg-[#0B0B0F] text-white" : "bg-[#F8FAFC] text-[#111827]"
      )}
    >
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark((v) => !v)}
        onOpenUpload={() => navigate("/login")}
      />

      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center justify-center px-4 py-10">
        <div
          className={classNames(
            "w-full max-w-md rounded-2xl border p-6 shadow-sm transition-[background-color,border-color] duration-500 ease-in-out",
            isDark
              ? "border-white/10 bg-white/5"
              : "border-black/10 bg-white"
          )}
        >
          <h1 className="text-2xl font-semibold">Вход</h1>
          <p className={classNames("mt-2 text-sm", isDark ? "text-white/60" : "text-slate-500")}>
            Войдите, чтобы загружать видео и управлять своими файлами.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <div className="mb-2 text-sm font-medium">Email</div>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={classNames(
                  "w-full rounded-xl border px-4 py-3 outline-none transition",
                  isDark
                    ? "border-white/10 bg-[#111318] text-white placeholder:text-white/30"
                    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                )}
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-medium">Пароль</div>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className={classNames(
                  "w-full rounded-xl border px-4 py-3 outline-none transition",
                  isDark
                    ? "border-white/10 bg-[#111318] text-white placeholder:text-white/30"
                    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                )}
              />
            </label>

            {submitError && (
              <div
                className={classNames(
                  "rounded-xl border p-3 text-sm",
                  isDark
                    ? "border-red-400/30 bg-red-500/10 text-red-200"
                    : "border-red-200 bg-red-50 text-red-700"
                )}
              >
                {submitError}
              </div>
            )}

            {fieldErrors.length > 0 && (
              <ul
                className={classNames(
                  "list-disc space-y-1 pl-5 text-sm",
                  isDark ? "text-red-200" : "text-red-700"
                )}
              >
                {fieldErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={classNames(
                "w-full rounded-xl px-4 py-3 font-medium transition",
                isDark
                  ? "bg-white text-black hover:bg-white/90 disabled:bg-white/60"
                  : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400"
              )}
            >
              {isSubmitting ? "Входим..." : "Войти"}
            </button>
          </form>

          <p className={classNames("mt-5 text-sm", isDark ? "text-white/60" : "text-slate-500")}>
            Нет аккаунта?{" "}
            <Link
              to="/register"
              className={classNames(
                "font-medium underline-offset-4 hover:underline",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}