<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioType;
use App\Entity\User;
use App\Repository\ScenarioRepository;
use App\Repository\ScenarioTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

class PostScenarioSyncService
{
    public function __construct(
        private readonly ScenarioRepository $scenarioRepository,
        private readonly ScenarioTypeRepository $scenarioTypeRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function syncFromPostBody(array $body, ?User $author, string $postTitle): array
    {
        $scenarioType = $this->resolveScenarioType();
        $scenarioIndex = 0;

        $this->syncNode($body, $scenarioType, $author, $postTitle, $scenarioIndex);

        return $body;
    }

    private function resolveScenarioType(): ScenarioType
    {
        $type = $this->scenarioTypeRepository->findOneBy(['name' => 'MatrixRef']);
        if (null !== $type) {
            return $type;
        }

        $type = (new ScenarioType())->setName('MatrixRef');
        $this->entityManager->persist($type);

        return $type;
    }

    /**
     * @param array<string, mixed> $node
     */
    private function syncNode(array &$node, ScenarioType $scenarioType, ?User $author, string $postTitle, int &$scenarioIndex): void
    {
        $matrix = $this->normalizeMatrixPayload($node['matrix'] ?? null);
        if (($node['type'] ?? null) === 'scenario-table' && null !== $matrix) {
            $scenarioIndex++;
            $node['matrix'] = $this->upsertScenario($matrix, $scenarioType, $author, $postTitle, $scenarioIndex);
        }

        foreach ($node as &$value) {
            if (is_array($value)) {
                $this->syncNode($value, $scenarioType, $author, $postTitle, $scenarioIndex);
            }
        }
        unset($value);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeMatrixPayload(mixed $matrix): ?array
    {
        if (is_array($matrix)) {
            return $matrix;
        }

        if (!is_string($matrix)) {
            return null;
        }

        $decoded = json_decode($matrix, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    /**
     * @param array<string, mixed> $matrix
     *
     * @return array<string, mixed>
     */
    private function upsertScenario(array $matrix, ScenarioType $scenarioType, ?User $author, string $postTitle, int $scenarioIndex): array
    {
        $extensions = isset($matrix['extensions']) && is_array($matrix['extensions']) ? $matrix['extensions'] : [];
        $embeddedScenarioId = isset($extensions['scenarioId']) && is_string($extensions['scenarioId'])
            ? trim($extensions['scenarioId'])
            : '';

        $scenario = null;
        if ('' !== $embeddedScenarioId && Uuid::isValid($embeddedScenarioId)) {
            $scenario = $this->scenarioRepository->findOneByPublicId($embeddedScenarioId);
        }

        if (null === $scenario) {
            $scenario = new Scenario();
        }

        $metadata = isset($matrix['metadata']) && is_array($matrix['metadata']) ? $matrix['metadata'] : [];
        $matrixTitle = isset($metadata['title']) && is_string($metadata['title']) ? trim($metadata['title']) : '';
        $scenarioName = '' !== $matrixTitle ? $matrixTitle : sprintf('%s matrix %d', $postTitle, $scenarioIndex);

        $scenario
            ->setName($scenarioName)
            ->setType($scenarioType)
            ->setPayload($matrix)
            ->setAuthor($author);

        $this->entityManager->persist($scenario);

        $extensions['scenarioId'] = $scenario->getPublicId()->toRfc4122();
        $matrix['extensions'] = $extensions;

        return $matrix;
    }
}
