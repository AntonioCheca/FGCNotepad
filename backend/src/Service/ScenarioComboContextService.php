<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\RequirementSpecificCharacter;
use App\Entity\Scenario;
use App\Entity\ScenarioComboContext;
use Doctrine\ORM\EntityManagerInterface;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class ScenarioComboContextService
{
    public function __construct(
        private readonly RequirementSpecificCharacterCatalog $catalog,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function hydrateScenarioContext(Scenario $scenario, array $payload): void
    {
        if (!array_key_exists('comboContext', $payload)) {
            return;
        }

        $contextPayload = $payload['comboContext'];
        if (!is_array($contextPayload)) {
            throw new BadRequestHttpException('comboContext must be an object.');
        }

        $context = $scenario->getComboContext() ?? (new ScenarioComboContext())->setScenario($scenario);
        $scenario->setComboContext($context);

        $positionLock = isset($contextPayload['positionLock']) && is_string($contextPayload['positionLock'])
            ? trim($contextPayload['positionLock'])
            : ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN;
        if (!in_array($positionLock, ScenarioComboContext::validPositionLocks(), true)) {
            throw new BadRequestHttpException('comboContext.positionLock is invalid.');
        }

        $context->setPositionLock($positionLock);

        foreach ($context->getCharacterStatuses()->toArray() as $status) {
            $this->entityManager->remove($status);
        }
        $context->clearCharacterStatuses();

        $statuses = is_array($contextPayload['characterStatuses'] ?? null) ? $contextPayload['characterStatuses'] : [];
        $seenObjects = [];
        foreach ($statuses as $index => $statusPayload) {
            if (!is_array($statusPayload)) {
                throw new BadRequestHttpException(sprintf('comboContext.characterStatuses[%d] must be an object.', (int) $index));
            }

            $status = $this->buildCharacterStatus($statusPayload, sprintf('comboContext.characterStatuses[%d]', (int) $index));
            $objectName = $status->getObjectName();
            if (null !== $objectName && isset($seenObjects[$objectName])) {
                throw new BadRequestHttpException(sprintf('comboContext.characterStatuses cannot contain duplicate %s requirements.', $objectName));
            }

            if (null !== $objectName) {
                $seenObjects[$objectName] = true;
            }

            $context->addCharacterStatus($status);
        }
    }

    /**
     * @return array{positionLock:string,characterStatuses:list<array{id:int|null,object_name:string|null,status_required:string|null}>}
     */
    public function buildPayload(?ScenarioComboContext $context): array
    {
        if (null === $context) {
            return [
                'positionLock' => ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN,
                'characterStatuses' => [],
            ];
        }

        return [
            'positionLock' => $context->getPositionLock(),
            'characterStatuses' => array_map(
                static fn (RequirementSpecificCharacter $status): array => [
                    'id' => $status->getId(),
                    'object_name' => $status->getObjectName(),
                    'status_required' => $status->getStatusRequired(),
                ],
                $context->getCharacterStatuses()->toArray()
            ),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array{allowedPositions:list<string>,characterStatuses:array<string,string>}
     */
    public function buildEffectiveContext(Scenario $scenario, array $payload): array
    {
        $fixedContext = $scenario->getComboContext();
        $positionLock = $fixedContext?->getPositionLock() ?? ScenarioComboContext::POSITION_VIEWER_DEFAULT_MIDSCREEN;
        $viewerContext = is_array($payload['comboContext'] ?? null) ? $payload['comboContext'] : [];

        $allowedPositions = match ($positionLock) {
            ScenarioComboContext::POSITION_CORNER => ['corner'],
            ScenarioComboContext::POSITION_MIDSCREEN => ['midscreen'],
            default => true === ($viewerContext['includeCornerSpecific'] ?? false) ? ['midscreen', 'corner'] : ['midscreen'],
        };

        $characterStatuses = [];
        foreach ($fixedContext?->getCharacterStatuses()->toArray() ?? [] as $status) {
            $objectName = $status->getObjectName();
            $statusRequired = $status->getStatusRequired();
            if (null !== $objectName && null !== $statusRequired) {
                $characterStatuses[$objectName] = $statusRequired;
            }
        }

        return [
            'allowedPositions' => $allowedPositions,
            'characterStatuses' => $characterStatuses,
        ];
    }

    /** @param array<string, mixed> $payload */
    private function buildCharacterStatus(array $payload, string $path): RequirementSpecificCharacter
    {
        $objectName = $this->catalog->normalizeObjectName($payload['object_name'] ?? $payload['objectName'] ?? null);
        if (null === $objectName) {
            throw new BadRequestHttpException(sprintf('%s.object_name is required.', $path));
        }

        try {
            $statusRequired = $this->catalog->normalizeStatusRequired($objectName, $payload['status_required'] ?? $payload['statusRequired'] ?? null);
        } catch (InvalidArgumentException $exception) {
            throw new BadRequestHttpException($exception->getMessage(), $exception);
        }

        if (null === $statusRequired) {
            throw new BadRequestHttpException(sprintf('%s.status_required is required.', $path));
        }

        return (new RequirementSpecificCharacter())
            ->setObjectName($objectName)
            ->setStatusRequired($statusRequired);
    }
}
