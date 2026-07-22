<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\ReplayAnnotation;
use App\Entity\ReplayClip;
use App\Entity\ReplayReviewSession;
use App\Entity\ReplayVideo;
use App\Entity\StudyCard;
use App\Entity\User;
use App\Service\ReplayLabCleanupService;
use App\Service\ReplayStorage\LocalVideoPathResolver;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;

final class ReplayLabControllerTest extends AuthenticatedWebTestCase
{
    private string $uploadPath;

    public function setUp(): void
    {
        parent::setUp();

        $uploadPath = tempnam(sys_get_temp_dir(), 'fgc-replay-upload-');
        self::assertIsString($uploadPath);
        $this->uploadPath = $uploadPath;
        file_put_contents($this->uploadPath, "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isomvideo-bytes");
    }

    protected function tearDown(): void
    {
        if (is_file($this->uploadPath)) {
            unlink($this->uploadPath);
        }

        parent::tearDown();
    }

    public function testReplayVideoUploadCreatesOwnedReadyVideo(): void
    {
        $this->uploadReplayVideo();

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_CREATED, $response->getStatusCode(), (string) $response->getContent());
        $payload = $this->decodeResponsePayload();
        self::assertSame('replay.mp4', $payload['originalFilename'] ?? null);
        self::assertSame('ready', $payload['status'] ?? null);
        self::assertEquals(60.0, $payload['fps'] ?? null);
        self::assertNotEmpty($payload['deleteAfter'] ?? null);
    }

    public function testReplayLabLimitsCanBeRead(): void
    {
        $this->client->request('GET', '/api/replay-lab/limits', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $payload = $this->decodeResponsePayload();
        self::assertSame(3221225472, $payload['maxReplaySizeBytes'] ?? null);
        self::assertSame(600, $payload['maxReplayDurationSeconds'] ?? null);
        self::assertSame(10, $payload['maxClipDurationSeconds'] ?? null);
    }

    public function testLocalMp4ReplayCanBeImportedWithoutMultipartUpload(): void
    {
        $importDirectory = dirname(__DIR__, 3) . '/var/replay-imports';
        if (!is_dir($importDirectory)) {
            mkdir($importDirectory, 0775, true);
        }
        $sourcePath = $importDirectory . '/local-heavy-replay.mp4';
        file_put_contents($sourcePath, "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isomvideo-bytes");

        $this->client->request('GET', '/api/replay-video-imports', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $files = $this->decodeResponsePayload();
        $candidate = null;
        foreach ($files as $file) {
            if (is_array($file) && 'local-heavy-replay.mp4' === ($file['filename'] ?? null)) {
                $candidate = $file;
                break;
            }
        }
        self::assertIsArray($candidate);
        self::assertSame('video/mp4', $candidate['mimeType'] ?? null);

        $this->client->request('POST', sprintf('/api/replay-video-imports/%s', $candidate['id']), [], [], $this->jsonHeaders(), json_encode([
            'fps' => 60,
            'deleteSource' => true,
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $video = $this->decodeResponsePayload();
        self::assertSame('local-heavy-replay.mp4', $video['originalFilename'] ?? null);
        self::assertSame('video/mp4', $video['mimeType'] ?? null);
        self::assertFalse(is_file($sourcePath));
    }

    public function testLocalMkvReplayIsNotImportable(): void
    {
        $importDirectory = dirname(__DIR__, 3) . '/var/replay-imports';
        if (!is_dir($importDirectory)) {
            mkdir($importDirectory, 0775, true);
        }
        $sourcePath = $importDirectory . '/blocked-replay.mkv';
        file_put_contents($sourcePath, "\x1A\x45\xDF\xA3matroska-video-bytes");

        try {
            $this->client->request('GET', '/api/replay-video-imports', [], [], $this->getHeaders());

            self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
            $files = $this->decodeResponsePayload();
            foreach ($files as $file) {
                self::assertNotSame('blocked-replay.mkv', is_array($file) ? ($file['filename'] ?? null) : null);
            }
        } finally {
            if (is_file($sourcePath)) {
                unlink($sourcePath);
            }
        }
    }

    public function testReplayVideoPlaybackReturnsOwnedMedia(): void
    {
        $videoId = $this->createReplayVideoAndReturnId();

        $this->client->request('GET', sprintf('/api/replay-videos/%s/playback', $videoId), [], [], $this->getHeaders());

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_OK, $response->getStatusCode(), (string) $response->getContent());
        self::assertSame('video/mp4', $response->headers->get('content-type'));
        self::assertStringContainsString('inline;', (string) $response->headers->get('content-disposition'));
    }

    public function testReplayVideoPlaybackRejectsOtherUsers(): void
    {
        $videoId = $this->createReplayVideoAndReturnId();
        $otherHeaders = $this->loginHeadersForUser('replay_other_user');

        $this->client->request('GET', sprintf('/api/replay-videos/%s/playback', $videoId), [], [], $otherHeaders);

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testReplaySessionCanBeCreatedForOwnedVideo(): void
    {
        $videoId = $this->createReplayVideoAndReturnId();

        $this->client->request('POST', '/api/replay-review-sessions', [], [], $this->jsonHeaders(), json_encode([
            'videoId' => $videoId,
            'title' => 'Jamie set review',
        ]));

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_CREATED, $response->getStatusCode());
        $payload = $this->decodeResponsePayload();
        self::assertSame('Jamie set review', $payload['title'] ?? null);
        self::assertSame(ReplayReviewSession::STATUS_DRAFT, $payload['status'] ?? null);
    }

    public function testYouTubeReplayVideoCanCreateReviewSession(): void
    {
        $this->client->request('POST', '/api/replay-videos/youtube', [], [], $this->jsonHeaders(), json_encode([
            'youtubeUrl' => 'https://youtu.be/dQw4w9WgXcQ',
            'title' => 'Unlisted set review',
            'fps' => 60,
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $video = $this->decodeResponsePayload();
        self::assertSame('youtube', $video['sourceType'] ?? null);
        self::assertSame('dQw4w9WgXcQ', $video['youtubeVideoId'] ?? null);
        self::assertSame(0, $video['sizeBytes'] ?? null);
        self::assertNull($video['deleteAfter'] ?? null);

        $this->client->request('POST', '/api/replay-review-sessions', [], [], $this->jsonHeaders(), json_encode([
            'videoId' => $video['id'],
            'title' => 'YouTube coach session',
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $session = $this->decodeResponsePayload();
        self::assertSame('youtube', $session['video']['sourceType'] ?? null);
    }

    public function testLocalFileReplayVideoCanCreateReviewSessionWithoutUploadingOriginal(): void
    {
        $this->client->request('POST', '/api/replay-videos/local-file', [], [], $this->jsonHeaders(), json_encode([
            'filename' => 'local-source.mp4',
            'sizeBytes' => 123456789,
            'fps' => 60,
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $video = $this->decodeResponsePayload();
        self::assertSame('local_file', $video['sourceType'] ?? null);
        self::assertSame('local-source.mp4', $video['originalFilename'] ?? null);
        self::assertSame('video/local-file', $video['mimeType'] ?? null);
        self::assertNull($video['deleteAfter'] ?? null);

        $this->client->request('POST', '/api/replay-review-sessions', [], [], $this->jsonHeaders(), json_encode([
            'videoId' => $video['id'],
            'title' => 'Local-only session',
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $session = $this->decodeResponsePayload();
        self::assertSame('local_file', $session['video']['sourceType'] ?? null);
    }

    public function testLocalFileReplayVideoRejectsMkvMetadata(): void
    {
        $this->client->request('POST', '/api/replay-videos/local-file', [], [], $this->jsonHeaders(), json_encode([
            'filename' => 'local-source.mkv',
            'sizeBytes' => 123456789,
            'fps' => 60,
        ]));

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testYouTubeReplayPlaybackEndpointRejectsIframeSources(): void
    {
        $this->client->request('POST', '/api/replay-videos/youtube', [], [], $this->jsonHeaders(), json_encode([
            'youtubeUrl' => 'dQw4w9WgXcQ',
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $video = $this->decodeResponsePayload();

        $this->client->request('GET', sprintf('/api/replay-videos/%s/playback', $video['id']), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testReplaySessionCanBeListedUpdatedReadAndDeletedByOwner(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();

        $this->client->request('GET', '/api/replay-review-sessions', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $sessions = $this->decodeResponsePayload();
        self::assertNotEmpty($sessions);
        self::assertSame($sessionId, $sessions[0]['id'] ?? null);

        $this->client->request('PATCH', sprintf('/api/replay-review-sessions/%s', $sessionId), [], [], $this->jsonHeaders(), json_encode([
            'title' => 'Updated replay review',
        ]));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $updated = $this->decodeResponsePayload();
        self::assertSame('Updated replay review', $updated['title'] ?? null);

        $this->client->request('GET', sprintf('/api/replay-review-sessions/%s', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $this->client->request('DELETE', sprintf('/api/replay-review-sessions/%s', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
    }

    public function testOtherUserCannotReadUpdateOrDeleteReplaySession(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $otherHeaders = $this->loginHeadersForUser('session_intruder');

        $this->client->request('GET', sprintf('/api/replay-review-sessions/%s', $sessionId), [], [], $otherHeaders);
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());

        $this->client->request('PATCH', sprintf('/api/replay-review-sessions/%s', $sessionId), [], [], array_merge($otherHeaders, ['CONTENT_TYPE' => 'application/json']), json_encode(['title' => 'Nope']));
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());

        $this->client->request('DELETE', sprintf('/api/replay-review-sessions/%s', $sessionId), [], [], $otherHeaders);
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testOwnerCanCreateSharedReviewLinkAndTokenCanViewAndAnnotate(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();

        $token = $this->createShareLinkAndReturnToken($sessionId);

        $this->client->request('GET', sprintf('/api/shared-review/%s', $token));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $sharedReview = $this->decodeResponsePayload();
        self::assertSame($sessionId, $sharedReview['session']['id'] ?? null);

        $this->client->request('GET', sprintf('/api/shared-review/%s/playback', $token));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        self::assertSame('video/mp4', $this->client->getResponse()->headers->get('content-type'));

        $this->client->request('POST', sprintf('/api/shared-review/%s/annotations', $token), [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'startTimeMs' => 1100,
            'endTimeMs' => 2200,
            'eventKind' => ReplayAnnotation::EVENT_KIND_MEMORY,
            'category' => 'frame_trap',
            'title' => 'Coach note',
            'answer' => 'Hold pressure.',
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $annotation = $this->decodeResponsePayload();
        self::assertSame('Coach note', $annotation['title'] ?? null);
    }

    public function testOwnerCanListAndRevokeShareLinks(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $created = $this->createShareLink($sessionId, ['label' => 'Coach A']);

        $this->client->request('GET', sprintf('/api/replay-review-sessions/%s/share-links', $sessionId), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $links = $this->decodeResponsePayload();
        self::assertCount(1, $links);
        self::assertSame($created['id'], $links[0]['id'] ?? null);
        self::assertArrayNotHasKey('token', $links[0]);
        self::assertFalse($links[0]['requiresPassword'] ?? true);

        $this->client->request('POST', sprintf('/api/share-links/%s/revoke', $created['id']), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $revoked = $this->decodeResponsePayload();
        self::assertNotNull($revoked['revokedAt'] ?? null);
    }

    public function testOtherUserCannotListOrRevokeShareLinks(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $created = $this->createShareLink($sessionId);
        $otherHeaders = $this->loginHeadersForUser('share_link_intruder');

        $this->client->request('GET', sprintf('/api/replay-review-sessions/%s/share-links', $sessionId), [], [], $otherHeaders);
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('/api/share-links/%s/revoke', $created['id']), [], [], $otherHeaders);
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testViewOnlySharedReviewTokenCannotAnnotate(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $token = $this->createShareLinkAndReturnToken($sessionId, ['canAnnotate' => false]);

        $this->client->request('GET', sprintf('/api/shared-review/%s', $token));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $this->client->request('POST', sprintf('/api/shared-review/%s/annotations', $token), [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'startTimeMs' => 1100,
            'endTimeMs' => 2200,
            'eventKind' => ReplayAnnotation::EVENT_KIND_MEMORY,
            'category' => 'frame_trap',
        ]));

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testPasswordProtectedSharedReviewRequiresPassword(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $token = $this->createShareLinkAndReturnToken($sessionId, ['password' => 'coach-secret']);

        $this->client->request('GET', sprintf('/api/shared-review/%s', $token));
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', sprintf('/api/shared-review/%s', $token), [], [], ['HTTP_X_SHARED_REVIEW_PASSWORD' => 'wrong']);
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', sprintf('/api/shared-review/%s', $token), [], [], ['HTTP_X_SHARED_REVIEW_PASSWORD' => 'coach-secret']);
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $payload = $this->decodeResponsePayload();
        self::assertTrue($payload['access']['requiresPassword'] ?? false);
    }

    public function testExpiredSharedReviewTokenCannotView(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $token = $this->createShareLinkAndReturnToken($sessionId, ['expiresAt' => (new \DateTimeImmutable('-1 minute'))->format(\DateTimeInterface::ATOM)]);

        $this->client->request('GET', sprintf('/api/shared-review/%s', $token));

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testRevokedSharedReviewTokenCannotView(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $created = $this->createShareLink($sessionId);

        $this->client->request('POST', sprintf('/api/share-links/%s/revoke', $created['id']), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $this->client->request('GET', sprintf('/api/shared-review/%s', $created['token']));

        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testOtherUserCannotCreateShareLinkOrExportSession(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $otherHeaders = $this->loginHeadersForUser('shared_review_other_user');

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/share-links', $sessionId), [], [], array_merge($otherHeaders, ['CONTENT_TYPE' => 'application/json']), json_encode([]));
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $otherHeaders);
        self::assertSame(Response::HTTP_FORBIDDEN, $this->client->getResponse()->getStatusCode());
    }

    public function testAnnotationCanBeCreatedAndListedForSession(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/annotations', $sessionId), [], [], $this->jsonHeaders(), json_encode([
            'startTimeMs' => 1000,
            'endTimeMs' => 4500,
            'eventKind' => ReplayAnnotation::EVENT_KIND_MEMORY,
            'category' => 'frame_trap',
            'title' => 'Plus frame check',
            'answer' => 'Respect the plus frames.',
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $created = $this->decodeResponsePayload();
        self::assertSame('frame_trap', $created['category'] ?? null);

        $this->client->request('GET', sprintf('/api/replay-review-sessions/%s/annotations', $sessionId), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $listed = $this->decodeResponsePayload();
        self::assertCount(1, $listed);
        self::assertSame('Plus frame check', $listed[0]['title'] ?? null);
    }

    public function testAnnotationRejectsInvalidCategory(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/annotations', $sessionId), [], [], $this->jsonHeaders(), json_encode([
            'startTimeMs' => 1000,
            'endTimeMs' => 4500,
            'eventKind' => ReplayAnnotation::EVENT_KIND_MEMORY,
            'category' => 'dropped_combo',
        ]));

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testAnnotationRejectsInvalidRange(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/annotations', $sessionId), [], [], $this->jsonHeaders(), json_encode([
            'startTimeMs' => 4500,
            'endTimeMs' => 1000,
            'eventKind' => ReplayAnnotation::EVENT_KIND_MEMORY,
            'category' => 'frame_trap',
        ]));

        self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode());
    }

    public function testExportCreatesPracticeTaskAndStudyCardOnce(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Remember the trap');
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_TASK, 'missed_anti_air', 'Drill anti-air');

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $export = $this->decodeResponsePayload();
        self::assertSame(2, $export['clipsCreated'] ?? null);
        self::assertSame(1, $export['tasksCreated'] ?? null);
        self::assertSame(1, $export['studyCardsCreated'] ?? null);
        self::assertSame(0, $export['failed'] ?? null);

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $secondExport = $this->decodeResponsePayload();
        self::assertSame(0, $secondExport['clipsCreated'] ?? null);
        self::assertSame(2, $secondExport['skipped'] ?? null);
    }

    public function testBrowserUploadedClipCanBeFinalizedIntoStudyCard(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $annotationId = $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Remember browser clip');

        $clipPath = tempnam(sys_get_temp_dir(), 'fgc-browser-clip-');
        self::assertIsString($clipPath);
        file_put_contents($clipPath, "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isomclip-bytes");

        try {
            $this->client->request('POST', sprintf('/api/replay-annotations/%s/clip', $annotationId), ['durationMs' => '3500'], [
                'clip' => new UploadedFile($clipPath, 'browser-clip.mp4', 'video/mp4', null, true),
            ], $this->getHeaders());

            self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
            $clip = $this->decodeResponsePayload();
            self::assertSame('video/mp4', $clip['mimeType'] ?? null);
            self::assertSame(3500, $clip['durationMs'] ?? null);

            $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());

            self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
            $export = $this->decodeResponsePayload();
            self::assertSame(0, $export['clipsCreated'] ?? null);
            self::assertSame(1, $export['studyCardsCreated'] ?? null);
            self::assertSame(0, $export['failed'] ?? null);
        } finally {
            if (is_file($clipPath)) {
                unlink($clipPath);
            }
        }
    }

    public function testInvalidBrowserClipUploadReturnsUploadFailureReason(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $annotationId = $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Invalid browser clip');
        $clipPath = tempnam(sys_get_temp_dir(), 'fgc-browser-clip-invalid-');
        self::assertIsString($clipPath);
        file_put_contents($clipPath, 'clip-bytes');

        try {
            $this->client->request('POST', sprintf('/api/replay-annotations/%s/clip', $annotationId), ['durationMs' => '3500'], [
                'clip' => new UploadedFile($clipPath, 'browser-clip.mp4', 'video/mp4', UPLOAD_ERR_CANT_WRITE, true),
            ], $this->getHeaders());

            self::assertSame(Response::HTTP_BAD_REQUEST, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
            $payload = $this->decodeResponsePayload();
            self::assertStringContainsString('Clip upload failed:', (string) ($payload['message'] ?? ''));
        } finally {
            if (is_file($clipPath)) {
                unlink($clipPath);
            }
        }
    }

    public function testTaskScheduleMetadataExportsToPracticeTask(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/annotations', $sessionId), [], [], $this->jsonHeaders(), json_encode([
            'startTimeMs' => 1000,
            'endTimeMs' => 4500,
            'eventKind' => ReplayAnnotation::EVENT_KIND_TASK,
            'category' => 'missed_anti_air',
            'title' => 'Daily anti-air reps',
            'notes' => "Drill the jump-in.\n\nReplay Task Schedule\nSchedule: daily_for_n_days\nOccurrences: 5\nDue: 2030-01-02T03:04:00+00:00",
        ]));
        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $this->client->request('GET', '/api/practice-tasks?status=pending', [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $tasks = $this->decodeResponsePayload();
        $matchedTask = null;
        foreach ($tasks as $task) {
            if (is_array($task) && 'Daily anti-air reps' === ($task['title'] ?? null)) {
                $matchedTask = $task;
                break;
            }
        }
        self::assertIsArray($matchedTask);
        self::assertSame('daily_for_n_days', $matchedTask['scheduleType'] ?? null);
        self::assertSame(5, $matchedTask['remainingOccurrences'] ?? null);
        self::assertStringStartsWith('2030-01-02T03:04:00', (string) ($matchedTask['dueDate'] ?? ''));
    }

    public function testDeletingReplayOriginalDoesNotBreakExportedLearningItems(): void
    {
        $videoId = $this->createReplayVideoAndReturnId();
        $this->client->request('POST', '/api/replay-review-sessions', [], [], $this->jsonHeaders(), json_encode([
            'videoId' => $videoId,
            'title' => 'Replay review before cleanup',
        ]));
        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $session = $this->decodeResponsePayload();
        $sessionId = (string) ($session['id'] ?? '');
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Remember deleted source');
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_TASK, 'missed_anti_air', 'Practice deleted source');

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $this->client->request('DELETE', sprintf('/api/replay-videos/%s', $videoId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_NO_CONTENT, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());

        $this->client->request('GET', '/api/practice-tasks?status=pending', [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $tasks = $this->decodeResponsePayload();
        $matchedTask = null;
        foreach ($tasks as $task) {
            if (is_array($task) && 'Practice deleted source' === ($task['title'] ?? null)) {
                $matchedTask = $task;
                break;
            }
        }
        self::assertIsArray($matchedTask);
        self::assertIsArray($matchedTask['clip'] ?? null);

        $this->client->request('GET', '/api/study/cards/due', [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $cards = $this->decodeResponsePayload();
        $matchedCard = null;
        foreach ($cards as $card) {
            if (is_array($card) && 'What is this clip?' === ($card['prompt'] ?? null) && 'frame_trap' === ($card['category'] ?? null)) {
                $matchedCard = $card;
                break;
            }
        }
        self::assertIsArray($matchedCard);
        self::assertIsArray($matchedCard['clip'] ?? null);
    }

    public function testExportFailureDoesNotCreateIncompleteLearningItem(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $annotationId = $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'fail_clip');

        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $export = $this->decodeResponsePayload();
        self::assertSame(0, $export['clipsCreated'] ?? null);
        self::assertSame(0, $export['studyCardsCreated'] ?? null);
        self::assertSame(1, $export['failed'] ?? null);

        $annotation = $this->entityManager?->getRepository(ReplayAnnotation::class)->find($annotationId);
        self::assertInstanceOf(ReplayAnnotation::class, $annotation);
        self::assertNull($annotation->getExportedClip());
        self::assertSame('Fake clip generation failed.', $annotation->getExportError());
        self::assertNull($this->entityManager?->getRepository(StudyCard::class)->findOneBy(['sourceAnnotation' => $annotation]));
    }

    public function testCleanupExpiresReplayOriginalWithoutBreakingExportedStudyClip(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Remember the trap');
        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $video = $this->entityManager?->getRepository(ReplayVideo::class)->findOneBy([]);
        self::assertInstanceOf(ReplayVideo::class, $video);
        $clip = $this->entityManager?->getRepository(ReplayClip::class)->findOneBy([]);
        self::assertInstanceOf(ReplayClip::class, $clip);
        $this->writeStoredObject($clip->getStorageKey(), 'clip-bytes');
        $video->setDeleteAfter(new \DateTimeImmutable('-1 day'));
        $this->entityManager?->flush();

        $cleanup = static::getContainer()->get(ReplayLabCleanupService::class);
        self::assertInstanceOf(ReplayLabCleanupService::class, $cleanup);
        $result = $cleanup->cleanup(new \DateTimeImmutable(), 100);

        self::assertSame(1, $result->toArray()['expiredReplays']);
        self::assertSame(ReplayVideo::STATUS_EXPIRED, $video->getStatus());
        self::assertSame(ReplayClip::STATUS_READY, $clip->getStatus());
        self::assertNotNull($this->entityManager?->getRepository(StudyCard::class)->findOneBy(['clip' => $clip]));

        $this->client->request('GET', sprintf('/api/replay-clips/%s/playback', (string) $clip->getId()), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
    }

    public function testCleanupDeletesOrphanClipFiles(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $annotationId = $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Orphan marker');
        $annotation = $this->entityManager?->getRepository(ReplayAnnotation::class)->find($annotationId);
        self::assertInstanceOf(ReplayAnnotation::class, $annotation);
        $owner = $annotation->getSession()?->getOwnerUser();
        self::assertInstanceOf(User::class, $owner);

        $clip = (new ReplayClip())
            ->setOwnerUser($owner)
            ->setSourceVideo($annotation->getSession()?->getVideo())
            ->setSourceAnnotation($annotation)
            ->setStorageKey(sprintf('clips/test/orphan-%s.mp4', bin2hex(random_bytes(4))))
            ->setMimeType('video/mp4')
            ->setSizeBytes(128)
            ->setDurationMs(1000)
            ->setStartTimeMs(1000)
            ->setEndTimeMs(2000)
            ->setStatus(ReplayClip::STATUS_READY)
            ->setCreatedAt(new \DateTimeImmutable('-2 days'));
        $this->entityManager?->persist($clip);
        $this->entityManager?->flush();
        $this->writeStoredObject($clip->getStorageKey(), 'orphan-clip');

        $cleanup = static::getContainer()->get(ReplayLabCleanupService::class);
        self::assertInstanceOf(ReplayLabCleanupService::class, $cleanup);
        $result = $cleanup->cleanup(new \DateTimeImmutable(), 100);

        self::assertSame(1, $result->toArray()['deletedOrphanClips']);
        self::assertSame(ReplayClip::STATUS_DELETED, $clip->getStatus());
        self::assertFalse($this->storedObjectExists($clip->getStorageKey()));
    }

    public function testReplayClipPlaybackReturnsExportedClipMedia(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Remember the trap');
        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $clip = $this->entityManager?->getRepository(ReplayClip::class)->findOneBy([]);
        self::assertInstanceOf(ReplayClip::class, $clip);
        $this->writeStoredObject($clip->getStorageKey(), 'clip-bytes');

        $this->client->request('GET', sprintf('/api/replay-clips/%s/playback', (string) $clip->getId()), [], [], $this->getHeaders());

        $response = $this->client->getResponse();
        self::assertSame(Response::HTTP_OK, $response->getStatusCode(), (string) $response->getContent());
        self::assertSame('video/mp4', $response->headers->get('content-type'));
    }

    public function testPracticeTasksCanBeListedAndCompleted(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_TASK, 'missed_anti_air', 'Drill anti-air');
        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', '/api/practice-tasks?status=pending', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $tasks = $this->decodeResponsePayload();
        self::assertCount(1, $tasks);
        self::assertSame('Drill anti-air', $tasks[0]['title'] ?? null);
        self::assertSame('', $tasks[0]['description'] ?? null);
        self::assertNotNull($tasks[0]['clip'] ?? null);

        $this->client->request('POST', sprintf('/api/practice-tasks/%s/complete', $tasks[0]['id']), [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $completedTask = $this->decodeResponsePayload();
        self::assertSame('done', $completedTask['status'] ?? null);
        self::assertSame(1, $completedTask['completedOccurrences'] ?? null);
    }

    public function testDueStudyCardsCanBeReviewed(): void
    {
        $sessionId = $this->createReplaySessionAndReturnId();
        $this->createAnnotation($sessionId, ReplayAnnotation::EVENT_KIND_MEMORY, 'frame_trap', 'Remember the trap');
        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/export', $sessionId), [], [], $this->getHeaders());
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());

        $this->client->request('GET', '/api/study/cards/due', [], [], $this->getHeaders());

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $cards = $this->decodeResponsePayload();
        self::assertCount(1, $cards);
        self::assertSame('What is this clip?', $cards[0]['prompt'] ?? null);
        self::assertArrayNotHasKey('correctAnswer', $cards[0]);

        $this->client->request('POST', sprintf('/api/study/cards/%s/review', $cards[0]['id']), [], [], $this->jsonHeaders(), json_encode([
            'rating' => 'good',
            'wasCorrect' => true,
        ]));

        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $review = $this->decodeResponsePayload();
        self::assertSame('good', $review['review']['rating'] ?? null);
        self::assertSame(1, $review['card']['intervalDays'] ?? null);
        self::assertSame(1, $review['card']['repetitionCount'] ?? null);
        self::assertArrayHasKey('correctAnswer', $review['card']);
        self::assertSame('Frame Trap', $review['card']['correctAnswer'] ?? null);
    }

    private function uploadReplayVideo(): void
    {
        $this->client->request('POST', '/api/replay-videos', ['fps' => '60'], [
            'video' => new UploadedFile($this->uploadPath, 'replay.mp4', 'video/mp4', null, true),
        ], $this->getHeaders());
    }

    private function writeStoredObject(string $storageKey, string $content): void
    {
        $pathResolver = static::getContainer()->get(LocalVideoPathResolver::class);
        self::assertInstanceOf(LocalVideoPathResolver::class, $pathResolver);
        $path = $pathResolver->resolvePath($storageKey);
        $directory = dirname($path);
        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }
        file_put_contents($path, $content);
    }

    private function storedObjectExists(string $storageKey): bool
    {
        $pathResolver = static::getContainer()->get(LocalVideoPathResolver::class);
        self::assertInstanceOf(LocalVideoPathResolver::class, $pathResolver);

        return is_file($pathResolver->resolvePath($storageKey));
    }

    /**
     * @return array<string, string>
     */
    private function loginHeadersForUser(string $username): array
    {
        $user = $this->entityManager?->getRepository(User::class)->findOneBy(['username' => $username]);
        if (!$user instanceof User) {
            $user = (new User())
                ->setUsername($username)
                ->setPassword(self::hashTestPassword())
                ->setIsActive(true);
            $this->entityManager?->persist($user);
        } else {
            $user
                ->setPassword(self::hashTestPassword())
                ->setIsActive(true);
        }
        $this->entityManager?->flush();

        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $username,
            'password' => 'testpassword',
        ]));
        self::assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $payload = $this->decodeResponsePayload();

        return ['HTTP_X_CSRF_TOKEN' => (string) ($payload['csrfToken'] ?? '')];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function createShareLink(string $sessionId, array $payload = []): array
    {
        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/share-links', $sessionId), [], [], $this->jsonHeaders(), json_encode($payload));
        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode(), (string) $this->client->getResponse()->getContent());
        $created = $this->decodeResponsePayload();
        self::assertIsString($created['id'] ?? null);
        self::assertIsString($created['token'] ?? null);

        return $created;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function createShareLinkAndReturnToken(string $sessionId, array $payload = []): string
    {
        $created = $this->createShareLink($sessionId, $payload);

        return (string) $created['token'];
    }

    private function createReplayVideoAndReturnId(): string
    {
        $this->uploadReplayVideo();
        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $payload = $this->decodeResponsePayload();
        self::assertIsString($payload['id'] ?? null);

        return $payload['id'];
    }

    private function createReplaySessionAndReturnId(): string
    {
        $videoId = $this->createReplayVideoAndReturnId();
        $this->client->request('POST', '/api/replay-review-sessions', [], [], $this->jsonHeaders(), json_encode([
            'videoId' => $videoId,
            'title' => 'Replay review',
        ]));
        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $payload = $this->decodeResponsePayload();
        self::assertIsString($payload['id'] ?? null);

        return $payload['id'];
    }

    private function createAnnotation(string $sessionId, string $eventKind, string $category, string $title): string
    {
        $this->client->request('POST', sprintf('/api/replay-review-sessions/%s/annotations', $sessionId), [], [], $this->jsonHeaders(), json_encode([
            'startTimeMs' => 1000,
            'endTimeMs' => 4500,
            'eventKind' => $eventKind,
            'category' => $category,
            'title' => $title,
            'answer' => 'Respect the plus frames.',
        ]));

        self::assertSame(Response::HTTP_CREATED, $this->client->getResponse()->getStatusCode());
        $payload = $this->decodeResponsePayload();
        self::assertIsString($payload['id'] ?? null);

        return $payload['id'];
    }

    /**
     * @return array<string, string>
     */
    private function jsonHeaders(): array
    {
        return array_merge($this->getHeaders(), ['CONTENT_TYPE' => 'application/json']);
    }

    /**
     * @return array<mixed>
     */
    private function decodeResponsePayload(): array
    {
        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($payload);

        return $payload;
    }
}
