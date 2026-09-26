<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\FrameData;
use App\Entity\Move;
use App\Repository\MoveRepository;
use App\Service\FgTheorySupplementalCsvImportService;
use App\Tests\DatabaseTestCase;

final class FgTheorySupplementalCsvImportServiceTest extends DatabaseTestCase
{
    public function testRangeColumnSetsEffectiveSpacingAndCanBeCorrectedByReimport(): void
    {
        $this->importCsv([['5HP', 'Stand HP', '1.97 (1.46)'], ['236236K', 'Super Art Level 1', '?']]);

        self::assertSame(1.97, $this->effectiveFrameData('5HP')->getSpacing());
        self::assertNull($this->effectiveFrameData('236236K')->getSpacing());

        $this->importCsv([['5HP', 'Stand HP', '2.04']]);

        $standHp = $this->effectiveFrameData('5HP');
        self::assertSame(2.04, $standHp->getSpacing(), 'The newer supplemental batch wins through the overlay.');
        self::assertSame(1.97, $standHp->getRawValue('spacing'), 'Frame data is only written when the import creates it.');
    }

    public function testCsvWithoutRangeColumnStillImports(): void
    {
        $path = $this->writeCsv("character_name,numpad_notation,move_name\nYasmine,5LP,Stand LP\n");

        $result = static::getContainer()->get(FgTheorySupplementalCsvImportService::class)->import($path, 'no range');

        self::assertSame(1, $result->processed);
        self::assertNull($this->effectiveFrameData('5LP')->getSpacing());
    }

    /** @param list<array{0: string, 1: string, 2: string}> $rows notation, name, range */
    private function importCsv(array $rows): void
    {
        $csv = "character_name,numpad_notation,move_name,move_type,range\n";
        foreach ($rows as [$notation, $name, $range]) {
            $csv .= sprintf("Yasmine,%s,%s,normal,\"%s\"\n", $notation, $name, $range);
        }

        static::getContainer()->get(FgTheorySupplementalCsvImportService::class)->import($this->writeCsv($csv), 'test');
        $this->entityManager->clear();
    }

    private function writeCsv(string $contents): string
    {
        $path = (string) tempnam(sys_get_temp_dir(), 'supplemental');
        file_put_contents($path, $contents);

        return $path;
    }

    private function effectiveFrameData(string $notation): FrameData
    {
        $move = $this->entityManager->getRepository(Move::class)->findOneBy(['numpadNotation' => $notation]);
        self::assertInstanceOf(Move::class, $move);
        $effective = static::getContainer()->get(MoveRepository::class)->findWithEffectiveFrameData($move->getId()?->toRfc4122());
        self::assertInstanceOf(Move::class, $effective);
        self::assertInstanceOf(FrameData::class, $effective->getFrameData());

        return $effective->getFrameData();
    }
}
