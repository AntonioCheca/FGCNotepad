<?php

declare(strict_types=1);

namespace App\Tests\Serializer\Normalizer;

use App\Entity\CharacterObjectState;
use App\Entity\ComboRequirement;
use App\Repository\CharacterObjectRepository;
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

        $normalizer = $this->createNormalizer();
        $data = $normalizer->normalize($requirement);

        $this->assertTrue($data['counter_hit_required']);
        $this->assertFalse($data['punish_counter_required']);
        $this->assertTrue($data['corner_required']);
        $this->assertFalse($data['airborne_required']);
        $this->assertTrue($data['not_crouching_required']);
        $this->assertSame([], $data['combo_object_states']);
        $this->assertNull($data['requirement_specific_character']);
    }

    public function testObjectStatesExposeTheCatalogKind(): void
    {
        $this->seedCharacterResources();
        $requirement = (new ComboRequirement())
            ->setSequence($this->factory->createComboSequence())
            ->setCounterHitRequired(false)
            ->setPunishCounterRequired(false)
            ->setCornerRequired(false)
            ->setAirborneRequired(false)
            ->setNotCrouchingRequired(false);
        $state = (new CharacterObjectState())->setObjectKey('jamie_drinks')->setObjectName('Drinks')->setStatusRequired('3');
        $unknown = (new CharacterObjectState())->setObjectKey('missing_object')->setObjectName('Missing');
        $requirement->addCharacterObjectState($state)->addCharacterObjectState($unknown);
        $this->entityManager->persist($state);
        $this->entityManager->persist($unknown);
        $this->entityManager->persist($requirement);
        $this->entityManager->flush();

        $data = $this->createNormalizer()->normalize($requirement);

        $this->assertSame(['scaler', null], array_column($data['combo_object_states'], 'kind'));
    }

    private function createNormalizer(): ComboRequirementNormalizer
    {
        $repository = $this->entityManager->getRepository(\App\Entity\CharacterObject::class);
        $this->assertInstanceOf(CharacterObjectRepository::class, $repository);

        return new ComboRequirementNormalizer($repository);
    }
}
