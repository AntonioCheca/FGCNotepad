<?php

declare(strict_types=1);

namespace App\Tests\Serializer\Denormalizer;

use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Tests\TestEntityFactory;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\SerializerInterface;
use Doctrine\ORM\EntityManagerInterface;

class ComboRequirementDenormalizerTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private Serializer $serializer;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
        $serializer = self::getContainer()->get(SerializerInterface::class);
        $this->assertInstanceOf(Serializer::class, $serializer);
        $this->serializer = $serializer;
    }

    public function testDenormalize(): void
    {
        // Arrange: create and persist a ComboSequence
        $factory = new TestEntityFactory($this->em);
        $sequence = $factory->createComboSequence();
        $this->em->flush();

        $sequenceId = $sequence->getId();

        $data = [
            'sequence' => $sequenceId,
            'counter_hit_required' => true,
            'corner_required' => false,
            'not_crouching_required' => true,
            'requirement_specific_character' => [
                'object_name' => 'Medals',
                'status_required' => '5'
            ]
        ];

        // Act - Use Symfony's configured serializer
        /** @var ComboRequirement $object */
        $object = $this->serializer->denormalize($data, ComboRequirement::class);

        // Assert
        $this->assertInstanceOf(ComboRequirement::class, $object);
        $this->assertTrue($object->isCounterHitRequired());
        $this->assertFalse($object->isCornerRequired());
        $this->assertTrue($object->isNotCrouchingRequired());
        $this->assertSame($sequence->getId(), $object->getSequence()?->getId());
        $this->assertSame('Medals', $object->getRequirementSpecificCharacter()?->getObjectName());
        $this->assertSame('5', $object->getRequirementSpecificCharacter()?->getStatusRequired());

        // Cleanup
        $this->em->remove($sequence);
        $this->em->flush();
    }
}
