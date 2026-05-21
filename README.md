
# GoWatchHub

Видеохостинг на **Go + React** с загрузкой видео, обработкой в несколько качеств и воспроизведением через **MPEG-DASH**.



## О проекте

GoWatchHub — это full-stack проект видеоплатформы, в котором реализованы:

- регистрация и авторизация пользователей;
- загрузка видео;
- создание задач на обработку;
- транскодирование видео в несколько quality-представлений;
- подготовка DASH manifest;
- просмотр видео через web-плеер.

Проект состоит из frontend и backend частей и демонстрирует полный пользовательский сценарий:  
**от входа в систему и загрузки файла до просмотра готового видео в браузере**.



## Стек 

### Frontend

- **React 19** — SPA-интерфейс
- **Vite 8** — локальная разработка и сборка frontend
- **React Router 7** — маршрутизация между страницами
- **dash.js 5** — воспроизведение MPEG-DASH
- **Tailwind CSS / CSS** — стилизация интерфейса

### Backend

- **Go 1.25** — серверная логика и API
- **chi** — HTTP router и middleware
- **JWT** — авторизация
- **PostgreSQL 16** — хранение пользователей, видео и задач обработки
- **FFmpeg** — транскодирование видео
- **GPAC** — подготовка DASH manifest и media-представлений
- **Docker Compose** — локальный запуск сервисов



## Архитектура

### Общая схема

- **Frontend** — интерфейс пользователя
- **Nginx** — отдача статики и проксирование `/api` и `/media`
- **Go API** — авторизация, метаданные видео, управление задачами
- **Worker** — обработка видео через FFmpeg + GPAC
- **PostgreSQL** — users, videos, video_jobs
- **File Storage** — хранение raw и processed файлов

### Поток обработки

1. Пользователь создаёт запись о видео через API
2. Backend возвращает данные для загрузки файла
3. Пользователь загружает бинарный файл
4. Backend создаёт задачу в `video_jobs`
5. Worker забирает задачу со статусом `pending`
6. Видео обрабатывается и подготавливается в нескольких качествах
7. Формируется `output.mpd`
8. Frontend получает `manifest_url` и запускает `dash.js`

---

## Структура базы данных

### `users`

Хранит пользователей платформы:

- `id`
- `email`
- `password_hash`
- `display_name`
- `role`
- `created_at`
- `updated_at`

### `videos`

Хранит видео и их метаданные:

- `id`
- `owner_id`
- `title`
- `video_size`
- `content_type`
- `video_status`
- `created_at`
- `updated_at`

### `video_jobs`

Хранит задачи на обработку видео:

- `id`
- `video_id`
- `job_type`
- `status`
- `attempts`
- `error_message`
- `created_at`
- `started_at`
- `finished_at`

### Связи

- **users → videos** = `1 : N`
- **videos → video_jobs** = `1 : N`

---

## Статусы видео

В таблице `videos` используются следующие статусы:

- `created`
- `uploading`
- `uploaded`
- `processing`
- `ready`
- `failed_upload`
- `failed_processing`

## Статусы задач

В таблице `video_jobs` используются следующие статусы:

- `pending`
- `processing`
- `done`
- `failed`

---

## API

### Auth

#### `POST /api/auth/register`

Регистрация нового пользователя.

**Request**
```json
{
  "email": "user@example.com",
  "password": "qwerty123",
  "display_name": "Alex"
}
````

**Response**

```json
{
  "jwt_token": "your-jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "Alex",
    "role": "user"
  }
}
```

---

#### `POST /api/auth/login`

Вход пользователя.

**Request**

```json
{
  "email": "user@example.com",
  "password": "qwerty123"
}
```

**Response**

```json
{
  "jwt_token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "Alex"
  }
}
```

---

#### `GET /api/auth/me`

Возвращает текущего пользователя по JWT.

**Request**

```http
GET /api/auth/me
Authorization: Bearer jwt-token
```

**Response**

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "display_name": "Alex",
  "role": "user"
}
```

---

### Videos

