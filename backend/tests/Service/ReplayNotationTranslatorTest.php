<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\NotationTranslation;
use App\Entity\Visibility;
use App\Service\ReplayComboStepResolver;
use App\Service\ReplayNotationTranslator;
use App\Tests\DatabaseTestCase;

final class ReplayNotationTranslatorTest extends DatabaseTestCase
{
    private Character $fighter;
    private Character $other;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fighter = (new Character())->setName('Test Fighter');
        $this->other = (new Character())->setName('Other Fighter');
        $this->entityManager->persist($this->fighter);
        $this->entityManager->persist($this->other);
        $this->entityManager->flush();
    }

    public function testWithoutRulesTheNotationIsTheOnlyCandidate(): void
    {
        self::assertSame(['236+K~6HK'], $this->translator()->candidates('236+K~6HK', $this->fighter));
    }

    public function testRegexRulesApplyCumulativelyInPriorityOrder(): void
    {
        $this->rules([
            [null, NotationTranslation::KIND_REGEX, '\(close\)', '(proximity)', 20],
            [null, NotationTranslation::KIND_REGEX, '~', ' > ', 10],
        ]);

        self::assertSame(
            ['236+K (close)~K', '236+K (close) > K', '236+K (proximity) > K'],
            $this->translator()->candidates('236+K (close)~K', $this->fighter),
        );
    }

    public function testCharacterRulesRunBeforeGlobalRulesAndOnlyForTheirCharacter(): void
    {
        $this->rules([
            [null, NotationTranslation::KIND_REGEX, '~', ' > ', 0],
            [$this->fighter, NotationTranslation::KIND_EXACT, 'KK~623+P', '5KK > 623P', 50],
        ]);

        self::assertSame(['KK~623+P', '5KK > 623P'], $this->translator()->candidates('KK~623+P', $this->fighter));
        self::assertSame(['KK~623+P', 'KK > 623+P'], $this->translator()->candidates('KK~623+P', $this->other));
    }

    public function testExactRulesIgnoreSpacingPlusAndChargeBrackets(): void
    {
        $this->rules([[null, NotationTranslation::KIND_EXACT, '[2]8+MK (Perfect)', '28MK', 0]]);

        self::assertSame(['28MK (Perfect)', '28MK'], $this->translator()->candidates('28MK (Perfect)', $this->fighter));
    }

    public function testInvalidRegexIsDetected(): void
    {
        self::assertTrue(ReplayNotationTranslator::isValidRegex('^W\.(.+)$'));
        self::assertFalse(ReplayNotationTranslator::isValidRegex('(unclosed'));
    }

    public function testResolverMatchesATranslatedLeafAndNotesIt(): void
    {
        $this->leaves(['236K > 6HK', '5LP']);
        $this->rules([[null, NotationTranslation::KIND_REGEX, '~', ' > ', 0]]);

        $resolution = $this->resolve([['kind' => 'move', 'notation' => '5LP'], ['kind' => 'move', 'notation' => '236+K~6HK', 'connection' => 'special_cancel']]);

        self::assertSame('5LP > 236K > 6HK', $resolution['notation']);
        self::assertSame(['"236+K~6HK" read as "236+K > 6HK".'], $resolution['notes']);
    }

    public function testResolverPassesOverAnAmbiguousCandidate(): void
    {
        // "6MP" names both the plain leaf and the "4MP or 6MP" leaf; the rewrite names the one intended.
        $this->leaves(['6MP', '4MP or 6MP', '6MP (far)']);
        $this->rules([[null, NotationTranslation::KIND_REGEX, '^6MP$', '6MP (far)', 0]]);

        $resolution = $this->resolve([['kind' => 'move', 'notation' => '6MP']]);

        self::assertSame('6MP (far)', $resolution['notation']);
    }

    public function testStrengthAgnosticNotationStillBlocksWithoutARule(): void
    {
        $this->leaves(['214LP', '214MP']);
        $this->rules([[null, NotationTranslation::KIND_REGEX, '~', ' > ', 0]]);

        $this->expectExceptionMessage('does not say which strength was used');
        $this->resolve([['kind' => 'move', 'notation' => '214+P']]);
    }

    public function testMissingLeafErrorListsTheTranslationsTried(): void
    {
        $this->leaves(['5LP']);
        $this->rules([[null, NotationTranslation::KIND_REGEX, '~', ' > ', 0]]);

        $this->expectExceptionMessage('No leaf move matches notation "236+K~6HK" for Test Fighter (also tried "236+K > 6HK").');
        $this->resolve([['kind' => 'move', 'notation' => '236+K~6HK']]);
    }

    public function testTargetHopNamingTheChainSoFarIsTranslated(): void
    {
        $this->leaves(['5MP', '5MP > MP', '5MP > MP > MP']);
        $this->rules([[null, NotationTranslation::KIND_REGEX, '~', ' > ', 0]]);

        $resolution = $this->resolve([
            ['kind' => 'move', 'notation' => '5MP'],
            ['kind' => 'move', 'notation' => 'MP', 'relation_kind' => 'target_combo', 'target_notation' => '5MP > MP'],
            ['kind' => 'move', 'notation' => 'MP', 'relation_kind' => 'target_combo', 'target_notation' => '5MP~MP > MP'],
        ]);

        self::assertSame('5MP > MP > MP', $resolution['notation']);
    }

    public function testLaterHopsComposeOnTheTranslatedChain(): void
    {
        $this->leaves(['5MP', '5MP > 4HP', '5MP > 4HP > HP']);
        $this->rules([
            [$this->fighter, NotationTranslation::KIND_EXACT, '5MP > HP', '5MP > 4HP', 0],
            [null, NotationTranslation::KIND_REGEX, '~', ' > ', 0],
        ]);

        $resolution = $this->resolve([
            ['kind' => 'move', 'notation' => '5MP'],
            ['kind' => 'move', 'notation' => '5MP~4HP', 'relation_kind' => 'target_combo', 'target_notation' => '5MP > HP'],
            ['kind' => 'move', 'notation' => '5MP~4HP~HP', 'relation_kind' => 'target_combo', 'target_notation' => '5MP~4HP > HP'],
        ]);

        self::assertSame('5MP > 4HP > HP', $resolution['notation']);
    }

    private function translator(): ReplayNotationTranslator
    {
        $translator = static::getContainer()->get(ReplayNotationTranslator::class);
        $translator->clearCache();

        return $translator;
    }

    /**
     * @param list<array<string, mixed>> $sequence
     *
     * @return array{steps: list<array<string, mixed>>, notation: string, notes: list<string>, sourceIndexes: list<list<int>>}
     */
    private function resolve(array $sequence): array
    {
        $resolver = static::getContainer()->get(ReplayComboStepResolver::class);
        $resolver->clearCache();

        return $resolver->resolve($sequence, $this->fighter);
    }

    /** @param list<array{0: Character|null, 1: string, 2: string, 3: string, 4: int}> $rules */
    private function rules(array $rules): void
    {
        foreach ($rules as [$character, $kind, $from, $to, $priority]) {
            $this->entityManager->persist(new NotationTranslation($character, $kind, $from, $to, $priority, null));
        }
        $this->entityManager->flush();
    }

    /** @param list<string> $notations */
    private function leaves(array $notations): void
    {
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        $this->entityManager->persist($leafType);
        $this->entityManager->persist($visibility);
        foreach (['Initial Move', 'Link', 'Special'] as $connectionName) {
            $this->entityManager->persist((new ConnectionType())->setName($connectionName));
        }
        foreach ($notations as $notation) {
            $move = (new Move())->setCharacter($this->fighter)->setNumpadNotation($notation);
            $this->entityManager->persist($move);
            $this->entityManager->persist(
                (new ComboSequences())->setName($notation)->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility)
            );
        }
        $this->entityManager->flush();
    }
}
