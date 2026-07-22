<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\PracticeTask;
use App\Entity\ReplayAnnotation;
use App\Entity\ReplayClip;
use App\Entity\StudyCard;
use App\Entity\User;
use App\Repository\PracticeTaskRepository;
use App\Repository\ReplayClipRepository;
use App\Repository\StudyCardRepository;
use App\Service\ReplayStorage\VideoStorageInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class BrowserReplayClipIngestService
{
    public function __construct(
        private readonly VideoStorageInterface $storage,
        private readonly ReplayLabLimits $limits,
        private readonly ReplayClipRepository $clipRepository,
        private readonly PracticeTaskRepository $practiceTaskRepository,
        private readonly StudyCardRepository $studyCardRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function ingest(User $owner, ReplayAnnotation $annotation, UploadedFile $file, int $durationMs): ReplayClip
    {
        $session = $annotation->getSession();
        if (null === $session || $session->getOwnerUser() !== $owner) {
            throw new BadRequestHttpException('Annotation is not attached to an owned session.');
        }

        if (null !== $annotation->getExportedClip()
            || null !== $this->clipRepository->findOneBy(['sourceAnnotation' => $annotation])
            || null !== $this->practiceTaskRepository->findOneBy(['sourceAnnotation' => $annotation])
            || null !== $this->studyCardRepository->findOneBy(['sourceAnnotation' => $annotation])) {
            throw new BadRequestHttpException('Annotation is already exported.');
        }

        if (!$file->isValid()) {
            throw new BadRequestHttpException(sprintf('Clip upload failed: %s', $file->getErrorMessage()));
        }

        $sizeBytes = $file->getSize();
        if (null === $sizeBytes || $sizeBytes <= 0) {
            throw new BadRequestHttpException('Clip file is empty.');
        }

        if ($durationMs <= 0 || $durationMs > (($annotation->getEndTimeMs() - $annotation->getStartTimeMs()) + 1000)) {
            throw new BadRequestHttpException('Clip duration does not match annotation range.');
        }

        try {
            $mimeType = $file->getMimeType();
        } catch (\Throwable) {
            $mimeType = null;
        }

        $mimeType ??= $file->getClientMimeType();
        if (in_array($mimeType, ['application/octet-stream', 'binary/octet-stream'], true) && 'mp4' === strtolower($file->getClientOriginalExtension())) {
            $mimeType = 'video/mp4';
        }
        if ('video/mp4' !== $mimeType && 'application/mp4' !== $mimeType) {
            throw new BadRequestHttpException('Browser-exported clips must be MP4.');
        }

        $this->limits->assertClipAllowed($owner, $sizeBytes, $durationMs);
        $storedObject = $this->storage->store($this->buildClipStorageKey($owner), $file->getPathname(), 'video/mp4');

        $clip = (new ReplayClip())
            ->setOwnerUser($owner)
            ->setSourceVideo($session->getVideo())
            ->setSourceAnnotation($annotation)
            ->setStorageKey($storedObject->getStorageKey())
            ->setMimeType('video/mp4')
            ->setSizeBytes($storedObject->getSizeBytes())
            ->setDurationMs($durationMs)
            ->setStartTimeMs($annotation->getStartTimeMs())
            ->setEndTimeMs($annotation->getEndTimeMs())
            ->setStartFrame($annotation->getStartFrame())
            ->setEndFrame($annotation->getEndFrame())
            ->setStatus(ReplayClip::STATUS_READY);

        $annotation
            ->setExportedClip($clip)
            ->setExportError(null)
            ->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($clip);
        $this->entityManager->flush();

        return $clip;
    }

    private function buildClipStorageKey(User $owner): string
    {
        $userId = (string) $owner->getId();
        if ('' === $userId) {
            throw new \LogicException('Replay clip owner must be persisted before upload.');
        }

        return sprintf('clips/%s/%s/clip.mp4', $userId, bin2hex(random_bytes(16)));
    }
}
