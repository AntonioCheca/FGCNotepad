<?php declare(strict_types=1);

namespace App\Tests\Service\ScenarioTransfer;

use App\Service\AggregatedDefenseCatalogService;
use App\Service\ScenarioTransfer\ScenarioImportDocumentValidator;
use PHPUnit\Framework\TestCase;

final class ScenarioImportDocumentValidatorTest extends TestCase
{
    private const EXAMPLE = __DIR__ . '/../../../../docs/scenario-export/example.juri-vs-ken.json';

    public function testDocumentedExampleIsValid(): void
    {
        $result = $this->validator()->validate($this->example());

        self::assertSame([], $result['errors']);
        self::assertCount(2, $result['scenarios']);
        $scenario = $result['scenarios'][0];
        self::assertSame(['source' => 'sf6replaysdb', 'externalId' => 'juri-vs-ken/2hk-oki/midscreen'], $scenario['key']);
        self::assertSame(2, $scenario['columns'][2]['layer']);
        self::assertSame('defender', $scenario['cells'][0][2]['starter']['initiator']);
        self::assertSame('disputed', $scenario['cells'][2][1]['provenance']['status']);
    }

    /**
     * @param \Closure(array<string, mixed>): array<string, mixed> $mutate
     *
     * @dataProvider invalidDocuments
     */
    public function testRejectsInvalidDocumentsWithPathedErrors(\Closure $mutate, string $expectedError): void
    {
        $result = $this->validator()->validate($mutate($this->example()));

        self::assertContains($expectedError, $result['errors']);
        self::assertSame([], $result['scenarios']);
    }

    /**
     * @return iterable<string, array{\Closure, string}>
     */
    public static function invalidDocuments(): iterable
    {
        yield 'wrong format' => [
            static fn (array $document): array => ['format' => 'scenario_export_v2'] + $document,
            'format: must be "scenario_export_v1".',
        ];
        yield 'unknown property' => [
            static function (array $document): array {
                $document['scenarios'][0]['cells'][1]['starter']['hit_condition'] = 'counter_hit';

                return $document;
            },
            'scenarios[0].cells[1].starter: unknown property "hit_condition".',
        ];
        yield 'unsupported hit condition' => [
            static function (array $document): array {
                $document['scenarios'][0]['cells'][1]['starter']['hitCondition'] = 'drive_impact';

                return $document;
            },
            'scenarios[0].cells[1].starter.hitCondition: must be one of normal, counter_hit, punish_counter, perfect_parry.',
        ];
        yield 'seen frequency above 1' => [
            static function (array $document): array {
                $document['scenarios'][0]['rows'][0]['stats']['seenFrequency'] = 46;

                return $document;
            },
            'scenarios[0].rows[0].stats.seenFrequency: must be a number between 0 and 1.',
        ];
        yield 'negative seen sample count' => [
            static function (array $document): array {
                $document['scenarios'][0]['columns'][0]['stats']['sampleCount'] = -1;

                return $document;
            },
            'scenarios[0].columns[0].stats.sampleCount: must be a non-negative integer or null.',
        ];
        yield 'reference weight of 0' => [
            static function (array $document): array {
                $document['scenarios'][0]['cells'][8]['reference']['weight'] = 0;

                return $document;
            },
            'scenarios[0].cells[8].reference.weight: must be greater than 0 and at most 1.',
        ];
        yield 'reference weight above 1' => [
            static function (array $document): array {
                $document['scenarios'][0]['cells'][8]['reference']['weight'] = 1.2;

                return $document;
            },
            'scenarios[0].cells[8].reference.weight: must be greater than 0 and at most 1.',
        ];
        yield 'unknown reference perspective' => [
            static function (array $document): array {
                $document['scenarios'][0]['cells'][8]['reference']['perspective'] = 'defender';

                return $document;
            },
            'scenarios[0].cells[8].reference.perspective: must be one of same, opponent.',
        ];
        yield 'missing cell' => [
            static function (array $document): array {
                array_pop($document['scenarios'][1]['cells']);

                return $document;
            },
            'scenarios[1].cells: missing the cell for row "punish", column "recover".',
        ];
        yield 'cell on undeclared row' => [
            static function (array $document): array {
                $document['scenarios'][0]['cells'][0]['row'] = 'nope';

                return $document;
            },
            'scenarios[0].cells[0]: row and column must name keys declared in rows and columns.',
        ];
        yield 'duplicate scenario key' => [
            static function (array $document): array {
                $document['scenarios'][1]['key'] = $document['scenarios'][0]['key'];

                return $document;
            },
            'scenarios[1].key: duplicates scenarios[0].key.',
        ];
        yield 'confidence out of range' => [
            static function (array $document): array {
                $document['scenarios'][0]['cells'][0]['provenance']['confidence'] = 1.5;

                return $document;
            },
            'scenarios[0].cells[0].provenance.confidence: must be between 0 and 1.',
        ];
        yield 'no layer 1 column' => [
            static function (array $document): array {
                foreach ($document['scenarios'][0]['columns'] as $index => $column) {
                    $document['scenarios'][0]['columns'][$index]['layer'] = 2;
                }

                return $document;
            },
            'scenarios[0].columns: at least one entry must be on layer 1.',
        ];
        yield 'fractional super requirement' => [
            static function (array $document): array {
                $document['scenarios'][0]['rows'][3]['requirements'][0] = ['owner' => 'attacker', 'resource' => 'super', 'threshold' => 1.5];

                return $document;
            },
            'scenarios[0].rows[3].requirements[0].threshold: must be an integer for super.',
        ];
        yield 'aggregated scenario with custom columns' => [
            static function (array $document): array {
                $document['scenarios'][1]['scenarioType'] = 'aggregated_oki';

                return $document;
            },
            'scenarios[1].columns: aggregated_oki scenarios use the fixed layer-1 defensive columns, in order: Block, Mash 4f, Invincible Reversal Fast, Invincible Reversal Slow, Invincible Super, Backdash, Delay Tech, Perfect Parry, No Invincible Option.',
        ];
    }

    private function validator(): ScenarioImportDocumentValidator
    {
        return new ScenarioImportDocumentValidator(new AggregatedDefenseCatalogService());
    }

    /**
     * @return array<string, mixed>
     */
    private function example(): array
    {
        return json_decode((string) file_get_contents(self::EXAMPLE), true, 512, JSON_THROW_ON_ERROR);
    }
}
