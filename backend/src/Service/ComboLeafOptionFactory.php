<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\FrameData;
use App\Entity\Move;
use App\Repository\ComboSequencesRepository;
use App\Util\MoveNotationAliases;

/** The per-character move vocabulary ComboNotationTranslator parses against: Classic notation plus Modern inputs. */
final class ComboLeafOptionFactory
{
    public function __construct(private readonly ComboSequencesRepository $comboSequencesRepository)
    {
    }

    /**
     * @return list<array{id:int, notation:string, aliases:list<string>, modernAliases:list<string>, moveType:string|null, cancelTypeCodes:list<string>}>
     */
    public function forCharacter(string $characterId): array
    {
        $leafOptions = [];
        foreach ($this->comboSequencesRepository->findLeafsByCharacterId($characterId) as $leafSequence) {
            $move = $leafSequence->getMove();
            if (!$move instanceof Move) {
                continue;
            }

            $leafOptions[] = [
                'id' => (int) $leafSequence->getId(),
                'notation' => $move->getNumpadNotation(),
                'aliases' => MoveNotationAliases::alternatives($move->getNumpadNotation()),
                'modernAliases' => $this->modernAliases($move),
                'moveType' => $move->getFrameData()?->getMoveType(),
                'cancelTypeCodes' => $this->cancelTypeCodes($move->getFrameData()),
            ];
        }

        return $leafOptions;
    }

    /** @return list<string> */
    private function modernAliases(Move $move): array
    {
        $aliases = [];
        foreach ([$move->getModernMaxNotation(), $move->getModernSimpleNotation()] as $notation) {
            if (null !== $notation && '' !== trim($notation) && trim($notation) !== $move->getNumpadNotation()) {
                $aliases[] = trim($notation);
            }
        }

        return array_values(array_unique($aliases));
    }

    /** @return list<string> */
    private function cancelTypeCodes(?FrameData $frameData): array
    {
        if (null === $frameData) {
            return [];
        }

        $codes = $frameData->getCancelTypeCodes();
        if (($frameData->getHitConfirmTargetCombos() ?? 0) > 0 && !in_array('tc', $codes, true)) {
            $codes[] = 'tc';
        }

        return array_values($codes);
    }
}
