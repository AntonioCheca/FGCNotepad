<?php declare(strict_types=1);

namespace App\Tests\Serializer\Normalizer;

use App\Entity\Scenario;
use App\Entity\ScenarioType;
use App\Entity\ScenarioLayer;
use App\Entity\ScenarioOption;
use App\Entity\ScenarioOptionPart;
use App\Entity\ScenarioOptionRelationships;
use App\Entity\Move;
use App\Serializer\Normalizer\ScenarioNormalizer;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class ScenarioNormalizerTest extends TestCase
{
    public function testNormalizeBasicScenario(): void
    {
        $move = (new Move())->setNumpadNotation('5LP');

        $part = (new ScenarioOptionPart())
            ->setMove($move)
            ->setFramesOfDuration(3);

        $option = new ScenarioOption();
        $rel = (new ScenarioOptionRelationships())
            ->setOption($option)
            ->setMove($part)
            ->setIndex(0);
        $option->getScenarioOptionRelationships()->add($rel);

        $layer = (new ScenarioLayer())
            ->setIndex(0);
        $layer->getFirstPlayerOptions()->add($option);

        $scenario = (new Scenario())
            ->setName('Test Scenario')
            ->setType((new ScenarioType())->setName('Knockdown'));
        $scenario->getLayers()->add($layer);

        $normalizer = new ScenarioNormalizer();
        $normalizer->setNormalizer($this->createMock(NormalizerInterface::class));

        $data = $normalizer->normalize($scenario);

        $this->assertIsArray($data);
        $this->assertEquals('Test Scenario', $data['name']);
        $this->assertEquals('Knockdown', $data['type']);
        $this->assertCount(1, $data['layers']);
        $this->assertCount(1, $data['layers'][0]['firstPlayerOptions']);
    }
}
