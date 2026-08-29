<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Service\TurnsGuideService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/guides', name: 'api_guides_')]
final class GuideController extends AbstractController
{
    public function __construct(private readonly TurnsGuideService $turnsGuideService)
    {
    }

    #[Route('/turns', name: 'turns', methods: ['GET'])]
    public function turns(): JsonResponse
    {
        return new JsonResponse($this->turnsGuideService->buildGuide());
    }
}
