<?php declare(strict_types=1);

namespace App\Service\ScenarioTransfer;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Entity\ScenarioCell;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Repository\ScenarioRepository;
use App\Service\CharacterResourceService;
use App\Util\MoveNotationAliases;
use App\Util\ReplayMoveNotation;

/**
 * Resolves the catalog references of a validated scenario_export_v1 document against this database: characters by
 * name, moves by notation within their character, character resources by object key or name, and referenced
 * scenarios by export key (in the same document or already stored).
 *
 * @phpstan-import-type ParsedScenario from ScenarioImportDocumentValidator
 * @phpstan-import-type ParsedStarter from ScenarioImportDocumentValidator
 *
 * @phpstan-type ResolvedStarter array{path:string,character:Character,moves:list<Move>,hitCondition:string,initiator:string}
 * @phpstan-type ResolvedScenario array{parsed:ParsedScenario,existing:Scenario|null,attacker:Character,defender:Character,triggerMove:Move,characterStatuses:list<array{object_key:string|null,object_name:string,status_required:string}>,starters:array<string,ResolvedStarter>}
 */
final class ScenarioImportResolver
{
    /** @var array<string, array<string, list<Move>>> */
    private array $movesByCharacter = [];

    /** @var list<string> */
    private array $errors = [];

    public function __construct(
        private readonly CharacterRepository $characterRepository,
        private readonly MoveRepository $moveRepository,
        private readonly ScenarioRepository $scenarioRepository,
        private readonly CharacterResourceService $characterResourceService,
    ) {
    }

    /**
     * @param list<ParsedScenario> $scenarios
     *
     * @return array{errors:list<string>,scenarios:list<ResolvedScenario>}
     */
    public function resolve(array $scenarios): array
    {
        $this->errors = [];
        $this->movesByCharacter = [];
        $documentKeys = [];
        foreach ($scenarios as $scenario) {
            $documentKeys[$this->keyString($scenario['key'])] = true;
        }

        $resolved = [];
        foreach ($scenarios as $scenario) {
            $result = $this->resolveScenario($scenario, $documentKeys);
            if (null !== $result) {
                $resolved[] = $result;
            }
        }

        if ([] === $this->errors) {
            $this->assertLinkSides($resolved);
        }

        return ['errors' => $this->errors, 'scenarios' => [] === $this->errors ? $resolved : []];
    }

    /**
     * @param array{source:string,externalId:string} $key
     */
    public function findExisting(array $key): ?Scenario
    {
        return $this->scenarioRepository->findOneByExportKey($key['source'], $key['externalId'], ScenarioExportFormat::SITE_SOURCE);
    }

    /**
     * @param ParsedScenario $scenario
     * @param array<string, true> $documentKeys
     *
     * @return ResolvedScenario|null
     *
     * @phpstan-impure
     */
    private function resolveScenario(array $scenario, array $documentKeys): ?array
    {
        $errorCount = count($this->errors);
        $path = $scenario['path'];
        $attacker = $this->resolveCharacter($scenario['attacker'], $path . '.attacker');
        $defender = $this->resolveCharacter($scenario['defender'], $path . '.defender');

        $trigger = $scenario['situation']['triggerMove'];
        $triggerCharacter = $this->resolveCharacter($trigger['character'], $path . '.situation.triggerMove.character');
        $triggerMove = null !== $triggerCharacter ? $this->resolveMove($triggerCharacter, $trigger['notation'], $path . '.situation.triggerMove.notation') : null;

        $characterStatuses = $this->resolveCharacterStatuses($scenario['situation']['characterStatuses'], $path . '.situation.characterStatuses');

        $starters = [];
        foreach ($scenario['cells'] as $rowCells) {
            foreach ($rowCells as $cell) {
                $this->assertReferenceExists($cell['reference']['scenario'] ?? null, $documentKeys, $cell['path'] . '.reference.scenario');
                $starter = $cell['starter'] ?? $cell['reference']['preValue']['starter'] ?? null;
                $initiator = 'attacker' === ($starter['initiator'] ?? null) ? $attacker : $defender;
                if (null === $starter || null === $initiator) {
                    continue;
                }

                $starterPath = null !== $cell['starter'] ? $cell['path'] . '.starter' : $cell['path'] . '.reference.preValue.starter';
                $resolvedStarter = $this->resolveStarter($starter, $initiator, $starterPath);
                if (null !== $resolvedStarter) {
                    $starters[$cell['path']] = $resolvedStarter;
                }
            }
        }

        if (count($this->errors) > $errorCount || null === $attacker || null === $defender || null === $triggerMove) {
            return null;
        }

        return [
            'parsed' => $scenario,
            'existing' => $this->findExisting($scenario['key']),
            'attacker' => $attacker,
            'defender' => $defender,
            'triggerMove' => $triggerMove,
            'characterStatuses' => $characterStatuses,
            'starters' => $starters,
        ];
    }

    private function resolveCharacter(string $name, string $path): ?Character
    {
        $character = $this->characterRepository->findOneByExportName($name);
        if (null === $character) {
            $this->errors[] = sprintf('%s: unknown character "%s".', $path, $name);
        }

        return $character;
    }

    /**
     * @param ParsedStarter $starter
     *
     * @return array{path:string,character:Character,moves:list<Move>,hitCondition:string,initiator:string}|null
     */
    private function resolveStarter(array $starter, Character $character, string $path): ?array
    {
        $moves = [];
        foreach ($starter['moves'] as $index => $notation) {
            $move = $this->resolveMove($character, $notation, sprintf('%s.moves[%d]', $path, $index));
            if (null !== $move) {
                $moves[] = $move;
            }
        }

        if (count($moves) !== count($starter['moves'])) {
            return null;
        }

        return [
            'path' => $path,
            'character' => $character,
            'moves' => $moves,
            'hitCondition' => $starter['hitCondition'],
            'initiator' => $starter['initiator'],
        ];
    }

