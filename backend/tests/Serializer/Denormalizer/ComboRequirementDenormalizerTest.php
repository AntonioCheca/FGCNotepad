<?php

declare(strict_types=1);

namespace App\Tests\Serializer;

use App\Entity\ComboRequirements;
use App\Entity\Move;
use App\Serializer\ComboRequirementsDenormalizer;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Doctrine\ORM\EntityManagerInterface;

class ComboRequirementDenormalizerTest extends KernelTestCase
{
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
    }

    public function testDenormalize(): void
    {
        // Arrange: create and persist a Move
        $move = new Move();
        $this->em->persist($move);
        $this->em->flush();
        $moveId = $move->getId();

        // Build the serializer
        $denormalizer = new ComboRequirementsDenormalizer(
            $this->em->getRepository(Move::class)
        );

        $serializer = new Serializer([
            new DateTimeNormalizer(),
            new ObjectNormalizer(),
            $denormalizer,
        ], [new JsonEncoder()]);

        $data = [
            'min_distance' => 20,
            'max_distance' => 40,
            'starter_id' => $moveId,
        ];

        // Act
        /** @var ComboRequirements $object */
        $object = $serializer->denormalize($data, ComboRequirements::class);

        // Assert
        $this->assertInstanceOf(ComboRequirements::class, $object);
        $this->assertSame(20, $object->getMinDistance());
        $this->assertSame(40, $object->getMaxDistance());
        $this->assertSame($move->getId(), $object->getStarter()?->getId());

        // Cleanup
        $this->em->remove($move);
        $this->em->flush();
    }
}
