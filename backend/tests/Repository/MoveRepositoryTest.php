<?php declare(strict_types=1);

namespace App\Tests\Repository;

use App\Entity\Character;
use App\Entity\Move;
use App\Repository\MoveRepository;
use App\Tests\DatabaseTestCase;

class MoveRepositoryTest extends DatabaseTestCase
{
    private MoveRepository $moveRepository;

    public function setUp(): void
    {
        parent::setUp();

        $this->moveRepository = static::getContainer()->get(MoveRepository::class);
        $this->addCharactersAndMoves();
    }

    private function addCharactersAndMoves(): void
    {
        $aki = new Character();
        $aki->setName('Aki');
        $this->entityManager->persist($aki);

        $cammy = new Character();
        $cammy->setName('Cammy');
        $this->entityManager->persist($cammy);

        $move1 = new Move();
        $move1->setCharacter($aki);
        $move1->setNumpadNotation('5HP');
        $this->entityManager->persist($move1);

        $move2 = new Move();
        $move2->setCharacter($aki);
        $move2->setNumpadNotation('5HK');
        $this->entityManager->persist($move2);

        $move3 = new Move();
        $move3->setCharacter($cammy);
        $move3->setNumpadNotation('5HP');
        $this->entityManager->persist($move3);

        $this->entityManager->flush();
    }

    public function testFindByQueryFindsByCharacterName(): void
    {
        $results = $this->moveRepository->queryForSpecificNumpadOrCharactersFromString('Aki');

        $this->assertCount(2, $results);
        $this->assertEquals('Aki', $results[0]->getCharacter()->getName());
        $this->assertEquals('Aki', $results[1]->getCharacter()->getName());
    }

    public function testFindByQueryFindsByNumpadNotation(): void
    {
        $results = $this->moveRepository->queryForSpecificNumpadOrCharactersFromString('5HP');

        $this->assertCount(2, $results); // Aki's 5HP and Cammy's 5HP
        $this->assertContains($results[0]->getNumpadNotation(), ['5HP']);
        $this->assertContains($results[1]->getNumpadNotation(), ['5HP']);
    }

    public function testFindByQueryFiltersByCharacterAndNotation(): void
    {
        $results = $this->moveRepository->queryForSpecificNumpadOrCharactersFromString('Aki 5HP');

        $this->assertCount(1, $results);
        $this->assertEquals('Aki', $results[0]->getCharacter()->getName());
        $this->assertEquals('5HP', $results[0]->getNumpadNotation());
    }

    public function testFindByQueryHandlesQuotedInputWithoutBroadeningResults(): void
    {
        $results = $this->moveRepository->queryForSpecificNumpadOrCharactersFromString("Aki ' OR 1=1");

        $this->assertSame([], $results);
    }

    public function testCrossCharacterResultsAreSortedByCharacterNameThenNotation(): void
    {
        $blanka = new Character();
        $blanka->setName('blanka');
        $this->entityManager->persist($blanka);

        foreach (['5HP', '2HP'] as $notation) {
            $move = new Move();
            $move->setCharacter($blanka);
            $move->setNumpadNotation($notation);
            $this->entityManager->persist($move);
        }
        $this->entityManager->flush();

        $results = $this->moveRepository->queryForSpecificNumpadOrCharactersFromString('HP');

        $this->assertSame(
            ['Aki 5HP', 'blanka 2HP', 'blanka 5HP', 'Cammy 5HP'],
            array_map(static fn (Move $move): string => $move->getCharacter()->getName() . ' ' . $move->getNumpadNotation(), $results),
        );
    }
}