    /**
     * Exact notation first (what exports emit), then the alias matching the replay imports use.
     */
    private function resolveMove(Character $character, string $notation, string $path): ?Move
    {
        $moves = $this->movesFor($character);
        $matches = $moves['exact:' . $notation] ?? [];
        if ([] === $matches) {
            $key = ReplayMoveNotation::key($notation);
            $matches = $moves[$key] ?? [];
            if ([] === $matches && null !== ($jumpKey = ReplayMoveNotation::jumpAliasKey($key))) {
                $matches = $moves[$jumpKey] ?? [];
            }
        }

        $unique = [];
        foreach ($matches as $match) {
            $unique[spl_object_id($match)] = $match;
        }
        $unique = array_values($unique);
        if (1 === count($unique)) {
            return $unique[0];
        }

        $this->errors[] = [] === $unique
            ? sprintf('%s: no %s move matches notation "%s".', $path, $character->getName(), $notation)
            : sprintf('%s: notation "%s" matches several %s moves.', $path, $notation, $character->getName());

        return null;
    }

    /**
     * @return array<string, list<Move>>
     */
    private function movesFor(Character $character): array
    {
        $characterId = (string) $character->getId();
        if (isset($this->movesByCharacter[$characterId])) {
            return $this->movesByCharacter[$characterId];
        }

        $moves = [];
        foreach ($this->moveRepository->findBy(['character' => $character]) as $move) {
            $moves['exact:' . $move->getNumpadNotation()][] = $move;
            foreach ([$move->getNumpadNotation(), ...MoveNotationAliases::alternatives($move->getNumpadNotation())] as $alias) {
                $moves[ReplayMoveNotation::key($alias)][] = $move;
            }
        }

        return $this->movesByCharacter[$characterId] = $moves;
    }

    /**
     * @param list<array{object:string,status:string|int|bool}> $statuses
     *
     * @return list<array{object_key:string|null,object_name:string,status_required:string}>
     */
    private function resolveCharacterStatuses(array $statuses, string $path): array
    {
        $resolved = [];
        foreach ($statuses as $index => $status) {
            $statusPath = sprintf('%s[%d]', $path, $index);
            $definition = $this->characterResourceService->definition($status['object']);
            if (null === $definition) {
                $this->errors[] = sprintf('%s.object: unknown character resource "%s".', $statusPath, $status['object']);
                continue;
            }

            try {
                $value = $this->characterResourceService->normalizeStatusRequired($status['object'], $status['status']);
            } catch (\InvalidArgumentException $exception) {
                $this->errors[] = sprintf('%s.status: %s', $statusPath, $exception->getMessage());
                continue;
            }

            if (null === $value) {
                $this->errors[] = sprintf('%s.status: is required.', $statusPath);
                continue;
            }

            $resolved[] = ['object_key' => $definition['object_key'], 'object_name' => (string) $definition['name'], 'status_required' => $value];
        }

        return $resolved;
    }

    /**
     * A same-side link must lead to a scenario with the same attacker; an opponent-side link to one whose attacker is
     * this scenario's defender.
     *
     * @param list<ResolvedScenario> $resolvedScenarios
     */
    private function assertLinkSides(array $resolvedScenarios): void
    {
        $attackersByKey = [];
        foreach ($resolvedScenarios as $resolved) {
            $attackersByKey[$this->keyString($resolved['parsed']['key'])] = $resolved['attacker'];
        }

        foreach ($resolvedScenarios as $resolved) {
            foreach ($resolved['parsed']['cells'] as $rowCells) {
                foreach ($rowCells as $cell) {
                    $reference = $cell['reference'];
                    if (null === $reference) {
                        continue;
                    }

                    $linkedAttacker = $attackersByKey[$this->keyString($reference['scenario'])]
                        ?? $this->findExisting($reference['scenario'])?->getAttackerCharacter();
                    $opponent = ScenarioCell::PERSPECTIVE_OPPONENT === $reference['perspective'];
                    $expected = $opponent ? $resolved['defender'] : $resolved['attacker'];
                    if (null !== $linkedAttacker && $linkedAttacker->getId()?->toRfc4122() !== $expected->getId()?->toRfc4122()) {
                        $this->errors[] = sprintf(
                            '%s.reference.perspective: a %s-side link needs the linked scenario\'s attacker to be this scenario\'s %s (%s), not %s.',
                            $cell['path'],
                            $reference['perspective'],
                            $opponent ? 'defender' : 'attacker',
                            $expected->getName(),
                            $linkedAttacker->getName()
                        );
                    }
                }
            }
        }
    }

    /**
     * @param array{source:string,externalId:string}|null $key
     * @param array<string, true> $documentKeys
     */
    private function assertReferenceExists(?array $key, array $documentKeys, string $path): void
    {
        if (null === $key || isset($documentKeys[$this->keyString($key)]) || null !== $this->findExisting($key)) {
            return;
        }

        $this->errors[] = sprintf('%s: scenario %s/%s is neither in this document nor in the database.', $path, $key['source'], $key['externalId']);
    }

    /**
     * @param array{source:string,externalId:string} $key
     */
    public function keyString(array $key): string
    {
        return $key['source'] . "\n" . $key['externalId'];
    }
}
