<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\FrameData;
use App\Entity\FrameDataOverride;
use App\Entity\Move;
use App\Entity\User;
use App\Repository\FrameDataOverrideRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class FrameDataOverrideService
{
    /**
     * @var array<string, array{label:string,type:string}>
     */
    private const EDITABLE_COLUMNS = [
        'startup' => ['label' => 'Startup', 'type' => 'integer'],
        'active' => ['label' => 'Active', 'type' => 'integer'],
        'recovery' => ['label' => 'Recovery', 'type' => 'integer'],
        'onHit' => ['label' => 'On Hit', 'type' => 'integer'],
        'damage' => ['label' => 'Damage', 'type' => 'integer'],
        'driveGain' => ['label' => 'Drive Gain', 'type' => 'integer'],
        'scaling' => ['label' => 'Scaling', 'type' => 'string'],
        'scalingStartPercent' => ['label' => 'Scaling Start %', 'type' => 'integer'],
        'scalingImmediatePercent' => ['label' => 'Scaling Immediate %', 'type' => 'integer'],
        'scalingMinimumPercent' => ['label' => 'Scaling Minimum %', 'type' => 'integer'],
        'scalingComboHits' => ['label' => 'Scaling Combo Hits', 'type' => 'integer'],
        'scalingComboExtraPercent' => ['label' => 'Scaling Combo Extra %', 'type' => 'integer'],
        'scalingMultiplierPercent' => ['label' => 'Scaling Multiplier %', 'type' => 'integer'],
    ];

    public function __construct(
        private readonly FrameDataOverrideRepository $frameDataOverrideRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return list<array{columnName:string,label:string,type:string}>
     */
    public function getEditableColumns(): array
    {
        $columns = [];
        foreach (self::EDITABLE_COLUMNS as $columnName => $definition) {
            $columns[] = [
                'columnName' => $columnName,
                'label' => $definition['label'],
                'type' => $definition['type'],
            ];
        }

        return $columns;
    }

    public function isEditableColumn(string $columnName): bool
    {
        return array_key_exists($columnName, self::EDITABLE_COLUMNS);
    }

    public function normalizeValue(string $columnName, mixed $value): int|string|null
    {
        if (!$this->isEditableColumn($columnName)) {
            throw new BadRequestHttpException(sprintf('Column "%s" is not editable.', $columnName));
        }

        if (null === $value) {
            return null;
        }

        $type = self::EDITABLE_COLUMNS[$columnName]['type'];
        if ('string' === $type) {
            if (!is_string($value)) {
                throw new BadRequestHttpException(sprintf('Column "%s" expects a string value.', $columnName));
            }

            $trimmed = trim($value);

            return '' === $trimmed ? null : $trimmed;
        }

        if (is_int($value)) {
            return $value;
        }

        if (is_string($value) && preg_match('/^-?\d+$/', trim($value)) === 1) {
            return (int) trim($value);
        }

        throw new BadRequestHttpException(sprintf('Column "%s" expects an integer value.', $columnName));
    }

    /**
     * @param list<Move> $moves
     */
    public function applyOverridesToMoves(array $moves): void
    {
        $frameDataRows = [];
        foreach ($moves as $move) {
            $frameData = $move->getFrameData();
            if ($frameData instanceof FrameData) {
                $frameDataRows[] = $frameData;
            }
        }

        $this->applyOverridesToFrameDataRows($frameDataRows);
    }

    /**
     * @param list<FrameData> $frameDataRows
     */
    public function applyOverridesToFrameDataRows(array $frameDataRows): void
    {
        $overrideMap = $this->frameDataOverrideRepository->findOverrideMapForFrameDataRows($frameDataRows);
        foreach ($frameDataRows as $frameData) {
            $frameDataId = $frameData->getId()?->toRfc4122();
            if (null === $frameDataId) {
                continue;
            }

            $frameData->applyEffectiveOverrides($overrideMap[$frameDataId] ?? []);
        }
    }

    public function saveOverride(FrameData $frameData, string $columnName, mixed $value, User $actor): ?FrameDataOverride
    {
        $normalizedValue = $this->normalizeValue($columnName, $value);
        $override = $this->frameDataOverrideRepository->findOneBy([
            'frameData' => $frameData,
            'columnName' => $columnName,
        ]);

        if (null === $normalizedValue) {
            if ($override instanceof FrameDataOverride) {
                $this->entityManager->remove($override);
            }

            $frameData->applyEffectiveOverrides([]);

            return null;
        }

        if (!$override instanceof FrameDataOverride) {
            $override = (new FrameDataOverride())
                ->setFrameData($frameData)
                ->setColumnName($columnName);
            $this->entityManager->persist($override);
        }

        $override
            ->setOverrideValue($normalizedValue)
            ->setEditedBy($actor);

        return $override;
    }
}
