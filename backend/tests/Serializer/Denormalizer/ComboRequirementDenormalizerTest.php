<?php

declare(strict_types=1);

namespace App\Tests\Serializer\Denormalizer;

use App\Entity\ComboRequirement;
use App\Entity\ComboSequences;
use App\Tests\DatabaseTestCase;
use App\Tests\TestEntityFactory;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\SerializerInterface;

class ComboRequirementDenormalizerTest extends DatabaseTestCase
{
    private Serializer $serializer;

    protected function setUp(): void
    {
        parent::setUp();

        $serializer = self::getContainer()->get(SerializerInterface::class);
        $this->assertInstanceOf(Serializer::class, $serializer);
        $this->serializer = $serializer;
    }

    public function testDenormalize(): void
    {
        $this->assertNotNull($this->entityManager);
        $factory = new TestEntityFactory($this->entityManager);
        $sequence = $factory->createComboSequence();
        $this->entityManager->flush();

        $sequenceId = $sequence->getId();

        $data = [
            'sequence' => $sequenceId,
            'counter_hit_required' => true,
            'corner_required' => false,
            'not_crouching_required' => true,
            'combo_object_states' => [[
                'object_key' => 'manon_medals',
                'character_name' => 'Manon',
                'object_name' => 'Medals',
                'status_required' => '5',
                'added_relative' => '1',
            ]]
        ];

        /** @var ComboRequirement $object */
        $object = $this->serializer->denormalize($data, ComboRequirement::class);

        $this->assertInstanceOf(ComboRequirement::class, $object);
        $this->assertTrue($object->isCounterHitRequired());
        $this->assertFalse($object->isCornerRequired());
        $this->assertTrue($object->isNotCrouchingRequired());
        $this->assertSame($sequence->getId(), $object->getSequence()?->getId());
        $specificCharacter = $object->getRequirementSpecificCharacter();
        $this->assertNotNull($specificCharacter);
        $this->assertSame('manon_medals', $specificCharacter->getObjectKey());
        $this->assertSame('Medals', $specificCharacter->getObjectName());
        $this->assertSame('5', $specificCharacter->getStatusRequired());
        $this->assertSame('1', $specificCharacter->getAddedRelative());

        $this->entityManager->remove($sequence);
        $this->entityManager->flush();
    }
}
