<?php

declare(strict_types=1);

namespace App\Tests\Serializer;

use App\Entity\ComboRequirement;
use App\Serializer\Normalizer\ComboRequirementNormalizer;
use App\Tests\TestEntityFactory;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Doctrine\ORM\EntityManagerInterface;

class ComboRequirementsNormalizerTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private TestEntityFactory $factory;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = self::getContainer()->get(EntityManagerInterface::class);
        $this->factory = new TestEntityFactory($this->em);
    }

    public function testNormalize(): void
    {
        $sequence = $this->factory->createComboSequence();

        $requirement = new ComboRequirement();
        $requirement->setSequence($sequence);
        $requirement->setCounterHitRequired(true);
        $requirement->setPunishCounterRequired(false);
        $requirement->setCornerRequired(true);
        $requirement->setAirborneRequired(false);
        $requirement->setMidScreenRequired(true);

        $this->em->persist($requirement);
        $this->em->flush();

        $objectNormalizer = new ObjectNormalizer();
        $normalizer = new ComboRequirementNormalizer($objectNormalizer);
        $serializer = new Serializer([
            new DateTimeNormalizer(),
            $objectNormalizer,
            $normalizer,
        ], [new JsonEncoder()]);

        $data = $serializer->normalize($requirement);

        $this->assertIsArray($data);
        $this->assertSame(true, $data['counterHitRequired']);
        $this->assertSame(false, $data['punishCounterRequired']);;
        $this->assertSame(true, $data['cornerRequired']);;
        $this->assertSame(false, $data['airborneRequired']);
        $this->assertSame(true, $data['midScreenRequired']);
        $this->assertNull($data['requirementSpecificCharacter']); // None assigned
    }
}
