export type ApiError = {
  code: string;
  message?: string;
  fields?: Record<string, string>;
};


export type UiError = {
  title: string;
  description?: string;
  fieldErrors?: string[];
};

function prettyFieldError(field: string, reason: string): string {
  const fieldRu: Record<string, string> = {
    title: "Название",
    content_type: "Тип файла",
    size: "Размер",
  };

  const reasonRu: Record<string, string> = {
    required: "обязательно",
    too_long: "слишком длинное",
    too_short: "слишком короткое",
    not_allowed: "недопустимый формат (только MP4)",
    invalid: "некорректное значение",
    too_large: "слишком большой",
    too_small: "слишком маленький",
    exist_error: "видео с таким именем уже есть",
  };

  return `${fieldRu[field] ?? field}: ${reasonRu[reason] ?? reason}`;
}

export function humanizeError(err: ApiError): UiError {
  if (err.code === "validation_error" && err.fields) {
    return {
      title: "Проверьте данные",
      description: "Некоторые поля заполнены неверно.",
      fieldErrors: Object.entries(err.fields).map(([f, r]) =>
        prettyFieldError(f, r)
      ),
    };
  }

  switch (err.code) {
    case "payload_too_large":
      return {
        title: "Файл слишком большой",
        description: "Выберите файл меньшего размера.",
      };
    case "conflict":
      return {
        title: "Загрузка недоступна",
        description: "Видео уже загружается или уже загружено.",
      };
    default:
      return {
        title: "Ошибка",
        description: err.message ?? "Что-то пошло не так.",
      };
  }
}

export function isApiError(err: unknown): err is ApiError {
  return typeof err === "object" && err !== null && "code" in err;
}


export async function parseApiError(res: Response): Promise<ApiError> {
  try {
    return (await res.json()) as ApiError;
  } catch {
    return { code: "unknown_error", message: `HTTP ${res.status}` };
  }
}