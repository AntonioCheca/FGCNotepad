# Replay Lab Tickets 0.x Plan

## Ticket 0.1 Architecture Audit

### Current backend conventions

- Symfony JSON APIs live under `/api/*` and use Symfony session authentication with CSRF protection unless explicitly public.
- Controllers parse requests, perform HTTP/auth orchestration, and delegate domain behavior to services.
- New backend behavior should use dedicated services and response builders instead of large controller payload assembly.
- Entities use Doctrine attributes, strict typing, repositories per entity, and Postgres as the source of truth.
- Current domain tables are split between `forum` user/profile content and `sf6` game/frame-data content.
- Replay review data should live in `forum` because it is user-owned coaching/profile data, not static SF6 reference data.
- Backend behavior changes require PHPUnit coverage.
- Any Doctrine entity or migration change requires explicit Product Owner confirmation before implementation.

### Current frontend conventions

- Main routes use `frontend/pages`.
- `_app.tsx` protects all non-auth pages through `AuthGate`.
- API access goes through `frontend/services/api.js` and `frontend/hooks/useApi.js`.
- New domain hooks should wrap API calls rather than calling Axios directly from components.
- Sidebar navigation is configured in `frontend/src/data/navigationData.tsx`.
- MUI must only be imported through `frontend/src/components/ui/*` wrappers.
- Replay Lab UI should use existing semantic theme tokens and wrapper components.

### Proposed backend names

- Entities: `ReplayVideo`, `ReplayReviewSession`, `ReplayAnnotation`, `ReplayClip`, `PracticeTask`, `StudyCard`, `StudyReviewLog`.
- Future entity: `ReplayReviewAccessToken`.
- Repositories mirror entity names.
- Services: `ReplayAnnotationExportService`, `ReplayClipGenerator`, `ReplayReviewResponseBuilder`, `ReplayStorageKeyFactory`.
- Storage: `VideoStorageInterface`, `LocalVideoStorage`, future `S3VideoStorage`, `StoredVideoObject`.

### Proposed API routes

- `POST /api/replay-videos`
- `GET /api/replay-videos/{id}`
- `DELETE /api/replay-videos/{id}`
- `GET /api/replay-videos/{id}/stream` for local/private playback, or `/playback-url` for S3 presigned URLs.
- `POST /api/replay-review-sessions`
- `GET /api/replay-review-sessions/{id}`
- `PATCH /api/replay-review-sessions/{id}`
- `DELETE /api/replay-review-sessions/{id}`
- `POST /api/replay-review-sessions/{id}/annotations`
- `GET /api/replay-review-sessions/{id}/annotations`
- `PATCH /api/replay-annotations/{id}`
- `DELETE /api/replay-annotations/{id}`
- `POST /api/replay-review-sessions/{id}/export`
- `GET /api/replay-clips/{id}/stream` for local/private playback, or `/playback-url` for S3 presigned URLs.
- `GET /api/practice-tasks?status=pending`
- `PATCH /api/practice-tasks/{id}`
- `POST /api/practice-tasks/{id}/complete`
- `POST /api/practice-tasks/{id}/dismiss`
- `GET /api/study/cards/due`
- `POST /api/study/cards/{id}/review`

### Proposed frontend names

- Pages: `frontend/pages/replay-lab/index.tsx`, `frontend/pages/replay-lab/replays/[id].tsx`, `frontend/pages/replay-lab/practice-tasks.tsx`, `frontend/pages/replay-lab/study-deck.tsx`.
- Types: `frontend/src/types/replay.ts`, `frontend/src/types/practice.ts`, `frontend/src/types/study.ts`.
- Hooks: `frontend/hooks/useReplayVideos.ts`, `frontend/hooks/useReplayReviewSessions.ts`, `frontend/hooks/useReplayAnnotations.ts`, `frontend/hooks/usePracticeTasks.ts`, `frontend/hooks/useStudyCards.ts`.
- Components: `frontend/src/features/replay-lab/*`.
- Sidebar section: `Replay Lab` with `Review Replays`, `Practice Tasks`, and `Study Deck` authenticated items.

### Risks before implementation

- Schema work is blocked until Product Owner approval.
- ffmpeg must be installed locally and in production runtime before clip generation can work.
- Synchronous export can block HTTP requests if many clips are generated; keep the service queue-ready.
- S3 support needs an explicit dependency decision before implementation.
- Browser video seeking by frame is approximate unless backed by accurate fps metadata and compatible encoding.
- Local Symfony streaming may need range request support if playback or seeking is poor.

## Ticket 0.2 Storage Decision

### Decision

Use a backend storage abstraction with separate storage keys for temporary full replays and permanent extracted clips.

### Local MVP

- Store files under a configurable root, defaulting to `backend/var/replay-storage`.
- For very large local MKVs, import files from `backend/var/replay-imports` instead of uploading through PHP multipart.
- Use separate key prefixes: `replays/` and `clips/`.
- Serve playback through authenticated backend endpoints.
- Keep binary files out of Postgres and out of git.

### Production AWS target

- Store full replays and clips in S3 using separate prefixes.
- Use presigned upload/download URLs.
- Apply S3 lifecycle policy to temporary full replays.
- Preserve permanent clips while active practice tasks or study cards reference them.

### Key format

- Temporary replay: `replays/{userId}/{videoId}/original.{ext}`.
- Permanent clip: `clips/{userId}/{clipId}.{ext}`.

### Configuration

- `REPLAY_STORAGE_ADAPTER=local`
- `REPLAY_STORAGE_LOCAL_ROOT=%kernel.project_dir%/var/replay-storage`
- `REPLAY_IMPORT_DIRECTORY=%kernel.project_dir%/var/replay-imports`
- `REPLAY_MAX_SIZE_BYTES=3221225472`
- `REPLAY_MAX_DURATION_SECONDS=600`
- `REPLAY_RETENTION_DAYS=14`
- `REPLAY_CLIP_MAX_DURATION_SECONDS=10`
- `FFMPEG_BINARY=ffmpeg`
- `FFPROBE_BINARY=ffprobe`

Future production configuration:

- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_REPLAY_PREFIX=replays`
- `AWS_S3_CLIP_PREFIX=clips`

### ffmpeg integration

- Use native ffmpeg through `Symfony\Component\Process\Process`.
- Do not call ffmpeg from controllers.
- `ReplayAnnotationExportService` calls `ReplayClipGenerator`.
- `ReplayClipGenerator` validates range and duration, generates a temporary clip, stores it through `VideoStorageInterface`, and returns metadata.
- Start synchronous for MVP, but keep the service isolated so it can move to Messenger later.
