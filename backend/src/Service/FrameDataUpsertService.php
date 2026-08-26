<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use Doctrine\ORM\EntityManagerInterface;

final class FrameDataUpsertService
{
    /** @var array<string, int> */
    private const CHARACTER_LIFE_BY_NAME = [
        'Akuma' => 9000,
        'E.Honda' => 10500,
        'Marisa' => 10500,
        'Zangief' => 11000,
    ];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MoveRepository $moveRepository,
        private readonly CharacterRepository $characterRepository,
        private readonly FrameDataRecordApplier $recordApplier,
    ) {
    }

    public function upsertFatData(array $data, bool $dryRun = false): FrameDataImportResult
    {
        $result = new FrameDataImportResult();

        foreach ($data as $characterName => $charData) {
            if (!is_string($characterName) || !is_array($charData)) {
                ++$result->skipped;
                continue;
            }

            $moves = is_array($charData['moves']['normal'] ?? null) ? $charData['moves']['normal'] : [];
            $character = $this->getOrCreateCharacter($characterName, self::CHARACTER_LIFE_BY_NAME[$characterName] ?? 10000, $result, $dryRun);

            foreach ($moves as $moveName => $record) {
                if (!is_array($record)) {
                    ++$result->skipped;
                    continue;
                }

                $numCmd = $record['numCmd'] ?? null;
                if (!is_string($numCmd) || '' === trim($numCmd)) {
                    $result->addWarning(sprintf('Skipping move "%s" for %s because numCmd is missing.', (string) $moveName, $characterName));
                    ++$result->skipped;
                    continue;
                }

                [$move, $frameData, $createdFrameData] = $this->getOrCreateMoveFrameData($character, trim($numCmd), $result, $dryRun);
                $warnings = [];
                $changed = $this->recordApplier->applyFatRecord($frameData, $record, $warnings);
                foreach ($warnings as $warning) {
                    $result->addWarning(sprintf('Scaling parse warning [%s - %s]: %s', $characterName, (string) $moveName, $warning));
                }

                if (!$dryRun && !$createdFrameData && $changed) {
                    $this->entityManager->persist($frameData);
                }

                if (!$createdFrameData && $changed) {
                    ++$result->frameDataUpdated;
                } elseif (!$createdFrameData && !$changed) {
                    ++$result->unchanged;
                }

                ++$result->processed;
            }
        }

        if (!$dryRun) {
            $this->entityManager->flush();
        }

        return $result;
    }

    /**
     * @return array{0:Move,1:FrameData,2:bool}
     */
    public function getOrCreateMoveFrameData(Character $character, string $numpadNotation, FrameDataImportResult $result, bool $dryRun): array
    {
        $move = $dryRun && null === $character->getId() ? null : $this->moveRepository->findOneBy(['numpadNotation' => $numpadNotation, 'character' => $character]);
        if (!$move instanceof Move) {
            $move = (new Move())->setNumpadNotation($numpadNotation)->setCharacter($character);
            if (!$dryRun) {
                $this->entityManager->persist($move);
            }
            ++$result->movesCreated;
        }

        $frameData = $move->getFrameData();
        $createdFrameData = false;
        if (!$frameData instanceof FrameData) {
            $frameData = new FrameData();
            $frameData->setMoveType('normal');
            $frameData->setCancelsTo('[]');
            $move->setFrameData($frameData);
            $createdFrameData = true;
            ++$result->frameDataCreated;
            if (!$dryRun) {
                $this->entityManager->persist($frameData);
            }
        }

        return [$move, $frameData, $createdFrameData];
    }

    public function getOrCreateCharacter(string $name, int $life, FrameDataImportResult $result, bool $dryRun): Character
    {
        $character = $this->characterRepository->findOneBy(['name' => $name]);
        if (!$character instanceof Character) {
            $character = (new Character())->setName($name)->setLife($life);
            if (!$dryRun) {
                $this->entityManager->persist($character);
            }
            ++$result->charactersCreated;
        } elseif ($character->getLife() !== $life && !$dryRun) {
            $character->setLife($life);
        }

        return $character;
    }
}
