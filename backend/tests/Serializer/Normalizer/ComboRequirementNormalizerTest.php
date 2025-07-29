<?php

declare(strict_types=1);

namespace App\Tests\Serializer;

use App\Entity\ComboRequirements;
use App\Entity\Move;
use App\Serializer\ComboRequirementsNormalizer;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;

class ComboRequirementsNormalizerTest extends TestCase
{
    public function testNormalize(): void
    {
        $move = new Move();
        $move->setId(10); // assuming setter exists

        $requirements = new ComboRequirements();
        $requirements->setMinDistance(20);
        $requirements->setMaxDistance(40);
        $requirements->setStarter($move);

        $normalizer = new ComboRequirementsNormalizer();
        $serializer = new Serializer([
            new DateTimeNormalizer(),
            new ObjectNormalizer(),
            $normalizer,
        ], [new JsonEncoder()]);

        $data = $serializer->normalize($requirements);

        $this->assertIsArray($data);
        $this->assertSame(20, $data['min_distance']);
        $this->assertSame(40, $data['max_distance']);
        $this->assertSame(10, $data['starter_id']);
    }
}
