<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\BlockstringCondition;
use App\Entity\BlockstringDefenseAnswer;
use App\Entity\BlockstringDefenseEntry;
use App\Entity\BlockstringOffensePlan;
use App\Entity\BlockstringSequence;
use App\Entity\BlockstringSequenceStep;
use App\Entity\Character;
use App\Entity\Move;
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
            ->setGapAfterStep($this->nullableInt($payload['gapAfterStep'] ?? null))
            ->setMaxInterruptStartup($this->nullableInt($payload['maxInterruptStartup'] ?? null))
            ->setAttackerCharacter($this->findCharacter($this->requiredString($payload, 'attackerCharacterId')));

        $this->replaceSteps($sequence, $payload['steps'] ?? []);
        $this->replaceConditions($sequence, $payload['conditions'] ?? []);
        $this->replaceOffensePlans($sequence, $payload['offensePlans'] ?? []);
        $this->replaceDefenseEntries($sequence, $payload['defenseEntries'] ?? []);
    }

    private function replaceSteps(BlockstringSequence $sequence, mixed $stepsPayload): void
    {
        if (!is_array($stepsPayload) || [] === $stepsPayload) {
            throw new BadRequestHttpException('At least one sequence step is required.');
        }

        foreach ($sequence->getSteps()->toArray() as $step) {
            $sequence->getSteps()->removeElement($step);
            $this->entityManager->remove($step);
        }

        $ordinal = 1;
        foreach ($stepsPayload as $stepPayload) {
            if (!is_array($stepPayload)) {
                throw new BadRequestHttpException('Each step must be an object.');
            }

            $step = (new BlockstringSequenceStep())
                ->setMove($this->findMove($this->requiredString($stepPayload, 'moveId')))
                ->setOrdinal($this->nullableInt($stepPayload['ordinal'] ?? null) ?? $ordinal)
                ->setGapBefore((bool) ($stepPayload['gapBefore'] ?? false))
                ->setGapFrames($this->nullableInt($stepPayload['gapFrames'] ?? null))
                ->setCanConfirmOnHit((bool) ($stepPayload['canConfirmOnHit'] ?? false))
                ->setNote($this->nullableString($stepPayload['note'] ?? null));

            $sequence->addStep($step);
            $this->entityManager->persist($step);
            ++$ordinal;
        }
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

    private function replaceOffensePlans(BlockstringSequence $sequence, mixed $plansPayload): void
    {
        foreach ($sequence->getOffensePlans()->toArray() as $plan) {
            $sequence->getOffensePlans()->removeElement($plan);
            $this->entityManager->remove($plan);
        }

        if (!is_array($plansPayload)) {
            return;
        }

        $sortOrder = 0;
        foreach ($plansPayload as $planPayload) {
            if (!is_array($planPayload)) {
                continue;
            }

            $plan = (new BlockstringOffensePlan())
                ->setLabel($this->requiredString($planPayload, 'label'))
                ->setPlanRole($this->allowedString($planPayload['planRole'] ?? 'situational', 'planRole', ['default', 'safe', 'risky', 'situational']))
                ->setTargetBehavior($this->nullableString($planPayload['targetBehavior'] ?? null))
                ->setPurpose($this->nullableString($planPayload['purpose'] ?? null))
                ->setOnHit($this->nullableString($planPayload['onHit'] ?? null))
                ->setOnBlock($this->nullableString($planPayload['onBlock'] ?? null))
                ->setLosesTo($this->nullableString($planPayload['losesTo'] ?? null))
                ->setAuthorExplanation($this->nullableString($planPayload['authorExplanation'] ?? null))
                ->setSortOrder($this->nullableInt($planPayload['sortOrder'] ?? null) ?? $sortOrder);
            $sequence->addOffensePlan($plan);
            $this->entityManager->persist($plan);
            ++$sortOrder;
        }
    }

    private function replaceDefenseEntries(BlockstringSequence $sequence, mixed $entriesPayload): void
    {
        foreach ($sequence->getDefenseEntries()->toArray() as $entry) {
            $sequence->getDefenseEntries()->removeElement($entry);
            $this->entityManager->remove($entry);
        }

        if (!is_array($entriesPayload)) {
            return;
        }

        foreach ($entriesPayload as $entryPayload) {
            if (!is_array($entryPayload)) {
                continue;
            }

            $entry = (new BlockstringDefenseEntry())
                ->setActAfterStep($this->nullableInt($entryPayload['actAfterStep'] ?? null))
                ->setInstruction($this->nullableString($entryPayload['instruction'] ?? null))
                ->setExceptionNotes($this->nullableString($entryPayload['exceptionNotes'] ?? null));
            $sequence->addDefenseEntry($entry);
            $this->entityManager->persist($entry);

            $answers = $entryPayload['answers'] ?? [];
            if (!is_array($answers)) {
                continue;
            }
            foreach ($answers as $answerPayload) {
                if (!is_array($answerPayload)) {
                    continue;
                }
                $answer = (new BlockstringDefenseAnswer())
                    ->setDefenderCharacter($this->findNullableCharacter($this->nullableString($answerPayload['defenderCharacterId'] ?? null)))
                    ->setMove($this->findNullableMove($this->nullableString($answerPayload['moveId'] ?? null)))
                    ->setResponseType($this->allowedString($answerPayload['responseType'] ?? 'button', 'responseType', ['button', 'reversal', 'jump', 'backdash', 'block', 'movement']))
                    ->setStartupFrames($this->nullableInt($answerPayload['startupFrames'] ?? null))
                    ->setOutcome($this->allowedString($answerPayload['outcome'] ?? 'counter_hit', 'outcome', ['counter_hit', 'punish_counter', 'trade', 'escape', 'reset_to_neutral', 'block']))
                    ->setConversion($this->nullableString($answerPayload['conversion'] ?? null))
                    ->setRecommended((bool) ($answerPayload['recommended'] ?? false));
                $entry->addAnswer($answer);
                $this->entityManager->persist($answer);
            }
        }
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
}
