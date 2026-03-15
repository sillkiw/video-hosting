import { classNames } from "../utils/classNames";

type Props = {
  isDark: boolean;
};

export function Logo({ isDark }: Props) {
  return (
    <div className="flex items-center select-none">
      <span className="flex items-center text-xl font-black tracking-tight">
        <span className="text-[#2563EB]">Go</span>
        <span
          className={classNames(
            "transition-colors duration-500",
            isDark ? "text-white" : "text-[#111827]"
          )}
        >
          Watch
        </span>
        <span className="ml-1 rounded-md bg-[#2563EB] px-2 py-0.5 text-white shadow-sm">
          HUB
        </span>
      </span>
    </div>
  );
}