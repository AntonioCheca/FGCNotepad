<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ReplayAnnotation;

interface ReplayClipGeneratorInterface
{
    public function generate(ReplayAnnotation $annotation): ReplayClipGenerationResult;
}
