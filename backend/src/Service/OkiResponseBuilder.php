<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\CharacterReversal;
use App\Entity\Move;
use App\Entity\OkiNode;
use App\Entity\OkiProfile;
use App\Entity\OkiSetup;

final class OkiResponseBuilder
{
    /** @param list<OkiProfile> $profiles */
    public function buildList(array $profiles): array
    {
        return array_map(fn (OkiProfile $profile): array => $this->buildSummary($profile), $profiles);
    }

    public function buildSummary(OkiProfile $profile): array
    {
        $setups = $profile->getSetups()->toArray();
        $finalNodes = $this->collectFinalNodes($setups);
        $properties = [];
        $optionTypes = [];
        foreach ($finalNodes as $node) {
            if (null !== $node->getOptionType()) {
                $optionTypes[$node->getOptionType()] = true;
            }
            foreach ($node->getProperties() as $property) {
                $properties[$property->getProperty()] = true;
            }
        }

        return [
            'id' => $profile->getId(),
            'move' => $this->buildMove($profile->getMove()),
            'frameAdvantage' => $profile->getFrameAdvantage(),
            'setupCount' => count($setups),
            'summary' => [
                'meterless' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => !$setup->usesDriveRush()),
                'driveRush' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => $setup->usesDriveRush()),
                'autoTimed' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => $setup->isAutoTimed()),
                'manual' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => !$setup->isAutoTimed()),
                'cornerOnly' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => $setup->isCornerOnly()),
                'worksNoBackroll' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => $setup->worksNoBackroll()),
                'worksBackroll' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => $setup->worksBackroll()),
                'hasFakeSetups' => $this->hasSetup($setups, static fn (OkiSetup $setup): bool => $setup->isFakeNoBackroll() || $setup->isFakeBackroll()),
                'optionTypes' => array_keys($optionTypes),
                'properties' => array_keys($properties),
            ],
        ];
    }

    public function buildDetail(OkiProfile $profile): array
    {
        $payload = $this->buildSummary($profile);
        $payload['setups'] = array_map(fn (OkiSetup $setup): array => $this->buildSetup($setup), $profile->getSetups()->toArray());

        return $payload;
    }

    /** @param list<CharacterReversal> $reversals */
    public function buildReversalList(array $reversals): array
    {
        return array_map(fn (CharacterReversal $reversal): array => $this->buildReversal($reversal), $reversals);
    }

    public function buildReversal(CharacterReversal $reversal): array
    {
        return [
            'id' => $reversal->getId(),
            'character' => [
                'id' => (string) $reversal->getCharacter()->getId(),
                'name' => $reversal->getCharacter()->getName(),
            ],
            'move' => $this->buildMove($reversal->getMove()),
            'startup' => $reversal->getStartup(),
            'reversalType' => $reversal->getReversalType(),
            'properties' => array_values(array_map(static fn ($property): string => $property->getProperty(), $reversal->getProperties()->toArray())),
        ];
    }

    private function buildSetup(OkiSetup $setup): array
    {
        return [
            'id' => $setup->getId(),
            'usesDriveRush' => $setup->usesDriveRush(),
            'autoTimed' => $setup->isAutoTimed(),
            'cornerOnly' => $setup->isCornerOnly(),
            'worksNoBackroll' => $setup->worksNoBackroll(),
            'worksBackroll' => $setup->worksBackroll(),
            'fakeNoBackroll' => $setup->isFakeNoBackroll(),
            'fakeBackroll' => $setup->isFakeBackroll(),
            'nodes' => array_map(fn (OkiNode $node): array => $this->buildNode($node), $setup->getNodes()->toArray()),
            'links' => $this->buildLinks($setup),
        ];
    }

    private function buildNode(OkiNode $node): array
    {
        return [
            'id' => $node->getId(),
            'move' => $this->buildMove($node->getMove()),
            'sortOrder' => $node->getSortOrder(),
            'isDefaultRoute' => $node->isDefaultRoute(),
            'routeExplanation' => $node->getRouteExplanation(),
            'optionType' => $node->getOptionType(),
            'properties' => array_values(array_map(static fn ($property): string => $property->getProperty(), $node->getProperties()->toArray())),
            'interactions' => array_values(array_map(fn ($interaction): array => [
                'id' => $interaction->getId(),
                'defensiveMove' => $this->buildMove($interaction->getDefensiveMove()),
                'result' => $interaction->getResult(),
                'character' => null === $interaction->getCharacter() ? null : [
                    'id' => (string) $interaction->getCharacter()->getId(),
                    'name' => $interaction->getCharacter()->getName(),
                ],
            ], $node->getInteractions()->toArray())),
        ];
    }

    private function buildMove(Move $move): array
    {
        return [
            'id' => (string) $move->getId(),
            'numpadNotation' => $move->getNumpadNotation(),
            'name' => $move->getName(),
            'character' => [
                'id' => (string) $move->getCharacter()->getId(),
                'name' => $move->getCharacter()->getName(),
            ],
        ];
    }

    private function buildLinks(OkiSetup $setup): array
    {
        $links = [];
        foreach ($setup->getNodes() as $node) {
            foreach ($node->getOutgoingLinks() as $link) {
                $links[] = [
                    'id' => $link->getId(),
                    'fromNodeId' => $link->getFromNode()->getId(),
                    'toNodeId' => $link->getToNode()->getId(),
                    'stepType' => $link->getStepType(),
                    'minFrames' => $link->getMinFrames(),
                    'maxFrames' => $link->getMaxFrames(),
                ];
            }
        }

        usort($links, static fn (array $left, array $right): int => ($left['id'] ?? 0) <=> ($right['id'] ?? 0));

        return $links;
    }

    /** @param list<OkiSetup> $setups */
    private function collectFinalNodes(array $setups): array
    {
        $nodes = [];
        foreach ($setups as $setup) {
            foreach ($setup->getNodes() as $node) {
                if (null !== $node->getOptionType()) {
                    $nodes[] = $node;
                }
            }
        }

        return $nodes;
    }

    /** @param list<OkiSetup> $setups */
    private function hasSetup(array $setups, callable $predicate): bool
    {
        foreach ($setups as $setup) {
            if ($predicate($setup)) {
                return true;
            }
        }

        return false;
    }
}
