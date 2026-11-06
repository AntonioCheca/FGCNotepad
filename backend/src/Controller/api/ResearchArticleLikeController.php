<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Service\ResearchArticleLikeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/research/{slug}/likes', name: 'api_research_likes_')]
final class ResearchArticleLikeController extends AbstractController
{
    public function __construct(
        private readonly ResearchArticleLikeService $likeService,
        #[Autowire(service: 'limiter.research_like')]
        private readonly RateLimiterFactoryInterface $likeLimiter,
    ) {
    }

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(string $slug): JsonResponse
    {
        if (!ResearchArticleLikeService::isValidSlug($slug)) {
            return $this->unknownArticle();
        }

        return new JsonResponse(['count' => $this->likeService->count($slug)]);
    }

    #[Route('', name: 'like', methods: ['POST'])]
    public function like(string $slug, Request $request): JsonResponse
    {
        if (!ResearchArticleLikeService::isValidSlug($slug)) {
            return $this->unknownArticle();
        }

        $limit = $this->likeLimiter->create($request->getClientIp() ?? 'unknown')->consume();
        if (!$limit->isAccepted()) {
            $response = new JsonResponse(['message' => 'Too many likes for now. Try again later.'], Response::HTTP_TOO_MANY_REQUESTS);
            $response->headers->set('Retry-After', (string) max(1, $limit->getRetryAfter()->getTimestamp() - time()));

            return $response;
        }

        return new JsonResponse(['count' => $this->likeService->like($slug)]);
    }

    private function unknownArticle(): JsonResponse
    {
        return new JsonResponse(['message' => 'Unknown article.'], Response::HTTP_BAD_REQUEST);
    }
}
