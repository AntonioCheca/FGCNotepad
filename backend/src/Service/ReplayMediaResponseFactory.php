<?php declare(strict_types=1);

namespace App\Service;

use App\Service\ReplayStorage\LocalVideoPathResolver;
use App\Service\ReplayStorage\VideoStorageInterface;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ReplayMediaResponseFactory
{
    public function __construct(
        private readonly VideoStorageInterface $storage,
        private readonly LocalVideoPathResolver $pathResolver,
    ) {
    }

    public function createPlaybackResponse(string $storageKey, string $mimeType, string $filename): Response
    {
        if (!$this->storage->exists($storageKey)) {
            throw new NotFoundHttpException('Replay media file not found.');
        }

        $response = new BinaryFileResponse($this->pathResolver->resolvePath($storageKey));
        $response->headers->set('Content-Type', $mimeType);
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $filename);

        return $response;
    }
}
