<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\PracticeTask;
use App\Entity\ReplayAnnotation;
use App\Entity\ReplayClip;
use App\Entity\ReplayReviewSession;
use App\Entity\ReplayVideo;
use App\Entity\StudyCard;

final class ReplayLabResponseBuilder
{
    /**
     * @return array<string, mixed>
     */
    public function video(ReplayVideo $video): array
    {
        return [
            'id' => (string) $video->getId(),
            'sourceType' => $video->getSourceType(),
            'originalFilename' => $video->getOriginalFilename(),
            'youtubeVideoId' => $video->getYoutubeVideoId(),
            'youtubeUrl' => $video->getYoutubeUrl(),
            'mimeType' => $video->getMimeType(),
            'sizeBytes' => $video->getSizeBytes(),
            'durationMs' => $video->getDurationMs(),
            'fps' => $video->getFps(),
            'status' => $video->getStatus(),
            'deleteAfter' => $video->getDeleteAfter()?->format(\DateTimeInterface::ATOM),
            'createdAt' => $video->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $video->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function session(ReplayReviewSession $session): array
    {
        return [
            'id' => (string) $session->getId(),
            'video' => null !== $session->getVideo() ? $this->video($session->getVideo()) : null,
            'ownerUserId' => (string) $session->getOwnerUser()?->getId(),
            'createdByUserId' => (string) $session->getCreatedByUser()?->getId(),
            'title' => $session->getTitle(),
            'status' => $session->getStatus(),
            'createdAt' => $session->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $session->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function annotation(ReplayAnnotation $annotation): array
    {
        return [
            'id' => (string) $annotation->getId(),
            'sessionId' => (string) $annotation->getSession()?->getId(),
            'createdByUserId' => (string) $annotation->getCreatedByUser()?->getId(),
            'startTimeMs' => $annotation->getStartTimeMs(),
            'endTimeMs' => $annotation->getEndTimeMs(),
            'startFrame' => $annotation->getStartFrame(),
            'endFrame' => $annotation->getEndFrame(),
            'eventKind' => $annotation->getEventKind(),
            'category' => $annotation->getCategory(),
            'title' => $annotation->getTitle(),
            'notes' => $annotation->getNotes(),
            'answer' => $annotation->getAnswer(),
            'exportedClip' => null !== $annotation->getExportedClip() ? $this->clip($annotation->getExportedClip()) : null,
            'exportError' => $annotation->getExportError(),
            'createdAt' => $annotation->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $annotation->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function clip(ReplayClip $clip): array
    {
        return [
            'id' => (string) $clip->getId(),
            'sourceVideoId' => (string) $clip->getSourceVideo()?->getId(),
            'sourceAnnotationId' => (string) $clip->getSourceAnnotation()?->getId(),
            'mimeType' => $clip->getMimeType(),
            'sizeBytes' => $clip->getSizeBytes(),
            'durationMs' => $clip->getDurationMs(),
            'startTimeMs' => $clip->getStartTimeMs(),
            'endTimeMs' => $clip->getEndTimeMs(),
            'startFrame' => $clip->getStartFrame(),
            'endFrame' => $clip->getEndFrame(),
            'status' => $clip->getStatus(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function practiceTask(PracticeTask $task): array
    {
        return [
            'id' => (string) $task->getId(),
            'title' => $task->getTitle(),
            'description' => $task->getDescription(),
            'category' => $task->getCategory(),
            'status' => $task->getStatus(),
            'dueDate' => $task->getDueDate()?->format(\DateTimeInterface::ATOM),
            'scheduleType' => $task->getScheduleType(),
            'remainingOccurrences' => $task->getRemainingOccurrences(),
            'completedOccurrences' => $task->getCompletedOccurrences(),
            'completedAt' => $task->getCompletedAt()?->format(\DateTimeInterface::ATOM),
            'clip' => null !== $task->getClip() ? $this->clip($task->getClip()) : null,
            'createdAt' => $task->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $task->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function studyCard(StudyCard $card, bool $includeAnswer = false): array
    {
        $payload = [
            'id' => (string) $card->getId(),
            'frontType' => $card->getFrontType(),
            'prompt' => $card->getPrompt(),
            'category' => $card->getCategory(),
            'dueAt' => $card->getDueAt()->format(\DateTimeInterface::ATOM),
            'intervalDays' => $card->getIntervalDays(),
            'repetitionCount' => $card->getRepetitionCount(),
            'lapseCount' => $card->getLapseCount(),
            'clip' => null !== $card->getClip() ? $this->clip($card->getClip()) : null,
        ];

        if ($includeAnswer) {
            $payload['correctAnswer'] = $card->getCorrectAnswer();
        }

        return $payload;
    }
}
