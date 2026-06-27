<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\ReplayAnnotation;
use App\Service\ReplayClipGenerationResult;
use App\Service\ReplayClipGeneratorInterface;

final class FakeReplayClipGenerator implements ReplayClipGeneratorInterface
{
    public function generate(ReplayAnnotation $annotation): ReplayClipGenerationResult
    {
        if ('fail_clip' === $annotation->getTitle()) {
            throw new \RuntimeException('Fake clip generation failed.');
        }

        $id = (string) ($annotation->getId() ?? bin2hex(random_bytes(4)));

        return new ReplayClipGenerationResult(
            sprintf('clips/test/%s.mp4', $id),
            'video/mp4',
            128,
            $annotation->getEndTimeMs() - $annotation->getStartTimeMs(),
        );
    }
}
