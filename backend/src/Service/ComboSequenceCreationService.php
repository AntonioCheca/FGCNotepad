<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\ComboMetrics;
use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\User;
use App\Repository\ComboSequenceTypeRepository;
use App\Repository\SeasonRepository;
use App\Repository\VisibilityRepository;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ComboSequenceCreationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ComboSequenceTypeRepository $comboSequenceTypeRepository,
        private readonly VisibilityRepository $visibilityRepository,
        private readonly SeasonRepository $seasonRepository,
        private readonly ComboRequirementFactory $comboRequirementFactory,
        private readonly ComboStepFactory $comboStepFactory,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     * @param array<int, array<string, mixed>>|null $stepsPayload
     */
    public function createFromPayload(array $payload, string $typeName, ?array $stepsPayload = null, ?User $author = null): ComboSequences
    {
        $type = $this->resolveType($typeName);

        $sequence = (new ComboSequences())
            ->setName((string) ($payload['name'] ?? ''))
            ->setDescription((string) ($payload['description'] ?? ''))
            ->setType($type)
            ->setAuthor($author);

        $visibility = $this->visibilityRepository->findOneBy(['name' => $payload['visibility'] ?? 'public']);
        $sequence->setVisibility($visibility);

        $currentSeason = $this->seasonRepository->findOneBy([], ['start_date' => 'DESC']);
        if (null !== $currentSeason) {
            $sequence->addSeason($currentSeason);
        }

        $this->entityManager->persist($sequence);

        $this->persistMetrics($sequence, $payload);
        $this->persistRequirement($sequence, $payload);
        $this->persistSteps($sequence, $stepsPayload);

        $this->entityManager->flush();

        return $sequence;
    }

    private function resolveType(string $typeName): ComboSequenceType
    {
        $type = $this->comboSequenceTypeRepository->findOneBy(['name' => $typeName]);
        if (!$type instanceof ComboSequenceType) {
            throw new NotFoundHttpException(sprintf("ComboSequenceType '%s' not found", $typeName));
        }

        return $type;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function persistMetrics(ComboSequences $sequence, array $payload): void
    {
        if (!isset($payload['metrics']) || !is_array($payload['metrics']) || empty($payload['metrics']['damage'])) {
            return;
        }

        $metrics = (new ComboMetrics())
            ->setSequence($sequence)
            ->setDamage((int) $payload['metrics']['damage'])
            ->setDriveCost($this->extractNullableFloat($payload['metrics']['driveCost'] ?? null))
            ->setDriveGain($this->extractNullableFloat($payload['metrics']['driveGain'] ?? null))
            ->setSuperCost($this->extractNullableFloat($payload['metrics']['superCost'] ?? null))
            ->setSuperGain($this->extractNullableFloat($payload['metrics']['superGain'] ?? null));

        $sequence->setComboMetrics($metrics);
        $this->entityManager->persist($metrics);
    }

    private function extractNullableFloat(mixed $value): ?float
    {
        if (null === $value || '' === $value) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (is_string($value) && is_numeric(trim($value))) {
            return (float) trim($value);
        }

        return null;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function persistRequirement(ComboSequences $sequence, array $payload): void
    {
        if (!isset($payload['requirements']) || !is_array($payload['requirements']) || [] === $payload['requirements']) {
            return;
        }

        try {
            $requirement = $this->comboRequirementFactory->createFromPayload($sequence, $payload['requirements']);
        } catch (InvalidArgumentException $exception) {
            throw new BadRequestHttpException($exception->getMessage(), $exception);
        }

        if ($requirement instanceof ComboRequirement) {
            $this->entityManager->persist($requirement);
        }
    }

    /**
     * @param array<int, array<string, mixed>>|null $stepsPayload
     */
    private function persistSteps(ComboSequences $sequence, ?array $stepsPayload): void
    {
        if (null === $stepsPayload) {
            return;
        }

        foreach ($this->comboStepFactory->createFromPayload($sequence, $stepsPayload) as $step) {
            $this->entityManager->persist($step);
        }
    }
}
