<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Service\FrameDataScalingNormalizationResult;
use App\Service\FrameDataScalingNormalizerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'frame-data:import:fat-json',
    description: 'Import FAT JSON frame data into the database'
)]
class ImportFrameDataFromFatJsonCommand extends Command
{
    /**
     * @var array<string, int>
     */
    private const CHARACTER_LIFE_BY_NAME = [
        'Akuma' => 9000,
        'E.Honda' => 10500,
        'Marisa' => 10500,
        'Zangief' => 11000,
    ];

    private EntityManagerInterface $entityManager;
    private string $projectDir;
    private MoveRepository $moveRepository;
    private CharacterRepository $characterRepository;
    private FrameDataScalingNormalizerService $scalingNormalizer;

    public function __construct(EntityManagerInterface $entityManager, string $projectDir, MoveRepository $moveRepository, CharacterRepository $characterRepository, FrameDataScalingNormalizerService $scalingNormalizer)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
        $this->projectDir = $projectDir;
        $this->moveRepository = $moveRepository;
        $this->characterRepository = $characterRepository;
        $this->scalingNormalizer = $scalingNormalizer;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = $this->projectDir . '/data/fat_data.json';
        if (!file_exists($path)) {
            $output->writeln("<error>JSON file not found at: $path</error>");
            return Command::FAILURE;
        }

        $json = file_get_contents($path);
        $data = json_decode($json, true);

        if (!$data || !is_array($data)) {
            $output->writeln("<error>Invalid JSON format.</error>");
            return Command::FAILURE;
        }

        $count = 0;
        $updatedExistingCount = 0;
        /**
         * @var array<int, array{character:string,move:string,message:string}>
         */
        $scalingWarnings = [];

        foreach ($data as $characterName => $charData) {
            $moves = $charData['moves']['normal'] ?? [];

            $character = $this->characterRepository->findOneBy(['name' => $characterName]);
            $life = self::CHARACTER_LIFE_BY_NAME[$characterName] ?? 10000;

            if (!$character) {
                $character = new Character();
                $character->setName($characterName);
                $character->setLife($life);
                $this->entityManager->persist($character);
                $output->writeln("<info>Created new character: $characterName</info>");
            } elseif ($character->getLife() !== $life) {
                $character->setLife($life);
            }

            foreach ($moves as $moveName => $record) {
                $numCmd = $record['numCmd'] ?? null;
                if (!$numCmd) {
                    $output->writeln("<comment>Skipping move '$moveName' (missing numCmd)</comment>");
                    continue;
                }

                $move = $this->moveRepository->findOneBy([
                    'numpadNotation' => $numCmd,
                    'character' => $character
                ]);

                if (!$move) {
                    $move = new Move();
                    $move->setNumpadNotation($numCmd);
                    $move->setCharacter($character);
                    $this->entityManager->persist($move);
                }

                $frameData = $move->getFrameData();
                $isExistingFrameData = $frameData instanceof FrameData;
                if (!$isExistingFrameData) {
                    $frameData = new FrameData();
                    $move->setFrameData($frameData);
                    $this->entityManager->persist($frameData);
                }

                $rawScaling = isset($record['dmgScaling']) && is_string($record['dmgScaling']) ? $record['dmgScaling'] : null;
                $scaling = $this->scalingNormalizer->normalize($rawScaling);
                $changed = $this->applyFrameDataRecord($frameData, $record, $rawScaling, $scaling);
                if ($isExistingFrameData && $changed) {
                    $this->entityManager->persist($frameData);
                    ++$updatedExistingCount;
                }

                foreach ($scaling->warnings as $warning) {
                    $scalingWarnings[] = [
                        'character' => $characterName,
                        'move' => $moveName,
                        'message' => $warning,
                    ];
                    $output->writeln(sprintf('<comment>Scaling parse warning [%s - %s]: %s</comment>', $characterName, $moveName, $warning));
                }

                $count++;

                $output->writeln("<info>Processed move: {$moveName}</info>");
            }
        }

        $this->entityManager->flush();

        if ([] !== $scalingWarnings) {
            $output->writeln('');
            $output->writeln(sprintf('<comment>Scaling warnings summary: %d warning(s).</comment>', count($scalingWarnings)));

            $warningsByCharacter = [];
            foreach ($scalingWarnings as $entry) {
                $warningsByCharacter[$entry['character']][] = $entry;
            }

            ksort($warningsByCharacter);

            foreach ($warningsByCharacter as $character => $entries) {
                $output->writeln(sprintf('<comment>- %s: %d warning(s)</comment>', $character, count($entries)));
                foreach ($entries as $entry) {
                    $output->writeln(sprintf('<comment>  * %s => %s</comment>', $entry['move'], $entry['message']));
                }
            }
        }

