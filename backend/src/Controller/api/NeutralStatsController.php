<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Service\Modern\ComboExecutionModePreferenceService;
use App\Service\NeutralStatsFilterParser;
use App\Service\NeutralStatsFilters;
use Symfony\Bundle\SecurityBundle\Security;
use App\Service\NeutralStatsService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/neutral-stats', name: 'api_neutral_stats_')]
class NeutralStatsController extends AbstractController
{
    public function __construct(
        private readonly NeutralStatsService $neutralStatsService,
        private readonly NeutralStatsFilterParser $filterParser,
        private readonly ComboExecutionModePreferenceService $executionModePreferenceService,
        private readonly Security $security,
    ) {
    }

    #[Route('', name: 'show', methods: ['GET'])]
    public function show(Request $request): JsonResponse
    {
        try {
            return new JsonResponse($this->neutralStatsService->stats($this->filterParser->parse($request->query->all(), $this->defaultControlScheme())));
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }
    }

    #[Route('/options', name: 'options', methods: ['GET'])]
    public function options(Request $request): JsonResponse
    {
        $characterId = $this->uuidOrNull($request->query->get('character'));
        $opponentId = $this->uuidOrNull($request->query->get('opponent'));
        if (false === $characterId || false === $opponentId) {
            return new JsonResponse(['error' => 'character and opponent must be character ids.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            return new JsonResponse($this->neutralStatsService->options($characterId, $opponentId));
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }
    }

    private function defaultControlScheme(): string
    {
        $user = $this->security->getUser();

        return $this->executionModePreferenceService->resolveForUser($user instanceof User ? $user : null)->isModern()
            ? NeutralStatsFilters::CONTROL_SCHEME_MODERN
            : NeutralStatsFilters::CONTROL_SCHEME_CLASSIC;
    }

    private function uuidOrNull(mixed $value): string|false|null
    {
        if (!is_string($value) || '' === trim($value)) {
            return null;
        }

        return Uuid::isValid(trim($value)) ? strtolower(trim($value)) : false;
    }
}
