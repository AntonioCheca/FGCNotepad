<?php declare(strict_types=1);

namespace App\Service\ComboImport;

use App\Entity\Character;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use App\Repository\ConnectionTypeRepository;

class ComboImportContextProvider
{
    public function __construct(
        private CharacterRepository $characterRepository,
        private ComboSequencesRepository $comboSequencesRepository,
        private ConnectionTypeRepository $connectionTypeRepository,
    ) {
    }

    public function resolveCharacter(string $characterInput): Character
    {
        $needle = $this->normalizeCharacter($characterInput);

        foreach ($this->characterRepository->findAll() as $character) {
            if (!$character instanceof Character) {
                continue;
            }

            if ($this->normalizeCharacter($character->getName()) === $needle) {
                return $character;
            }
        }

        throw new \RuntimeException(sprintf('Character "%s" not found.', $characterInput));
    }

    /**
     * @return array<int, array{id:int, notation:string, moveType:string|null, cancelTypeCodes:array<int, string>}>
     */
    public function buildLeafOptions(Character $character): array
    {
        $characterId = $character->getId();
        if (null === $characterId) {
            return [];
        }

        $leafOptions = [];
        foreach ($this->comboSequencesRepository->findLeafsByCharacterId((string) $characterId) as $leafSequence) {
            $move = $leafSequence->getMove();
            if (!$move instanceof Move) {
                continue;
            }

            $leafId = $leafSequence->getId();
            if (null === $leafId) {
                continue;
            }

            $leafOptions[] = [
                'id' => (int) $leafId,
                'notation' => (string) $move->getNumpadNotation(),
                'moveType' => $move->getFrameData()?->getMoveType(),
                'cancelTypeCodes' => $move->getFrameData()?->getCancelTypeCodes() ?? [],
            ];
        }

        return $leafOptions;
    }

    /**
     * @return array<int, array{id:int, name:string}>
     */
    public function buildConnectionTypes(): array
    {
        return array_map(
            static fn (ConnectionType $connectionType): array => [
                'id' => (int) $connectionType->getId(),
                'name' => (string) $connectionType->getName(),
            ],
            $this->connectionTypeRepository->findAll()
        );
    }

    private function normalizeCharacter(string $value): string
    {
        $normalized = strtolower(trim($value));

        return preg_replace('/[^a-z0-9]/', '', $normalized) ?? $normalized;
    }
}
