<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\Character;
use App\Entity\Move;
use App\Entity\FrameData;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Uid\Uuid;
use League\Csv\Reader;

#[AsCommand(
    name: 'frame-data:import:fat-csv',
    description: 'Import frame data for a character from a CSV file'
)]
class ImportFrameDataFromFatCsvCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure(): void
    {
        $this
            ->addArgument('character', InputArgument::REQUIRED, 'Character name')
            ->addArgument('file', InputArgument::REQUIRED, 'Path to CSV file');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $characterName = $input->getArgument('character');
        $filePath = $input->getArgument('file');

        if (!is_string($characterName) || !is_string($filePath)) {
            throw new \ValueError('Character name and file path should be strings');
        }

        // Find or create character
        $character = $this->entityManager->getRepository(Character::class)->findOneBy(['name' => $characterName]);

        if (!$character) {
            $character = new Character();
            $character->setName($characterName);
            $this->entityManager->persist($character);
            $output->writeln("<info>Created new character: $characterName</info>");
        }

        // Read CSV file
        $csv = Reader::createFromPath($filePath, 'r');
        $csv->setHeaderOffset(0); // First row as header

        foreach ($csv as $record) {
            $numCmd = $record['numCmd'] ?? null;
            if (!$numCmd) {
                $output->writeln("<error>Skipping row without numCmd</error>");
                continue;
            }

            // Find or create Move
            $move = $this->entityManager->getRepository(Move::class)->findOneBy([
                'numpadNotation' => $numCmd,
                'character' => $character
            ]);

            if (!$move) {
                $move = new Move();
                $move->setNumpadNotation($numCmd);
                $move->setCharacter($character);
                $this->entityManager->persist($move);
            }

            // Create FrameData
            $frameData = new FrameData();
            $frameData->setStartup((int)($record['startup'] ?? null));
            $frameData->setActive((int)($record['active'] ?? null));
            $frameData->setRecovery((int)($record['recovery'] ?? null));
            $frameData->setTotal((int)($record['total'] ?? null));
            $frameData->setOnHit((int)($record['onHit'] ?? null));
            $frameData->setOnBlock((int)($record['onBlock'] ?? null));
            $frameData->setOnPunishCounter((int)($record['onPC'] ?? null));
            $frameData->setMoveType($record['moveType'] ?? 'normal');
            $frameData->setCancelsTo($record['xx'] ?? null);
            $frameData->setDamage((int)($record['dmg'] ?? null));
            $frameData->setScaling((int)($record['dmgScaling'] ?? null));
            $frameData->setChipDamage((int)($record['chp'] ?? null));
            $frameData->setAttackLevel($record['atkLvl'] ?? 'Unknown');
            $frameData->setOnHitAfterDriveRush((int)($record['afterDRoH'] ?? null));
            $frameData->setOnBlockAfterDriveRush((int)($record['afterDRoB'] ?? null));
            $frameData->setOnPerfectParry((int)($record['onPP'] ?? null));
            $frameData->setDriveDamageOnHit((int)($record['DDoH'] ?? null));
            $frameData->setDriveDamageOnBlock((int)($record['DDoB'] ?? null));
            $frameData->setDriveGain((int)($record['DGain'] ?? null));
            $frameData->setOnHitSelfSuperMeterGain((int)($record['SelfSoH'] ?? null));
            $frameData->setOnBlockSelfSuperMeterGain((int)($record['SelfSoB'] ?? null));
            $frameData->setOnHitOpponentSuperMeterGain((int)($record['OppSoH'] ?? null));
            $frameData->setOnBlockOpponentSuperMeterGain((int)($record['OppSoB'] ?? null));
            $frameData->setHitConfirmSpecialsAndSupers((int)($record['hcWinSpCa'] ?? null));
            $frameData->setHitConfirmTargetCombos((int)($record['hcWinTc'] ?? null));
            $frameData->setJuggleLimit((int)($record['jugLimit'] ?? null));
            $frameData->setJuggleIncrease((int)($record['jugIncr'] ?? null));
            $frameData->setJuggleStart((int)($record['jugStart'] ?? null));
            $frameData->setHitstun((int)($record['hitstun'] ?? null));
            $frameData->setBlockstun((int)($record['blockstun'] ?? null));
            $frameData->setHitstop((int)($record['hitstop'] ?? null));
            $frameData->setExtraInformation($record['extraInfo'] ?? null);

            // Link FrameData to Move
            $move->setFrameData($frameData);
            $this->entityManager->persist($frameData);
            $output->writeln("<info>Added frame data for move: $numCmd</info>");
        }

        $this->entityManager->flush();
        $output->writeln("<info>Import completed successfully.</info>");

        return Command::SUCCESS;
    }
}
