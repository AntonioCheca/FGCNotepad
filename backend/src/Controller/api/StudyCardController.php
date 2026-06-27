<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\StudyCard;
use App\Entity\StudyReviewLog;
use App\Entity\User;
use App\Repository\StudyCardRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\ReplayLabResponseBuilder;
use App\Service\StudyScheduler;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/study/cards', name: 'api_study_cards_')]
final class StudyCardController extends AbstractController
{
    public function __construct(
        private readonly StudyCardRepository $studyCardRepository,
        private readonly StudyScheduler $scheduler,
        private readonly ReplayLabResponseBuilder $responseBuilder,
        private readonly EndpointAuthorizationService $authorizationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    #[Route('/due', name: 'due', methods: ['GET'])]
    public function due(): JsonResponse
    {
        $actor = $this->requireUser();
        $cards = $this->studyCardRepository->createQueryBuilder('card')
            ->andWhere('card.user = :actor')
            ->andWhere('card.suspendedAt IS NULL')
            ->andWhere('card.dueAt <= :now')
            ->setParameter('actor', $actor)
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('card.dueAt', 'ASC')
            ->setMaxResults(50)
            ->getQuery()
            ->getResult();

        return new JsonResponse(array_map(
            fn (StudyCard $card): array => $this->responseBuilder->studyCard($card),
            $cards,
        ));
    }

    #[Route('/{id}/review', name: 'review', methods: ['POST'])]
    public function review(StudyCard $card, Request $request): JsonResponse
    {
        $this->assertOwnsCard($this->requireUser(), $card);
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Invalid JSON payload.');
        }

        $rating = $payload['rating'] ?? null;
        if (!is_string($rating) || !in_array($rating, [StudyReviewLog::RATING_AGAIN, StudyReviewLog::RATING_HARD, StudyReviewLog::RATING_GOOD, StudyReviewLog::RATING_EASY], true)) {
            throw new BadRequestHttpException('rating is invalid.');
        }

        $wasCorrect = $payload['wasCorrect'] ?? null;
        if (!is_bool($wasCorrect)) {
            throw new BadRequestHttpException('wasCorrect must be boolean.');
        }

        $log = $this->scheduler->review($card, $rating, $wasCorrect, new \DateTimeImmutable());
        $this->entityManager->persist($log);
        $this->entityManager->flush();

        return new JsonResponse([
            'card' => $this->responseBuilder->studyCard($card, true),
            'review' => [
                'id' => (string) $log->getId(),
                'rating' => $log->getRating(),
                'wasCorrect' => $log->wasCorrect(),
                'previousDueAt' => $log->getPreviousDueAt()->format(\DateTimeInterface::ATOM),
                'nextDueAt' => $log->getNextDueAt()->format(\DateTimeInterface::ATOM),
            ],
        ]);
    }

    private function requireUser(): User
    {
        try {
            return $this->authorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        } catch (UnauthorizedHttpException) {
            throw new UnauthorizedHttpException('', 'Authentication required.');
        }
    }

    private function assertOwnsCard(User $actor, StudyCard $card): void
    {
        if ($card->getUser() !== $actor) {
            throw new AccessDeniedHttpException('Study card not accessible.');
        }
    }
}
