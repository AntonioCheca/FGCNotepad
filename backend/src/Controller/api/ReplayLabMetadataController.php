<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Service\ReplayLabLimits;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

final class ReplayLabMetadataController extends AbstractController
{
    public function __construct(private readonly ReplayLabLimits $limits)
    {
    }

    #[Route('/api/replay-lab/limits', name: 'api_replay_lab_limits', methods: ['GET'])]
    public function limits(): JsonResponse
    {
        return new JsonResponse($this->limits->toArray());
    }
}
