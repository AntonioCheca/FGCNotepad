<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboFlag;
use App\Entity\ScenarioFlag;
use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use App\Repository\ScenarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;

class ContentFlagService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly ComboSequencesRepository $comboSequencesRepository,
    ) {
    }

    public function createScenarioFlag(User $user, string $scenarioPublicId, ?string $comment): ScenarioFlag
    {
        $normalizedScenarioPublicId = trim($scenarioPublicId);
        if ('' === $normalizedScenarioPublicId || !Uuid::isValid($normalizedScenarioPublicId)) {
            throw new BadRequestHttpException('scenarioId must be a valid UUID.');
        }

        $scenario = $this->scenarioRepository->findOneByPublicId($normalizedScenarioPublicId);
        if (null === $scenario) {
            throw new NotFoundHttpException(sprintf('Scenario with ID %s not found', $normalizedScenarioPublicId));
        }

        $flag = new ScenarioFlag($scenario, $user, $this->normalizeComment($comment));
        $this->entityManager->persist($flag);
        $this->entityManager->flush();

        return $flag;
    }

    public function createComboFlag(User $user, int $comboId, ?string $comment): ComboFlag
    {
        if ($comboId <= 0) {
            throw new BadRequestHttpException('comboId must be a positive integer.');
        }

        $combo = $this->comboSequencesRepository->find($comboId);
        if (null === $combo) {
            throw new NotFoundHttpException(sprintf('Combo with ID %d not found.', $comboId));
        }

        if ('combo' !== $combo->getType()?->getName()) {
            throw new BadRequestHttpException('Only combo content can be flagged in this endpoint.');
        }

        $flag = new ComboFlag($combo, $user, $this->normalizeComment($comment));
        $this->entityManager->persist($flag);
        $this->entityManager->flush();

        return $flag;
    }

    private function normalizeComment(?string $comment): ?string
    {
        if (null === $comment) {
            return null;
        }

        $normalizedComment = trim($comment);
        if ('' === $normalizedComment) {
            return null;
        }

        if (mb_strlen($normalizedComment) > 2000) {
            throw new BadRequestHttpException('comment must be at most 2000 characters.');
        }

        return $normalizedComment;
    }
}
