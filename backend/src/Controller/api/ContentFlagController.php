<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Service\ContentFlagService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api', name: 'api_content_flags_')]
class ContentFlagController extends AbstractController
{
    public function __construct(
        private readonly ContentFlagService $contentFlagService,
    ) {
    }

    #[Route('/flags/scenarios', name: 'scenario_create', methods: ['POST'])]
    #[Route('/scenario-flags', name: 'scenario_create_legacy', methods: ['POST'])]
    public function createScenarioFlag(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $user = $this->requireAuthenticatedUser($user);
        $data = $this->decodePayload($request);

        $scenarioId = $data['scenarioId'] ?? null;
        if (!is_string($scenarioId)) {
            throw new BadRequestHttpException('scenarioId must be a string.');
        }

        $comment = $this->extractComment($data);
        $flag = $this->contentFlagService->createScenarioFlag($user, $scenarioId, $comment);

        return new JsonResponse([
            'id' => $flag->getId(),
            'scenarioId' => $flag->getScenario()->getPublicId()->toRfc4122(),
            'comment' => $flag->getComment(),
            'createdAt' => $flag->getCreatedAt()->format(DATE_ATOM),
        ], JsonResponse::HTTP_CREATED);
    }

    #[Route('/flags/combos', name: 'combo_create', methods: ['POST'])]
    #[Route('/combo-flags', name: 'combo_create_legacy', methods: ['POST'])]
    public function createComboFlag(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $user = $this->requireAuthenticatedUser($user);
        $data = $this->decodePayload($request);

        $comboId = $data['comboId'] ?? null;
        if (!is_int($comboId) && !(is_string($comboId) && ctype_digit($comboId))) {
            throw new BadRequestHttpException('comboId must be an integer.');
        }

        $comment = $this->extractComment($data);
        $flag = $this->contentFlagService->createComboFlag($user, (int) $comboId, $comment);

        return new JsonResponse([
            'id' => $flag->getId(),
            'comboId' => $flag->getCombo()->getId(),
            'comment' => $flag->getComment(),
            'createdAt' => $flag->getCreatedAt()->format(DATE_ATOM),
        ], JsonResponse::HTTP_CREATED);
    }

    private function requireAuthenticatedUser(?User $user): User
    {
        if (!$user instanceof User) {
            throw new UnauthorizedHttpException('Session', 'Authentication required to flag content.');
        }

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodePayload(Request $request): array
    {
        $payload = json_decode((string) $request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function extractComment(array $payload): ?string
    {
        if (!array_key_exists('comment', $payload) || null === $payload['comment']) {
            return null;
        }

        if (!is_string($payload['comment'])) {
            throw new BadRequestHttpException('comment must be a string or null.');
        }

        return $payload['comment'];
    }
}
