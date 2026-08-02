<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringCondition;
use App\Entity\BlockstringAdaptation;
use App\Entity\BlockstringAdaptationComboSearch;
use App\Entity\BlockstringAdaptationStep;
use App\Entity\BlockstringDefenseEntry;
use App\Entity\BlockstringGap;
use App\Entity\BlockstringSequence;
use App\Entity\BlockstringSequenceStep;
use App\Entity\Character;
use App\Entity\ComboSpacing;
use App\Entity\Move;
use App\Entity\Situation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class BlockstringMutationService
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    /** @param array<string, mixed> $payload */
    public function hydrate(BlockstringSequence $sequence, array $payload): void
    {
        $sequence
            ->setTitle($this->requiredString($payload, 'title'))
            ->setSummary($this->nullableString($payload['summary'] ?? null))
            ->setClassification($this->allowedString($payload['classification'] ?? 'fake', 'classification', ['true', 'frametrap', 'reset', 'fake', 'knowledge_check']))
            ->setAttackerCharacter($this->findCharacter($this->requiredString($payload, 'attackerCharacterId')));

        $this->clearAdaptations($sequence);
        $this->clearDefenseEntries($sequence);
        $this->clearGaps($sequence);
        $stepsByOrdinal = $this->replaceSteps($sequence, $payload['steps'] ?? []);
        $gapsByClientId = $this->replaceGaps($sequence, $payload['gaps'] ?? [], $stepsByOrdinal);
        $this->replaceConditions($sequence, $payload['conditions'] ?? []);
        $this->replaceDefenseEntries($sequence, $payload['defenseEntries'] ?? [], $gapsByClientId);
        $this->replaceAdaptations($sequence, $payload['adaptations'] ?? [], $gapsByClientId);
    }

    private function clearAdaptations(BlockstringSequence $sequence): void
    {
        foreach ($sequence->getAdaptations()->toArray() as $adaptation) {
            $sequence->getAdaptations()->removeElement($adaptation);
            $this->entityManager->remove($adaptation);
        }
    }

    private function clearDefenseEntries(BlockstringSequence $sequence): void
    {
        foreach ($sequence->getDefenseEntries()->toArray() as $entry) {
            $sequence->getDefenseEntries()->removeElement($entry);
            $this->entityManager->remove($entry);
        }
    }

    private function clearGaps(BlockstringSequence $sequence): void
    {
        foreach ($sequence->getGaps()->toArray() as $gap) {
            $sequence->getGaps()->removeElement($gap);
            $this->entityManager->remove($gap);
        }
    }

    /** @return array<int, BlockstringSequenceStep> */
    private function replaceSteps(BlockstringSequence $sequence, mixed $stepsPayload): array
    {
        if (!is_array($stepsPayload) || [] === $stepsPayload) {
            throw new BadRequestHttpException('At least one sequence step is required.');
        }

        foreach ($sequence->getSteps()->toArray() as $step) {
            $sequence->getSteps()->removeElement($step);
            $this->entityManager->remove($step);
        }

        $ordinal = 1;
        $stepsByOrdinal = [];
        foreach ($stepsPayload as $stepPayload) {
            if (!is_array($stepPayload)) {
                throw new BadRequestHttpException('Each step must be an object.');
            }

            $step = (new BlockstringSequenceStep())
                ->setMove($this->findMove($this->requiredString($stepPayload, 'moveId')))
                ->setOrdinal($this->nullableInt($stepPayload['ordinal'] ?? null) ?? $ordinal)
                ->setCanConfirmOnHit((bool) ($stepPayload['canConfirmOnHit'] ?? false))
                ->setNote($this->nullableString($stepPayload['note'] ?? null));

            $sequence->addStep($step);
            $this->entityManager->persist($step);
            $stepsByOrdinal[$step->getOrdinal()] = $step;
            ++$ordinal;
        }

        return $stepsByOrdinal;
    }

    /**
     * @param array<int, BlockstringSequenceStep> $stepsByOrdinal
     * @return array<string, BlockstringGap>
     */
    private function replaceGaps(BlockstringSequence $sequence, mixed $gapsPayload, array $stepsByOrdinal): array
    {
        if (!is_array($gapsPayload)) {
            return [];
        }

        $gapsByClientId = [];
        $index = 1;
        foreach ($gapsPayload as $gapPayload) {
            if (!is_array($gapPayload)) {
                continue;
            }

            $stepOrdinal = $this->nullableInt($gapPayload['stepOrdinal'] ?? null);
            if (null === $stepOrdinal || !isset($stepsByOrdinal[$stepOrdinal])) {
                throw new BadRequestHttpException('Gap must target a sequence step.');
            }
            $frames = $this->nullableInt($gapPayload['frames'] ?? null);
            if (null === $frames) {
                throw new BadRequestHttpException('Gap frames are required.');
            }

            $timing = $this->allowedString($gapPayload['timing'] ?? 'before_step', 'timing', ['before_step', 'during_step']);

            $gap = (new BlockstringGap())
                ->setStep($stepsByOrdinal[$stepOrdinal])
                ->setTiming($timing)
                ->setFrames($frames)
                ->setAttackerFrameAdvantage('before_step' === $timing ? $this->nullableInt($gapPayload['frameAdvantage'] ?? null) ?? 0 : 0)
                ->setClassification($this->allowedString($gapPayload['classification'] ?? $this->defaultGapClassification($frames), 'gap classification', ['safe', 'trades', 'fake']));

            $sequence->addGap($gap);
            $stepsByOrdinal[$stepOrdinal]->addGap($gap);
            $this->entityManager->persist($gap);
            $clientId = $this->nullableString($gapPayload['clientId'] ?? null) ?? sprintf('gap-%d', $index);
            $gapsByClientId[$clientId] = $gap;
            ++$index;
        }

        return $gapsByClientId;
    }

    private function replaceConditions(BlockstringSequence $sequence, mixed $conditionsPayload): void
    {
        foreach ($sequence->getConditions()->toArray() as $condition) {
            $sequence->getConditions()->removeElement($condition);
            $this->entityManager->remove($condition);
        }

        if (!is_array($conditionsPayload)) {
            return;
        }

        foreach ($conditionsPayload as $conditionPayload) {
            if (!is_array($conditionPayload)) {
                continue;
            }

            $condition = (new BlockstringCondition())
                ->setKind($this->requiredString($conditionPayload, 'kind'))
                ->setValue($this->requiredString($conditionPayload, 'value'))
                ->setNote($this->nullableString($conditionPayload['note'] ?? null));
            $sequence->addCondition($condition);
            $this->entityManager->persist($condition);
        }
    }

    /** @param array<string, BlockstringGap> $gapsByClientId */
    private function replaceDefenseEntries(BlockstringSequence $sequence, mixed $entriesPayload, array $gapsByClientId): void
    {
        if (!is_array($entriesPayload)) {
            return;
        }

        foreach ($entriesPayload as $entryPayload) {
            if (!is_array($entryPayload)) {
                continue;
            }

            $gapClientId = $this->nullableString($entryPayload['gapClientId'] ?? null);
            if (null === $gapClientId || !isset($gapsByClientId[$gapClientId])) {
                throw new BadRequestHttpException('Defense entry must target a sequence gap.');
            }

            $entry = (new BlockstringDefenseEntry())
                ->setGap($gapsByClientId[$gapClientId])
                ->setInstruction($this->nullableString($entryPayload['instruction'] ?? null))
                ->setExceptionNotes($this->nullableString($entryPayload['exceptionNotes'] ?? null))
                ->setDefenderCharacter($this->findNullableCharacter($this->nullableString($entryPayload['defenderCharacterId'] ?? null)))
                ->setMove($this->findNullableMove($this->nullableString($entryPayload['moveId'] ?? null)))
                ->setResponseType($this->allowedString($entryPayload['responseType'] ?? 'button', 'responseType', ['button', 'reversal', 'jump', 'backdash', 'block', 'movement']))
                ->setOutcome($this->allowedString($entryPayload['outcome'] ?? 'counter_hit', 'outcome', ['counter_hit', 'punish_counter', 'trade', 'escape', 'reset_to_neutral', 'block']))
                ->setConversion($this->nullableString($entryPayload['conversion'] ?? null));
            $sequence->addDefenseEntry($entry);
            $this->entityManager->persist($entry);
        }
    }

    /** @param array<string, BlockstringGap> $gapsByClientId */
    private function replaceAdaptations(BlockstringSequence $sequence, mixed $adaptationsPayload, array $gapsByClientId): void
    {
        if (!is_array($adaptationsPayload)) {
            return;
        }

        $sortOrder = 1;
        foreach ($adaptationsPayload as $adaptationPayload) {
            if (!is_array($adaptationPayload)) {
                continue;
            }

            $gapClientId = $this->nullableString($adaptationPayload['gapClientId'] ?? null);
            if (null === $gapClientId || !isset($gapsByClientId[$gapClientId])) {
                throw new BadRequestHttpException('Adaptation must target a sequence gap.');
            }

            $stepsPayload = $adaptationPayload['steps'] ?? [];
            if (!is_array($stepsPayload) || [] === $stepsPayload) {
                throw new BadRequestHttpException('Adaptation route must include at least one move.');
            }

            $adaptation = (new BlockstringAdaptation())
                ->setGap($gapsByClientId[$gapClientId])
                ->setExplanation($this->nullableString($adaptationPayload['explanation'] ?? null))
                ->setSortOrder($sortOrder);
            $sequence->addAdaptation($adaptation);
            $this->entityManager->persist($adaptation);

            $ordinal = 1;
            foreach ($stepsPayload as $stepPayload) {
                if (!is_array($stepPayload)) {
                    continue;
                }
                $step = (new BlockstringAdaptationStep())
                    ->setMove($this->findMove($this->requiredString($stepPayload, 'moveId')))
                    ->setOrdinal($ordinal);
                $adaptation->addStep($step);
                $this->entityManager->persist($step);
                ++$ordinal;
            }

            if (0 === $adaptation->getSteps()->count()) {
                throw new BadRequestHttpException('Adaptation route must include at least one move.');
            }

            if (is_array($adaptationPayload['comboSearch'] ?? null)) {
                $comboSearch = $this->buildComboSearch($sequence, $adaptationPayload['comboSearch']);
                $adaptation->setComboSearch($comboSearch);
                $this->entityManager->persist($comboSearch);
            }

            ++$sortOrder;
        }
    }

    /** @param array<string, mixed> $payload */
    private function buildComboSearch(BlockstringSequence $sequence, array $payload): BlockstringAdaptationComboSearch
    {
        $attacker = $sequence->getAttackerCharacter();
        if (!$attacker instanceof Character) {
            throw new BadRequestHttpException('Blockstring attacker is required for adaptation combo search.');
        }

        $firstMove = $this->findNullableMove($this->nullableString($payload['firstMoveId'] ?? null));
        $enderMove = $this->findNullableMove($this->nullableString($payload['enderMoveId'] ?? null));
        $this->assertMoveBelongsToCharacter($firstMove, $attacker, 'firstMoveId');
        $this->assertMoveBelongsToCharacter($enderMove, $attacker, 'enderMoveId');

        return (new BlockstringAdaptationComboSearch())
            ->setCharacter($attacker)
            ->setFirstMove($firstMove)
            ->setEnderMove($enderMove)
            ->setSituation($this->findNullableSituation($this->nullableInt($payload['situationId'] ?? null)))
            ->setSpacing($this->findNullableSpacing($this->nullableString($payload['spacingCode'] ?? null)))
            ->setMinDamage($this->nullableInt($payload['minDamage'] ?? null))
            ->setMaxDamage($this->nullableInt($payload['maxDamage'] ?? null))
            ->setMinDriveCost($this->nullableFloat($payload['minDriveCost'] ?? null))
            ->setMaxDriveCost($this->nullableFloat($payload['maxDriveCost'] ?? null))
            ->setCounterHitRequired($this->nullableBool($payload['counterHitRequired'] ?? null))
            ->setPunishCounterRequired($this->nullableBool($payload['punishCounterRequired'] ?? null))
            ->setCornerRequired($this->nullableBool($payload['cornerRequired'] ?? null));
    }

    /** @param array<string, mixed> $payload */
    private function requiredString(array $payload, string $key): string
    {
        $value = $payload[$key] ?? null;
        if (!is_string($value) && !is_int($value)) {
            throw new BadRequestHttpException(sprintf('%s is required.', $key));
        }

        $trimmed = trim((string) $value);
        if ('' === $trimmed) {
            throw new BadRequestHttpException(sprintf('%s is required.', $key));
        }

        return $trimmed;
    }

    private function nullableString(mixed $value): ?string
    {
        if (!is_string($value) && !is_int($value)) {
            return null;
        }
        $trimmed = trim((string) $value);

        return '' === $trimmed ? null : $trimmed;
    }

    private function nullableInt(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }
        if (!is_string($value) || !preg_match('/^-?\d+$/', trim($value))) {
            return null;
        }

        return (int) trim($value);
    }

    private function nullableFloat(mixed $value): ?float
    {
        if (is_float($value) || is_int($value)) {
            return (float) $value;
        }
        if (!is_string($value) || !is_numeric(trim($value))) {
            return null;
        }

        return (float) trim($value);
    }

    private function nullableBool(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_string($value) && in_array(mb_strtolower(trim($value)), ['true', '1', 'false', '0'], true)) {
            return in_array(mb_strtolower(trim($value)), ['true', '1'], true);
        }

        return null;
    }

    private function defaultGapClassification(int $frames): string
    {
        if ($frames <= 2) {
            return 'safe';
        }

        return 3 === $frames ? 'trades' : 'fake';
    }

    /** @param list<string> $allowed */
    private function allowedString(mixed $value, string $field, array $allowed): string
    {
        $normalized = is_string($value) ? trim(mb_strtolower($value)) : '';
        if (!in_array($normalized, $allowed, true)) {
            throw new BadRequestHttpException(sprintf('Invalid %s.', $field));
        }

        return $normalized;
    }

    private function findCharacter(string $id): Character
    {
        $character = $this->entityManager->find(Character::class, $id);
        if (!$character instanceof Character) {
            throw new BadRequestHttpException(sprintf('Character %s not found.', $id));
        }

        return $character;
    }

    private function findNullableCharacter(?string $id): ?Character
    {
        return null === $id ? null : $this->findCharacter($id);
    }

    private function findMove(string $id): Move
    {
        $move = $this->entityManager->find(Move::class, $id);
        if (!$move instanceof Move) {
            throw new BadRequestHttpException(sprintf('Move %s not found.', $id));
        }

        return $move;
    }

    private function findNullableMove(?string $id): ?Move
    {
        return null === $id ? null : $this->findMove($id);
    }

    private function findNullableSituation(?int $id): ?Situation
    {
        if (null === $id) {
            return null;
        }
        $situation = $this->entityManager->find(Situation::class, $id);
        if (!$situation instanceof Situation) {
            throw new BadRequestHttpException(sprintf('Situation %d not found.', $id));
        }

        return $situation;
    }

    private function findNullableSpacing(?string $code): ?ComboSpacing
    {
        if (null === $code) {
            return null;
        }
        $spacing = $this->entityManager->getRepository(ComboSpacing::class)->findOneBy(['code' => $code]);
        if (!$spacing instanceof ComboSpacing) {
            throw new BadRequestHttpException(sprintf('Spacing %s not found.', $code));
        }

        return $spacing;
    }

    private function assertMoveBelongsToCharacter(?Move $move, Character $character, string $field): void
    {
        if (null === $move || (string) $move->getCharacter()->getId() === (string) $character->getId()) {
            return;
        }

        throw new BadRequestHttpException(sprintf('%s must belong to the blockstring attacker.', $field));
    }
}
