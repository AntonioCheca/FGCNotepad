<?php

declare(strict_types=1);

namespace App\Tests\Serializer\Normalizer;

use App\Entity\ComboRequirement;
use App\Serializer\Normalizer\ComboRequirementNormalizer;
use App\Tests\DatabaseTestCase;
use App\Tests\TestEntityFactory;

class ComboRequirementNormalizerTest extends DatabaseTestCase
{
    private TestEntityFactory $factory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->assertNotNull($this->entityManager);
        $this->factory = new TestEntityFactory($this->entityManager);
    }

    public function testNormalizeWithoutSpecificCharacterRequirement(): void
    {
        $sequence = $this->factory->createComboSequence();

        $requirement = new ComboRequirement();
        $requirement->setSequence($sequence)
            ->setCounterHitRequired(true)
            ->setPunishCounterRequired(false)
            ->setCornerRequired(true)
            ->setAirborneRequired(false)
            ->setNotCrouchingRequired(true);

        $this->entityManager->persist($requirement);
        $this->entityManager->flush();

        $normalizer = new ComboRequirementNormalizer();
        $data = $normalizer->normalize($requirement);

        $this->assertTrue($data['counter_hit_required']);
        $this->assertFalse($data['punish_counter_required']);
        $this->assertTrue($data['corner_required']);
        $this->assertFalse($data['airborne_required']);
        $this->assertTrue($data['not_crouching_required']);
        $this->assertSame([], $data['combo_object_states']);
        $this->assertNull($data['requirement_specific_character']);
    }
}