        $output->writeln("<info>Imported $count moves into the database.</info>");
        $output->writeln(sprintf('<info>Existing moves updated due to differences: %d.</info>', $updatedExistingCount));
        return Command::SUCCESS;
    }

    /**
     * @param array<string, mixed> $record
     */
    private function applyFrameDataRecord(
        FrameData $frameData,
        array $record,
        ?string $rawScaling,
        FrameDataScalingNormalizationResult $scaling
    ): bool {
        $changed = false;

        $changed = $this->setIfChanged($frameData->getStartup(), (int) ($record['startup'] ?? 0), $frameData->setStartup(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getActive(), (int) ($record['active'] ?? 0), $frameData->setActive(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getRecovery(), (int) ($record['recovery'] ?? 0), $frameData->setRecovery(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getTotal(), (int) ($record['total'] ?? 0), $frameData->setTotal(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnHit(), (int) ($record['onHit'] ?? 0), $frameData->setOnHit(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnBlock(), (int) ($record['onBlock'] ?? 0), $frameData->setOnBlock(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnPunishCounter(), (int) ($record['onPC'] ?? 0), $frameData->setOnPunishCounter(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getMoveType(), (string) ($record['moveType'] ?? 'normal'), $frameData->setMoveType(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getCancelsTo(), json_encode($record['xx'] ?? []) ?: '[]', $frameData->setCancelsTo(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getDamage(), $this->parseDamageValue($record['fullDmg'] ?? $record['dmg'] ?? null), $frameData->setDamage(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScaling(), $rawScaling, $frameData->setScaling(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingStartPercent(), $scaling->startPercent, $frameData->setScalingStartPercent(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingImmediatePercent(), $scaling->immediatePercent, $frameData->setScalingImmediatePercent(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingMinimumPercent(), $scaling->minimumPercent, $frameData->setScalingMinimumPercent(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingComboHits(), $scaling->comboHits, $frameData->setScalingComboHits(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingComboExtraPercent(), $scaling->comboExtraPercent, $frameData->setScalingComboExtraPercent(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingMultiplierPercent(), $scaling->multiplierPercent, $frameData->setScalingMultiplierPercent(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingParseStatus(), $scaling->parseStatus, $frameData->setScalingParseStatus(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getScalingParseNote(), $scaling->parseNote, $frameData->setScalingParseNote(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getChipDamage(), (int) ($record['chp'] ?? 0), $frameData->setChipDamage(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getAttackLevel(), (string) ($record['atkLvl'] ?? 'Unknown'), $frameData->setAttackLevel(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnHitAfterDriveRush(), (int) ($record['DRoH'] ?? 0), $frameData->setOnHitAfterDriveRush(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnBlockAfterDriveRush(), (int) ($record['DRoB'] ?? 0), $frameData->setOnBlockAfterDriveRush(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnPerfectParry(), (int) ($record['onPP'] ?? 0), $frameData->setOnPerfectParry(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getDriveDamageOnHit(), (int) ($record['DDoH'] ?? 0), $frameData->setDriveDamageOnHit(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getDriveDamageOnBlock(), (int) ($record['DDoB'] ?? 0), $frameData->setDriveDamageOnBlock(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getDriveGain(), (int) ($record['DGain'] ?? 0), $frameData->setDriveGain(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnHitSelfSuperMeterGain(), (int) ($record['SelfSoH'] ?? 0), $frameData->setOnHitSelfSuperMeterGain(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnBlockSelfSuperMeterGain(), (int) ($record['SelfSoB'] ?? 0), $frameData->setOnBlockSelfSuperMeterGain(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnHitOpponentSuperMeterGain(), (int) ($record['OppSoH'] ?? 0), $frameData->setOnHitOpponentSuperMeterGain(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getOnBlockOpponentSuperMeterGain(), (int) ($record['OppSoB'] ?? 0), $frameData->setOnBlockOpponentSuperMeterGain(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getHitConfirmSpecialsAndSupers(), (int) ($record['hcWinSpCa'] ?? 0), $frameData->setHitConfirmSpecialsAndSupers(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getHitConfirmTargetCombos(), (int) ($record['hcWinTc'] ?? 0), $frameData->setHitConfirmTargetCombos(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getJuggleLimit(), (int) ($record['jugLimit'] ?? 0), $frameData->setJuggleLimit(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getJuggleIncrease(), (int) ($record['jugIncr'] ?? 0), $frameData->setJuggleIncrease(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getJuggleStart(), (int) ($record['jugStart'] ?? 0), $frameData->setJuggleStart(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getHitstun(), (int) ($record['hitstun'] ?? 0), $frameData->setHitstun(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getBlockstun(), (int) ($record['blockstun'] ?? 0), $frameData->setBlockstun(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getHitstop(), (int) ($record['hitstop'] ?? 0), $frameData->setHitstop(...)) || $changed;
        $changed = $this->setIfChanged($frameData->getExtraInformation(), $this->buildExtraInformation($record), $frameData->setExtraInformation(...)) || $changed;

        return $changed;
    }

    private function setIfChanged(mixed $currentValue, mixed $nextValue, callable $setter): bool
    {
        if ($currentValue === $nextValue) {
            return false;
        }

        $setter($nextValue);

        return true;
    }

    /**
     * @param array<string, mixed> $record
     */
    private function buildExtraInformation(array $record): string
    {
        $extraInfo = is_array($record['extraInfo'] ?? null) ? $record['extraInfo'] : [];
        $damageParts = $this->parseDamageParts($record['fullDmg'] ?? null);
        if ([] !== $damageParts) {
            $extraInfo[] = ['fatDamageParts' => $damageParts];
        }

        return json_encode($extraInfo) ?: '[]';
    }

    /**
     * @return list<int>
     */
    private function parseDamageParts(mixed $value): array
    {
        if (!is_string($value) || preg_match('/\(([^)]*)\)/', $value, $matches) !== 1) {
            return [];
        }

        preg_match_all('/\d+/', $matches[1], $partMatches);
        $parts = array_map('intval', $partMatches[0] ?? []);

        return count($parts) > 1 ? $parts : [];
    }

    private function parseDamageValue(mixed $value): int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_float($value)) {
            return (int) $value;
        }

        if (!is_string($value)) {
            return 0;
        }

        if (preg_match('/\d+/', trim($value), $matches) !== 1) {
            return 0;
        }

        return (int) $matches[0];
    }
}
