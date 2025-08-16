<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\ComboMetrics;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\Move;
use App\Entity\Season;
use App\Entity\Visibility;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Query;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:generate-leafs', description: 'Generate ComboSequences (leafs) from moves')]
class GenerateLeafComboSequencesFromMoves extends Command
{
    private const BATCH_SIZE = 50;

    public function __construct(private EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $leafType = $this->em->getRepository(ComboSequenceType::class)->findOneBy(['name' => 'leaf']);
        $publicVis = $this->em->getRepository(Visibility::class)->findOneBy(['name' => 'public']);
        $season = $this->em->getRepository(Season::class)->findOneBy(['name' => 'current']);

        if (!$leafType || !$publicVis || !$season) {
            $output->writeln("<error>Please run app:seed-basics first.</error>");
            return Command::FAILURE;
        }

        // Save IDs so we can re-attach lightweight references
        $leafTypeId = $leafType->getId();
        $publicVisId = $publicVis->getId();
        $seasonId = $season->getId();

        $qb = $this->em->createQueryBuilder()
            ->select('m')
            ->from(Move::class, 'm')
            ->leftJoin('m.comboSequence', 'cs')
            ->where('cs IS NULL');

        $iterableResult = $qb->getQuery()->toIterable([], Query::HYDRATE_OBJECT);

        $count = 0;

        foreach ($iterableResult as $move) {
            // Always get fresh lightweight references after clear()
            $leafType = $this->em->getReference(ComboSequenceType::class, $leafTypeId);
            $publicVis = $this->em->getReference(Visibility::class, $publicVisId);
            $season = $this->em->getReference(Season::class, $seasonId);

            $cs = new ComboSequences();
            $cs->setName($move->getName());
            $cs->setDescription("Leaf move: " . $move->getName());
            $cs->setMove($move);
            $cs->setType($leafType);
            $cs->setVisibility($publicVis);
            $cs->addSeason($season);

            $metrics = new ComboMetrics();
            $damage = $move->getFrameData()?->getDamage() ?? 0;
            $metrics->setDamage($damage);
            $metrics->setSequence($cs);
            $cs->setComboMetrics($metrics);

            $this->em->persist($cs);
            $this->em->persist($metrics);

            $output->writeln("Prepared leaf for move: {$move->getName()} (damage: $damage)");

            $count++;

            if (($count % self::BATCH_SIZE) === 0) {
                $this->flushAndClear($output, $count);
            }
        }

        if ($count % self::BATCH_SIZE !== 0) {
            $this->flushAndClear($output, $count, true);
        }

        $output->writeln("<info>Leaf generation complete. Total processed: $count</info>");

        return Command::SUCCESS;
    }

    private function flushAndClear(OutputInterface $output, int $count, bool $final = false): void
    {
        $this->em->flush();
        $this->em->clear();

        $type = $final ? "Final batch" : "Batch";
        $output->writeln("<comment>{$type} flushed at {$count} records.</comment>");
    }
}
