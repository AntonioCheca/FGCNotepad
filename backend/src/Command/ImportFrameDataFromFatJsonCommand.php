<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Character;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
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

                $frameData = new FrameData();
                $frameData->setStartup((int)($record['startup'] ?? 0));
                $frameData->setActive((int)($record['active'] ?? 0));
                $frameData->setRecovery((int)($record['recovery'] ?? 0));
                $frameData->setTotal((int)($record['total'] ?? 0));
                $frameData->setOnHit((int)($record['onHit'] ?? 0));
                $frameData->setOnBlock((int)($record['onBlock'] ?? 0));
                $frameData->setOnPunishCounter((int)($record['onPC'] ?? 0));
                $frameData->setMoveType($record['moveType'] ?? 'normal');
                $frameData->setCancelsTo(json_encode($record['xx'] ?? []));
                $frameData->setDamage((int)($record['dmg'] ?? 0));
                $rawScaling = isset($record['dmgScaling']) && is_string($record['dmgScaling']) ? $record['dmgScaling'] : null;
                $frameData->setScaling($rawScaling);
                $scaling = $this->scalingNormalizer->normalize($rawScaling);
                $frameData->setScalingStartPercent($scaling->startPercent);
                $frameData->setScalingImmediatePercent($scaling->immediatePercent);
                $frameData->setScalingMinimumPercent($scaling->minimumPercent);
                $frameData->setScalingComboHits($scaling->comboHits);
                $frameData->setScalingComboExtraPercent($scaling->comboExtraPercent);
                $frameData->setScalingMultiplierPercent($scaling->multiplierPercent);
                $frameData->setScalingParseStatus($scaling->parseStatus);
                $frameData->setScalingParseNote($scaling->parseNote);
                $frameData->setChipDamage((int)($record['chp'] ?? 0));
                $frameData->setAttackLevel($record['atkLvl'] ?? 'Unknown');
                $frameData->setOnHitAfterDriveRush((int)($record['DRoH'] ?? 0));
                $frameData->setOnBlockAfterDriveRush((int)($record['DRoB'] ?? 0));
                $frameData->setOnPerfectParry((int)($record['onPP'] ?? 0));
                $frameData->setDriveDamageOnHit((int)($record['DDoH'] ?? 0));
                $frameData->setDriveDamageOnBlock((int)($record['DDoB'] ?? 0));
                $frameData->setDriveGain((int)($record['DGain'] ?? 0));
                $frameData->setOnHitSelfSuperMeterGain((int)($record['SelfSoH'] ?? 0));
                $frameData->setOnBlockSelfSuperMeterGain((int)($record['SelfSoB'] ?? 0));
                $frameData->setOnHitOpponentSuperMeterGain((int)($record['OppSoH'] ?? 0));
                $frameData->setOnBlockOpponentSuperMeterGain((int)($record['OppSoB'] ?? 0));
                $frameData->setHitConfirmSpecialsAndSupers((int)($record['hcWinSpCa'] ?? 0));
                $frameData->setHitConfirmTargetCombos((int)($record['hcWinTc'] ?? 0));
                $frameData->setJuggleLimit((int)($record['jugLimit'] ?? 0));
                $frameData->setJuggleIncrease((int)($record['jugIncr'] ?? 0));
                $frameData->setJuggleStart((int)($record['jugStart'] ?? 0));
                $frameData->setHitstun((int)($record['hitstun'] ?? 0));
                $frameData->setBlockstun((int)($record['blockstun'] ?? 0));
                $frameData->setHitstop((int)($record['hitstop'] ?? 0));
                $frameData->setExtraInformation(json_encode($record['extraInfo'] ?? []));

                foreach ($scaling->warnings as $warning) {
                    $scalingWarnings[] = [
                        'character' => $characterName,
                        'move' => $moveName,
                        'message' => $warning,
                    ];
                    $output->writeln(sprintf('<comment>Scaling parse warning [%s - %s]: %s</comment>', $characterName, $moveName, $warning));
                }

                $move->setFrameData($frameData);
                $this->entityManager->persist($frameData);
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
        return Command::SUCCESS;
    }
}
