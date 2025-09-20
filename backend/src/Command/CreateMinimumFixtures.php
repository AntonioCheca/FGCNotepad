<?php declare(strict_types=1);

namespace App\Command;

use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\Season;
use App\Entity\Visibility;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:create-fixtures', description: 'Insert base ComboSequenceTypes, Visibilities, and Season')]
class CreateMinimumFixtures extends Command
{
    public function __construct(private EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $types = ['leaf', 'combo'];
        foreach ($types as $t) {
            $existing = $this->em->getRepository(ComboSequenceType::class)->findOneBy(['name' => $t]);
            if (!$existing) {
                $type = new ComboSequenceType();
                $type->setName($t);
                $this->em->persist($type);
                $output->writeln("Inserted ComboSequenceType: $t");
            }
        }

        $visibilities = ['public', 'private'];
        foreach ($visibilities as $v) {
            $existing = $this->em->getRepository(Visibility::class)->findOneBy(['name' => $v]);
            if (!$existing) {
                $vis = new Visibility();
                $vis->setName($v);
                $this->em->persist($vis);
                $output->writeln("Inserted Visibility: $v");
            }
        }

        $seasonRepo = $this->em->getRepository(Season::class);
        $existingSeason = $seasonRepo->findOneBy(['name' => 'current']);
        if (!$existingSeason) {
            $season = new Season();
            $season->setName('current');
            $season->setStartDate((new \DateTimeImmutable('yesterday')));
            $season->setEndDate(null);
            $this->em->persist($season);
            $output->writeln("Inserted Season: current");
        }

        $connectionRepo = $this->em->getRepository(ConnectionType::class);
        $existing = $connectionRepo->findAll();
        $existingNames = array_map(fn($c) => $c->getName(), $existing);
        $needed = ['Special', 'Chain', 'Link', 'Target Combo', 'Initial Move'];

        foreach ($needed as $name) {
            if (!in_array($name, $existingNames)) {
                $conn = new ConnectionType();
                $conn->setName($name);
                $this->em->persist($conn);
                $output->writeln("Added connection type: $name");
            }
        }

        $this->em->flush();

        $this->em->flush();

        return Command::SUCCESS;
    }
}
