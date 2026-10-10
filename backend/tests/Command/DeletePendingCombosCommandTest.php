<?php declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\DeletePendingCombosCommand;
use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\ComboSequenceType;
use App\Entity\ConnectionType;
use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\Step;
use App\Entity\User;
use App\Entity\UserCombo;
use App\Entity\Visibility;
use App\Service\ComboSequenceCreationService;
use App\Tests\DatabaseTestCase;
use App\Util\Enum\ModerationState;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;

final class DeletePendingCombosCommandTest extends DatabaseTestCase
{
    private CommandTester $tester;
    private Character $character;
    private ComboSequences $leaf;
    private ConnectionType $connection;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tester = new CommandTester(static::getContainer()->get(DeletePendingCombosCommand::class));
        $this->seed();
    }

    public function testDryRunListsPendingCombosWithoutDeletingThem(): void
    {
        $pending = $this->createCombo('pending one', ModerationState::PENDING_REVIEW);
        $this->createCombo('approved one', ModerationState::APPROVED);

        $this->tester->execute(['--dry-run' => true]);

        $this->tester->assertCommandIsSuccessful();
        self::assertStringContainsString('pending: 1', $this->tester->getDisplay());
        self::assertStringContainsString(sprintf('#%d pending one', $pending), $this->tester->getDisplay());
        self::assertStringContainsString('deleted: 0', $this->tester->getDisplay());
        self::assertSame(2, $this->comboCount());
    }

    public function testRefusesToDeleteWithoutForce(): void
    {
        $this->createCombo('pending one', ModerationState::PENDING_REVIEW);

        self::assertSame(Command::INVALID, $this->tester->execute([]));
        self::assertSame(1, $this->comboCount());
    }

    public function testForceDeletesOnlyPendingCombosIncludingKnownMarks(): void
    {
        $pending = $this->createCombo('pending one', ModerationState::PENDING_REVIEW);
        $this->createCombo('pending two', ModerationState::PENDING_REVIEW);
        $approved = $this->createCombo('approved one', ModerationState::APPROVED);
        $rejected = $this->createCombo('rejected one', ModerationState::REJECTED);
        $this->markKnown($pending);
        $this->markKnown($approved);

        $this->tester->execute(['--force' => true]);

        $this->tester->assertCommandIsSuccessful();
        self::assertStringContainsString('deleted: 2', $this->tester->getDisplay());
        $remaining = array_map(static fn (ComboSequences $combo): int => (int) $combo->getId(), $this->combos());
        self::assertEqualsCanonicalizing([$approved, $rejected], $remaining);
        self::assertSame(1, $this->entityManager->getRepository(UserCombo::class)->count([]));
        self::assertSame(2, $this->entityManager->getRepository(Step::class)->count([]));
    }

    private function seed(): void
    {
        $this->character = (new Character())->setName('Ryu');
        $this->connection = (new ConnectionType())->setName('Link');
        $this->user = (new User())->setUsername('author')->setPassword(self::hashTestPassword())->setIsActive(true);
        $leafType = (new ComboSequenceType())->setName('leaf');
        $comboType = (new ComboSequenceType())->setName('combo');
        $visibility = (new Visibility())->setName('public');
        $frameData = (new FrameData())->setMoveType('normal');
        $move = (new Move())->setCharacter($this->character)->setNumpadNotation('2LP')->setFrameData($frameData);
        $this->leaf = (new ComboSequences())->setName('Ryu 2LP')->setDescription('leaf')->setMove($move)->setType($leafType)->setVisibility($visibility);

        foreach ([$this->character, $this->connection, $this->user, $leafType, $comboType, $visibility, $frameData, $move, $this->leaf] as $entity) {
            $this->entityManager->persist($entity);
        }
        $this->entityManager->flush();
    }

    private function createCombo(string $name, ModerationState $state): int
    {
        $combo = static::getContainer()->get(ComboSequenceCreationService::class)->createFromPayload(
            ['name' => $name, 'metrics' => ['damage' => 300], 'requirements' => ['counter_hit_required' => true]],
            'combo',
            [['child_sequence_id' => $this->leaf->getId(), 'ordinal_in_combo' => 1, 'connection_type_id' => $this->connection->getId()]],
            $this->user,
        );
        $combo->setModerationState($state->value);
        $this->entityManager->flush();

        return (int) $combo->getId();
    }

    private function markKnown(int $comboId): void
    {
        $this->entityManager->persist((new UserCombo())
            ->setUser($this->user)
            ->setCharacter($this->character)
            ->setCombo($this->entityManager->getReference(ComboSequences::class, $comboId))
            ->setKnown(true));
        $this->entityManager->flush();
    }

    /** @return list<ComboSequences> */
    private function combos(): array
    {
        $this->entityManager->clear();

        return array_values(array_filter(
            $this->entityManager->getRepository(ComboSequences::class)->findAll(),
            static fn (ComboSequences $combo): bool => 'combo' === $combo->getType()?->getName(),
        ));
    }

    private function comboCount(): int
    {
        return count($this->combos());
    }
}
