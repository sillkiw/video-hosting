type Props = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function VideoMeta({
  id,
  title,
  createdAt,
  updatedAt,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827]">
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500">
              Создано: {formatDate(createdAt)}
            </span>
            <span className="text-sm text-slate-500">
              Обновлено: {formatDate(updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div>
          <span className="font-semibold text-slate-700">Video ID:</span> {id}
        </div>
      </div>
    </div>
  );
}