#### `POST /api/videos/create`

Создаёт запись о видео и возвращает данные для загрузки файла.

**Request**

```json
{
  "title": "My first video",
  "content_type": "video/mp4",
  "size": 15230000
}
```

**Response**

```json
{
  "id": "video-uuid",
  "status": "created",
  "upload": {
    "method": "PUT",
    "url": "/api/videos/video-uuid/upload",
    "max_size": 15230000
  },
  "links": {
    "self": "/api/videos/video-uuid"
  }
}
```

---

#### `PUT /api/videos/:video_id/upload`

Загружает бинарный видеофайл.

**Request**

```http
PUT /api/videos/video-uuid/upload
Authorization: Bearer jwt-token
Content-Type: video/mp4

(binary file body)
```

**Response**

```http
204 No Content
```

---

#### `GET /api/videos`

Возвращает список видео.

**Response**

```json
{
  "items": [
    {
      "id": "video-uuid",
      "title": "My first video",
      "created_at": "2026-03-18T10:15:00Z",
      "thumbnail_url": "/media/videos/video-uuid/thumbnail.jpg",
      "owner_display_name": "Alex"
    }
  ]
}
```

---

#### `GET /api/videos/:id`

Возвращает данные конкретного видео.

**Response**

```json
{
  "id": "video-uuid",
  "title": "My first video",
  "status": "ready",
  "created_at": "2026-03-18T10:15:00Z",
  "updated_at": "2026-03-18T10:20:00Z",
  "manifest_url": "/media/videos/video-uuid/output.mpd",
  "thumbnail_url": "/media/videos/video-uuid/thumbnail.jpg",
  "owner_display_name": "Alex"
}
```

---

### Media

#### `GET /media/videos/:id/*`

Раздаёт `output.mpd` и media-файлы разных quality-представлений.

Примеры:

```http
GET /media/videos/video-uuid/output.mpd
GET /media/videos/video-uuid/high_video-uuid_dashinit.mp4
GET /media/videos/video-uuid/med_video-uuid_dashinit.mp4
GET /media/videos/video-uuid/low_video-uuid_dashinit.mp4
GET /media/videos/video-uuid/audio_video-uuid_dashinit.mp4
```

---

## Очередь задач и обработка

После загрузки файла backend создаёт запись в `video_jobs` со статусом `pending`.

Далее worker:

1. забирает задачу через `ClaimNextPending()`;
2. меняет статус задачи на `processing`;
3. запускает обработку видео;
4. подготавливает quality-представления;
5. формирует DASH manifest;
6. переводит видео в статус `ready`;
7. завершает задачу со статусом `done`.

### Параллелизм

Worker запускает несколько goroutines, поэтому несколько видео могут обрабатываться параллельно.

---

## MPEG-DASH

В проекте используется DASH-воспроизведение через `dash.js`.

### Как это работает

1. Frontend получает `manifest_url`
2. Плеер запрашивает `output.mpd`
3. DASH-плеер выбирает подходящее качество
4. Плеер читает данные из media-файлов
5. Во время воспроизведения качество может меняться в зависимости от условий сети

### Особенность реализации

В текущей реализации используется **DASH on-demand profile** через `SegmentBase`.

Это означает, что:

* есть `output.mpd`;
* есть отдельные media-представления для разных качеств;
* плеер читает нужные диапазоны байтов из MP4-файлов;
* отдельные `.m4s`-файлы как самостоятельные сегменты не используются.

---


### Требования

* Docker
* Docker Compose

### Запуск фронта

1. Собрать весь фронт в папку dist 

```bash
cd frontend
npm install
npm run build
```

2. Загрузить файлы в nginx


Можно запустить фронт локально 
```bash
npm run dev
```

### Запуск бэка

```bash
docker compose up backend --build
```

### Запуск всей инфры с PostgreSQL

```bash
docker compose up --build
```

После запуска:

* frontend будет доступен в браузере
* backend начнёт принимать API-запросы
* postgres поднимется как отдельный сервис
* worker начнёт обрабатывать задачи

---


