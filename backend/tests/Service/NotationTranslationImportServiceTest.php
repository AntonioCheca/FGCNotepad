<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Move;
use App\Entity\NotationTranslation;
use App\Entity\Visibility;
use App\Service\NotationTranslationImportService;
use App\Tests\DatabaseTestCase;

final class NotationTranslationImportServiceTest extends DatabaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->entityManager->persist((new Character())->setName('Test Fighter'));
        $this->entityManager->flush();
    }

    public function testImportReplacesTheWholeRuleSet(): void
    {
        $this->import("character,kind,from,to,priority,note\n,regex,~, > ,10,separator\nTest Fighter,exact,KK~623+P,5KK > 623P,,\n");
        $this->import("character,kind,from,to\n,regex,\\(close\\),(proximity)\n");

        $rules = $this->entityManager->getRepository(NotationTranslation::class)->findAll();
        self::assertCount(1, $rules);
        self::assertSame('\(close\)', $rules[0]->getSourcePattern(), 'Backslashes reach the rule untouched.');
        self::assertNull($rules[0]->getCharacter());
        self::assertSame(0, $rules[0]->getPriority());
    }

    public function testConditionColumnIsStoredOnTheRule(): void
    {
        $this->import("character,kind,from,to,condition\n,regex,^(.+)$,$1 (install),install\nTest Fighter,exact,236MP,236MP (Toxic),defender_status=p_hand\n,regex,~, > ,\n");

        $rules = $this->entityManager->getRepository(NotationTranslation::class)->findBy([], ['id' => 'ASC']);
        self::assertSame([['install', null], ['defender_status', 'p_hand'], [null, null]], array_map(
            static fn (NotationTranslation $rule): array => [$rule->getConditionKind(), $rule->getConditionValue()],
            $rules,
        ));
    }

    public function testUnknownConditionRejectsTheFile(): void
    {
        $this->expectExceptionMessage('line 2: condition must be empty, "install" or "defender_status=<kind>", got "poisoned".');
        $this->import("character,kind,from,to,condition\n,regex,~, > ,poisoned\n");
    }

    public function testRegexReplacementKeepsItsSurroundingSpaces(): void
    {
        $this->import("character,kind,from,to\n,regex,~, > \n");

        $rule = $this->entityManager->getRepository(NotationTranslation::class)->findOneBy([]);
        self::assertSame(' > ', $rule?->getReplacement());
    }

    public function testInvalidRowsRejectTheFileAndKeepTheCurrentRules(): void
    {
        $this->import("character,kind,from,to\n,regex,~, > \n");

        try {
            $this->import("character,kind,from,to\n,regex,(unclosed,x\nNobody,exact,5LP,5LP\n,fuzzy,a,b\n");
            self::fail('The import should have been rejected.');
        } catch (\InvalidArgumentException $exception) {
            self::assertStringContainsString('3 invalid rows', $exception->getMessage());
            self::assertStringContainsString('line 2: "(unclosed" is not a valid regular expression.', $exception->getMessage());
            self::assertStringContainsString('line 3: Unknown character "Nobody".', $exception->getMessage());
        }

        self::assertCount(1, $this->entityManager->getRepository(NotationTranslation::class)->findAll());
    }

    public function testReportGroupsRemainingFailuresByCharacter(): void
    {
        $this->persistLeaves(['5LP', '236K > 6HK']);
        $this->import("character,kind,from,to\n,regex,~, > \n");
        $bundle = ['documents' => [['combos' => [
            ['character' => 'Test Fighter', 'ready_to_export' => true, 'sequence' => [['kind' => 'move', 'notation' => '5LP'], ['kind' => 'move', 'notation' => '236+K~6HK', 'connection' => 'link']]],
            ['character' => 'Test Fighter', 'ready_to_export' => true, 'sequence' => [['kind' => 'move', 'notation' => '8HK']]],
            ['character' => 'Test Fighter', 'ready_to_export' => false, 'sequence' => []],
        ]]]];

        $report = $this->service()->report($this->write(json_encode($bundle, JSON_THROW_ON_ERROR)));

        self::assertSame(2, $report['checked']);
        self::assertSame(1, $report['resolved']);
        self::assertSame(1, $report['notReady']);
        self::assertSame(1, $report['translatedSteps']);
        self::assertSame(['Test Fighter' => ['No leaf move matches notation "8HK" for Test Fighter.' => 1]], $report['failures']);
    }

    private function import(string $csv): void
    {
        $this->service()->replaceRules($this->write($csv));
        $this->entityManager->clear();
    }

    private function service(): NotationTranslationImportService
    {
        return static::getContainer()->get(NotationTranslationImportService::class);
    }

    private function write(string $contents): string
    {
        $path = (string) tempnam(sys_get_temp_dir(), 'notation');
        file_put_contents($path, $contents);

        return $path;
    }

    /** @param list<string> $notations */
    private function persistLeaves(array $notations): void
    {
        $character = $this->entityManager->getRepository(Character::class)->findOneBy(['name' => 'Test Fighter']);
        $leafType = (new ComboSequenceType())->setName('leaf');
        $visibility = (new Visibility())->setName('public');
        $this->entityManager->persist($leafType);
        $this->entityManager->persist($visibility);
        foreach (['Initial Move', 'Link'] as $connectionName) {
            $this->entityManager->persist((new ConnectionType())->setName($connectionName));
        }
        foreach ($notations as $notation) {
            $move = (new Move())->setCharacter($character)->setNumpadNotation($notation);
            $this->entityManager->persist($move);
            $this->entityManager->persist(
                (new ComboSequences())->setName($notation)->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility)
            );
        }
        $this->entityManager->flush();
    }
}
