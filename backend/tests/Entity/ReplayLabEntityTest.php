<?php declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\PracticeTask;
use App\Entity\ReplayAnnotation;
use App\Entity\ReplayClip;
use App\Entity\ReplayReviewSession;
use App\Entity\ReplayVideo;
use App\Entity\StudyCard;
use App\Entity\StudyReviewLog;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class ReplayLabEntityTest extends TestCase
{
    public function testReplayVideoDefaultsToUploadedTemporalVideo(): void
    {
        $owner = (new User())->setUsername('antonio')->setPassword('hashed');
        $video = (new ReplayVideo())
            ->setOwnerUser($owner)
            ->setOriginalFilename('set-play.mp4')
            ->setStorageKey('replays/user/video/original.mp4')
            ->setMimeType('video/mp4')
            ->setSizeBytes(100)
            ->setDurationMs(5000)
            ->setFps(60.0);

        self::assertSame($owner, $video->getOwnerUser());
        self::assertSame(ReplayVideo::STATUS_UPLOADED, $video->getStatus());
        self::assertNull($video->getDeletedAt());
        self::assertNull($video->getDeleteAfter());
        self::assertSame(60.0, $video->getFps());
    }

    public function testAnnotationCanLinkToPermanentClipForExport(): void
    {
        $owner = (new User())->setUsername('reviewer')->setPassword('hashed');
        $video = (new ReplayVideo())->setOwnerUser($owner);
        $session = (new ReplayReviewSession())
            ->setVideo($video)
            ->setOwnerUser($owner)
            ->setCreatedByUser($owner)
            ->setTitle('Ranked set review');

        $annotation = (new ReplayAnnotation())
            ->setSession($session)
            ->setCreatedByUser($owner)
            ->setStartTimeMs(1000)
            ->setEndTimeMs(6500)
            ->setEventKind(ReplayAnnotation::EVENT_KIND_MEMORY)
            ->setCategory('frame_trap')
            ->setAnswer('Respect the plus frames.');

        $clip = (new ReplayClip())
            ->setOwnerUser($owner)
            ->setSourceVideo($video)
            ->setSourceAnnotation($annotation)
            ->setStorageKey('clips/user/clip.mp4')
            ->setMimeType('video/mp4')
            ->setSizeBytes(256)
            ->setDurationMs(5500)
            ->setStartTimeMs($annotation->getStartTimeMs())
            ->setEndTimeMs($annotation->getEndTimeMs());

        $annotation->setExportedClip($clip);

        self::assertSame($clip, $annotation->getExportedClip());
        self::assertSame($annotation, $clip->getSourceAnnotation());
        self::assertSame(ReplayClip::STATUS_PENDING, $clip->getStatus());
    }

    public function testPracticeTaskAndStudyCardCanDependOnPermanentClip(): void
    {
        $user = (new User())->setUsername('student')->setPassword('hashed');
        $annotation = (new ReplayAnnotation())->setCreatedByUser($user);
        $clip = (new ReplayClip())->setOwnerUser($user)->setSourceAnnotation($annotation);

        $task = (new PracticeTask())
            ->setUser($user)
            ->setSourceAnnotation($annotation)
            ->setClip($clip)
            ->setTitle('Anti-air drill')
            ->setDescription('Practice the missed anti-air situation.')
            ->setCategory('missed_anti_air');

        $card = (new StudyCard())
            ->setUser($user)
            ->setSourceAnnotation($annotation)
            ->setClip($clip)
            ->setPrompt('What is this clip?')
            ->setCorrectAnswer('Reactable gap')
            ->setCategory('reactable_gap');

        $log = (new StudyReviewLog())
            ->setUser($user)
            ->setCard($card)
            ->setRating(StudyReviewLog::RATING_GOOD)
            ->setWasCorrect(true);

        self::assertSame(PracticeTask::STATUS_PENDING, $task->getStatus());
        self::assertSame(PracticeTask::SCHEDULE_ONCE, $task->getScheduleType());
        self::assertSame($clip, $task->getClip());
        self::assertSame(StudyCard::FRONT_TYPE_VIDEO_CLIP, $card->getFrontType());
        self::assertSame($clip, $card->getClip());
        self::assertTrue($log->wasCorrect());
    }
}
