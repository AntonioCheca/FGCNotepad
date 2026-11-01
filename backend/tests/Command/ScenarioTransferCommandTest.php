<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ExportScenariosCommand;
use App\Command\ImportScenarioExportCommand;
use App\Entity\Character;
use App\Entity\Move;
use App\Entity\Scenario;
use App\Tests\DatabaseTestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;

final class ScenarioTransferCommandTest extends DatabaseTestCase
{
    private string $directory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->directory = sys_get_temp_dir() . '/scenario-transfer-' . bin2hex(random_bytes(4));
        mkdir($this->directory);

        $juri = (new Character())->setName('Juri');
        $ken = (new Character())->setName('Ken');
        $this->entityManager->persist($juri);
        $this->entityManager->persist($ken);
        $this->entityManager->persist((new Move())->setCharacter($juri)->setNumpadNotation('2HK'));
        $this->entityManager->flush();
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->directory . '/*') ?: []);
        rmdir($this->directory);
        parent::tearDown();
    }

    public function testDryRunWritesNothingThenImportAndExportRoundTrip(): void
    {
        $input = $this->directory . '/input.json';
        file_put_contents($input, json_encode($this->document(), JSON_THROW_ON_ERROR));
        $import = new CommandTester(static::getContainer()->get(ImportScenarioExportCommand::class));

        self::assertSame(Command::SUCCESS, $import->execute(['file' => $input, '--dry-run' => true]));
        self::assertStringContainsString('"action": "create"', $import->getDisplay());
        self::assertSame(0, $this->entityManager->getRepository(Scenario::class)->count([]));

        self::assertSame(Command::SUCCESS, $import->execute(['file' => $input]));
        self::assertSame(1, $this->entityManager->getRepository(Scenario::class)->count([]));

        $output = $this->directory . '/export.json';
        $export = new CommandTester(static::getContainer()->get(ExportScenariosCommand::class));
        self::assertSame(Command::SUCCESS, $export->execute(['--source' => 'sf6replaysdb', '--output' => $output]));

        $exported = json_decode((string) file_get_contents($output), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Juri 2HK oki vs Ken', $exported['scenarios'][0]['name']);
        self::assertSame(Command::SUCCESS, $import->execute(['file' => $output, '--dry-run' => true]));
        self::assertStringContainsString('"action": "unchanged"', $import->getDisplay());
    }

    public function testInvalidDocumentFails(): void
    {
        $input = $this->directory . '/input.json';
        file_put_contents($input, json_encode(['format' => 'scenario_export_v1', 'scenarios' => []], JSON_THROW_ON_ERROR));
        $import = new CommandTester(static::getContainer()->get(ImportScenarioExportCommand::class));

        self::assertSame(Command::FAILURE, $import->execute(['file' => $input]));
        self::assertStringContainsString('scenarios: must be a non-empty array.', $import->getDisplay());
    }

    /**
     * @return array<string, mixed>
     */
    private function document(): array
    {
        return [
            'format' => 'scenario_export_v1',
            'scenarios' => [[
                'key' => ['source' => 'sf6replaysdb', 'externalId' => 'juri-vs-ken/2hk-oki'],
                'name' => 'Juri 2HK oki vs Ken',
                'scenarioType' => 'oki',
                'attacker' => 'Juri',
                'defender' => 'Ken',
                'situation' => ['triggerMove' => ['notation' => '2HK']],
                'rows' => [['key' => 'meaty', 'label' => 'Meaty'], ['key' => 'throw', 'label' => 'Throw']],
                'columns' => [['key' => 'block', 'label' => 'Block'], ['key' => 'tech', 'label' => 'Tech']],
                'cells' => [
                    ['row' => 'meaty', 'column' => 'block', 'kind' => 'static', 'value' => 0],
                    ['row' => 'meaty', 'column' => 'tech', 'kind' => 'static', 'value' => 1400],
                    ['row' => 'throw', 'column' => 'block', 'kind' => 'static', 'value' => 1200],
                    ['row' => 'throw', 'column' => 'tech', 'kind' => 'static', 'value' => 0],
                ],
            ]],
        ];
    }
}
