<?php declare(strict_types=1);

namespace App\Service\ComboImport\Parser;

use App\Service\ComboImport\Model\ImportParseResult;
use App\Service\ComboImport\Model\ImportedRow;

interface ComboImportParserInterface
{
    /**
     * @param array<int, ImportedRow> $rows
     */
    public function parse(array $rows, string $character, string $sourceFile, ?string $onlySection = null): ImportParseResult;
}
