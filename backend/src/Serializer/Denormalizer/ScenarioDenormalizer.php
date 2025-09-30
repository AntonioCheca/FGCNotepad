<?php declare(strict_types=1);

namespace App\Serializer\Denormalizer;

use App\Entity\Scenario;
use App\Entity\ScenarioType;
use App\Entity\ScenarioLayer;
use App\Entity\ScenarioOption;
use App\Entity\ScenarioOptionPart;
use App\Entity\ScenarioOptionRelationships;
use App\Repository\ScenarioTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Serializer\Normalizer\DenormalizerInterface;

class ScenarioDenormalizer implements DenormalizerInterface
{
    public function __construct(
        private ScenarioTypeRepository $scenarioTypeRepository,
        private EntityManagerInterface $entityManager,
        private MoveDenormalizer       $moveDenormalizer,
    )
    {
    }

    public function denormalize(mixed $data, string $type, ?string $format = null, array $context = []): Scenario
    {
        $scenario = new Scenario();
        $scenario->setName($data['name'] ?? '');

        if (!empty($data['type'])) {
            $scenarioType = $this->scenarioTypeRepository->findOneBy(['name' => $data['type']]);
            if (!$scenarioType) {
                $scenarioType = new ScenarioType();
                $scenarioType->setName($data['type']);
                $this->entityManager->persist($scenarioType);
                $this->entityManager->flush();
            }
            $scenario->setType($scenarioType);
        }

        foreach ($data['layers'] ?? [] as $layerData) {
            $layer = new ScenarioLayer();
            $layer->setIndex($layerData['index'] ?? 0);
            $layer->setScenario($scenario);

            foreach ($layerData['firstPlayerOptions'] ?? [] as $optionData) {
                $layer->getFirstPlayerOptions()->add(
                    $this->denormalizeOption($optionData, $format, $context)
                );
            }

            foreach ($layerData['secondPlayerOptions'] ?? [] as $optionData) {
                $layer->getSecondPlayerOptions()->add(
                    $this->denormalizeOption($optionData, $format, $context)
                );
            }

            $scenario->getLayers()->add($layer);
        }

        return $scenario;
    }

    private function denormalizeOption(array $data, ?string $format, array $context): ScenarioOption
    {
        $option = new ScenarioOption();

        foreach ($data['parts'] ?? [] as $partData) {
            $part = new ScenarioOptionPart();
            $part->setFramesOfDuration($partData['framesOfDuration'] ?? 0);

            if (!empty($partData['move'])) {
                $part->setMove(
                    $this->moveDenormalizer->denormalize($partData['move'], \App\Entity\Move::class, $format, $context)
                );
            }

            $rel = new ScenarioOptionRelationships();
            $rel->setMove($part);
            $rel->setOption($option);
            $rel->setIndex($partData['index'] ?? 0);

            $option->getScenarioOptionRelationships()->add($rel);
        }

        return $option;
    }

    public function supportsDenormalization(mixed $data, string $type, ?string $format = null, array $context = []): bool
    {
        return $type === Scenario::class;
    }

    public function getSupportedTypes(?string $format): array
    {
        return [Scenario::class => true];
    }
}
