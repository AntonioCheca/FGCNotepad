<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\PracticeTask;
use App\Entity\ReplayAnnotation;
use App\Entity\ReplayClip;
use App\Entity\ReplayReviewSession;
use App\Entity\StudyCard;
use App\Entity\User;
use App\Repository\PracticeTaskRepository;
use App\Repository\ReplayAnnotationRepository;
use App\Repository\ReplayClipRepository;
use App\Repository\StudyCardRepository;
use Doctrine\ORM\EntityManagerInterface;

final class ReplayAnnotationExportService
{
    public function __construct(
        private readonly ReplayAnnotationRepository $annotationRepository,
        private readonly ReplayClipRepository $clipRepository,
        private readonly PracticeTaskRepository $practiceTaskRepository,
        private readonly StudyCardRepository $studyCardRepository,
        private readonly ReplayClipGeneratorInterface $clipGenerator,
        private readonly ReplayLabLimits $limits,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function exportSession(ReplayReviewSession $session): ReplayAnnotationExportResult
    {
        $result = new ReplayAnnotationExportResult();
        $annotations = $this->annotationRepository->findBy(['session' => $session], ['startTimeMs' => 'ASC']);

        foreach ($annotations as $annotation) {
            $this->exportAnnotation($annotation, $result);
        }

        $this->entityManager->flush();

        return $result;
    }

    private function exportAnnotation(ReplayAnnotation $annotation, ReplayAnnotationExportResult $result): void
    {
        $session = $annotation->getSession();
        $owner = $session?->getOwnerUser();
        if (!$owner instanceof User) {
            $result->addFailure((string) $annotation->getId(), 'Annotation has no owner context.');
            return;
        }

        if ($this->hasLearningExport($annotation)) {
            $result->addSkipped();
            return;
        }

        try {
            $clip = $annotation->getExportedClip() ?? $this->clipRepository->findOneBy(['sourceAnnotation' => $annotation]);
            if (!$clip instanceof ReplayClip) {
                $clip = $this->generateClip($annotation, $owner);
                $this->entityManager->persist($clip);
                $result->addClipCreated();
            }

            $annotation
                ->setExportedClip($clip)
                ->setExportError(null)
                ->setUpdatedAt(new \DateTimeImmutable());

            if (ReplayAnnotation::EVENT_KIND_TASK === $annotation->getEventKind()) {
                $this->entityManager->persist($this->createPracticeTask($annotation, $clip, $owner));
                $result->addTaskCreated();
                return;
            }

            if (ReplayAnnotation::EVENT_KIND_MEMORY === $annotation->getEventKind()) {
                $this->entityManager->persist($this->createStudyCard($annotation, $clip, $owner));
                $result->addStudyCardCreated();
                return;
            }

            $result->addSkipped();
        } catch (\Throwable $exception) {
            $message = $exception->getMessage();
            $annotation
                ->setExportError($message)
                ->setUpdatedAt(new \DateTimeImmutable());
            $result->addFailure((string) $annotation->getId(), $message);
        }
    }

    private function hasLearningExport(ReplayAnnotation $annotation): bool
    {
        return null !== $this->practiceTaskRepository->findOneBy(['sourceAnnotation' => $annotation])
            || null !== $this->studyCardRepository->findOneBy(['sourceAnnotation' => $annotation]);
    }

    private function generateClip(ReplayAnnotation $annotation, User $owner): ReplayClip
    {
        $session = $annotation->getSession();
        $generatedClip = $this->clipGenerator->generate($annotation);
        $this->limits->assertClipAllowed($owner, $generatedClip->getSizeBytes(), $generatedClip->getDurationMs());

        return (new ReplayClip())
            ->setOwnerUser($owner)
            ->setSourceVideo($session?->getVideo())
            ->setSourceAnnotation($annotation)
            ->setStorageKey($generatedClip->getStorageKey())
            ->setMimeType($generatedClip->getMimeType())
            ->setSizeBytes($generatedClip->getSizeBytes())
            ->setDurationMs($generatedClip->getDurationMs())
            ->setStartTimeMs($annotation->getStartTimeMs())
            ->setEndTimeMs($annotation->getEndTimeMs())
            ->setStartFrame($annotation->getStartFrame())
            ->setEndFrame($annotation->getEndFrame())
            ->setStatus(ReplayClip::STATUS_READY);
    }

    private function createPracticeTask(ReplayAnnotation $annotation, ReplayClip $clip, User $owner): PracticeTask
    {
        $schedule = $this->parseTaskSchedule($annotation->getNotes());

        return (new PracticeTask())
            ->setUser($owner)
            ->setSourceAnnotation($annotation)
            ->setClip($clip)
            ->setTitle($annotation->getTitle() ?? $this->humanizeCategory($annotation->getCategory()))
            ->setDescription('')
            ->setCategory($annotation->getCategory())
            ->setStatus(PracticeTask::STATUS_PENDING)
            ->setDueDate($schedule['dueDate'])
            ->setScheduleType($schedule['scheduleType'])
            ->setRemainingOccurrences($schedule['remainingOccurrences'])
            ->setCompletedOccurrences(0);
    }

    /**
     * @return array{scheduleType: string, remainingOccurrences: int, dueDate: ?\DateTimeImmutable}
     */
    private function parseTaskSchedule(?string $notes): array
    {
        $scheduleType = PracticeTask::SCHEDULE_ONCE;
        $remainingOccurrences = 1;
        $dueDate = null;

        if (null === $notes) {
            return [
                'scheduleType' => $scheduleType,
                'remainingOccurrences' => $remainingOccurrences,
                'dueDate' => $dueDate,
            ];
        }

        if (preg_match('/Schedule:\s*(once|daily_for_n_days|weekly|custom)/', $notes, $matches)) {
            $scheduleType = $matches[1];
        }

        if (preg_match('/Occurrences:\s*(\d+)/', $notes, $matches)) {
            $remainingOccurrences = max(1, (int) $matches[1]);
        }

        if (preg_match('/Due:\s*([^\r\n]+)/', $notes, $matches)) {
            try {
                $dueDate = new \DateTimeImmutable(trim($matches[1]));
            } catch (\Throwable) {
                $dueDate = null;
            }
        }

        return [
            'scheduleType' => $scheduleType,
            'remainingOccurrences' => $remainingOccurrences,
            'dueDate' => $dueDate,
        ];
    }

    private function createStudyCard(ReplayAnnotation $annotation, ReplayClip $clip, User $owner): StudyCard
    {
        return (new StudyCard())
            ->setUser($owner)
            ->setSourceAnnotation($annotation)
            ->setClip($clip)
            ->setFrontType(StudyCard::FRONT_TYPE_VIDEO_CLIP)
            ->setPrompt('What is this clip?')
            ->setCorrectAnswer($this->humanizeCategory($annotation->getCategory()))
            ->setCategory($annotation->getCategory())
            ->setDueAt(new \DateTimeImmutable())
            ->setIntervalDays(0)
            ->setRepetitionCount(0)
            ->setLapseCount(0);
    }

    private function humanizeCategory(string $category): string
    {
        return ucwords(str_replace('_', ' ', $category));
    }
}
