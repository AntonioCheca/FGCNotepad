<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayAnnotation;
use App\Entity\ReplayVideo;
use App\Entity\User;
use App\Service\ReplayStorage\LocalVideoPathResolver;
use App\Service\ReplayStorage\VideoStorageInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Process\Process;

final class FfmpegReplayClipGenerator implements ReplayClipGeneratorInterface
{
    public function __construct(
        private readonly VideoStorageInterface $storage,
        private readonly LocalVideoPathResolver $pathResolver,
        private readonly ReplayLabLimits $limits,
        private readonly string $ffmpegBinary,
        private readonly int $maxClipDurationSeconds,
    ) {
    }

    public function generate(ReplayAnnotation $annotation): ReplayClipGenerationResult
    {
        $session = $annotation->getSession();
        $video = $session?->getVideo();
        $owner = $session?->getOwnerUser();
        if (!$video instanceof ReplayVideo || !$owner instanceof User) {
            throw new BadRequestHttpException('Annotation is missing replay source context.');
        }

        $durationMs = $annotation->getEndTimeMs() - $annotation->getStartTimeMs();
        if ($annotation->getStartTimeMs() < 0 || $durationMs <= 0) {
            throw new BadRequestHttpException('Annotation range is invalid.');
        }

        if ($durationMs > ($this->maxClipDurationSeconds * 1000)) {
            throw new BadRequestHttpException('Annotation clip exceeds the configured duration limit.');
        }

        $sourcePath = $this->pathResolver->resolvePath($video->getStorageKey());
        if (!is_file($sourcePath)) {
            throw new \RuntimeException('Replay source file is missing from storage.');
        }

        $temporaryClipPath = tempnam(sys_get_temp_dir(), 'fgc-replay-clip-');
        if (!is_string($temporaryClipPath)) {
            throw new \RuntimeException('Could not allocate temporary clip file.');
        }

        $outputPath = $temporaryClipPath . '.mp4';
        @unlink($temporaryClipPath);

        try {
            $process = new Process([
                $this->ffmpegBinary,
                '-y',
                '-ss',
                $this->formatSeconds($annotation->getStartTimeMs()),
                '-i',
                $sourcePath,
                '-t',
                $this->formatSeconds($durationMs),
                '-c',
                'copy',
                $outputPath,
            ]);
            $process->setTimeout(30);
            $process->run();

            if (!$process->isSuccessful() || !is_file($outputPath)) {
                throw new \RuntimeException(trim($process->getErrorOutput()) ?: 'ffmpeg failed to generate replay clip.');
            }

            $storageKey = sprintf('clips/%s/%s.mp4', (string) $owner->getId(), bin2hex(random_bytes(16)));
            $storedObject = $this->storage->store($storageKey, $outputPath, 'video/mp4');
            try {
                $this->limits->assertClipAllowed($owner, $storedObject->getSizeBytes(), $durationMs);
            } catch (\Throwable $exception) {
                if ($this->storage->exists($storedObject->getStorageKey())) {
                    $this->storage->delete($storedObject->getStorageKey());
                }
                throw $exception;
            }

            return new ReplayClipGenerationResult(
                $storedObject->getStorageKey(),
                $storedObject->getMimeType(),
                $storedObject->getSizeBytes(),
                $durationMs,
            );
        } finally {
            if (is_file($outputPath)) {
                @unlink($outputPath);
            }
        }
    }

    private function formatSeconds(int $milliseconds): string
    {
        return number_format($milliseconds / 1000, 3, '.', '');
    }
}
