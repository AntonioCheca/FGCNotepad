<?php

declare(strict_types=1);

namespace App\Tests\Serializer\Normalizer;

use App\Entity\ComboRequirement;
use App\Serializer\Normalizer\ComboRequirementNormalizer;
use App\Tests\TestEntityFactory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class ComboRequirementNormalizerTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private TestEntityFactory $factory;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
        $this->factory = new TestEntityFactory($this->em);
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
            ->setMidScreenRequired(true)
            ->setNotCrouchingRequired(true);

        $this->em->persist($requirement);
        $this->em->flush();

        $normalizer = new ComboRequirementNormalizer();
        $data = $normalizer->normalize($requirement);

        $this->assertTrue($data['counter_hit_required']);
        $this->assertFalse($data['punish_counter_required']);
        $this->assertTrue($data['corner_required']);
        $this->assertFalse($data['airborne_required']);
        $this->assertTrue($data['mid_screen_required']);
        $this->assertTrue($data['not_crouching_required']);
        $this->assertNull($data['requirement_specific_character']);
    }
}
