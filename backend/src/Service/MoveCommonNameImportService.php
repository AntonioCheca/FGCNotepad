<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Util\MoveNotationAliases;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Copies FAT's cmnName ("MK Tatsu") onto existing moves without touching their frame data.
 */
final class MoveCommonNameImportService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CharacterRepository $characterRepository,
        private readonly MoveRepository $moveRepository,
    ) {
    }

    /**
     * @param array<mixed> $fatData FAT JSON keyed by character name
     *
     * @return int number of moves whose common name changed
     */
    public function import(array $fatData): int
    {
        $updated = 0;
        foreach ($fatData as $characterName => $characterData) {
            $character = is_string($characterName) ? $this->characterRepository->findOneBy(['name' => $characterName]) : null;
            $records = is_array($characterData) ? ($characterData['moves']['normal'] ?? null) : null;
            if (!$character instanceof Character || !is_array($records)) {
                continue;
            }

            foreach ($records as $record) {
                if ($this->applyRecord($character, $record)) {
                    ++$updated;
                }
            }
        }
        $this->entityManager->flush();

        return $updated;
    }

    private function applyRecord(Character $character, mixed $record): bool
    {
        $notation = is_array($record) ? ($record['numCmd'] ?? null) : null;
        $commonName = is_array($record) ? ($record['cmnName'] ?? null) : null;
        if (!is_string($notation) || !is_string($commonName) || '' === trim($commonName)) {
            return false;
        }

        $move = $this->moveRepository->findOneBy(['character' => $character, 'numpadNotation' => MoveNotationAliases::canonicalize(trim($notation))]);
        if (!$move instanceof Move || $move->getCommonName() === trim($commonName)) {
            return false;
        }
        $move->setCommonName($commonName);

        return true;
    }
}
