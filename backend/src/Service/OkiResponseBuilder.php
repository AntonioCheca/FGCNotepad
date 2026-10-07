<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Move;
use App\Entity\OkiNode;
use App\Entity\OkiProfile;
use App\Entity\OkiSetup;
use App\Entity\User;

final class OkiResponseBuilder
{
    public function __construct(private readonly OkiSetupAccessService $accessService)
    {
    }

    /** @return list<OkiSetup> */
    public function visibleSetups(OkiProfile $profile, ?User $viewer): array
    {
        return array_values(array_filter(
            $profile->getSetups()->toArray(),
            fn (OkiSetup $setup): bool => $this->accessService->canView($setup, $viewer),
        ));
    }

    /** @param list<OkiProfile> $profiles */
    public function buildList(array $profiles, ?User $viewer): array
    {
        return array_map(fn (OkiProfile $profile): array => $this->buildSummary($profile, $viewer), $profiles);
    }

    public function buildSummary(OkiProfile $profile, ?User $viewer): array
    {
        return [
            'id' => $profile->getId(),
            'move' => $this->buildMove($profile->getMove()),
            'setupCount' => count($this->visibleSetups($profile, $viewer)),
        ];
    }

    public function buildDetail(OkiProfile $profile, ?User $viewer): array
    {
        $payload = $this->buildSummary($profile, $viewer);
        $payload['setups'] = array_map(fn (OkiSetup $setup): array => $this->buildSetup($setup, $viewer), $this->visibleSetups($profile, $viewer));

        return $payload;
    }

    private function buildSetup(OkiSetup $setup, ?User $viewer): array
    {
        $canEdit = $this->accessService->canEdit($setup, $viewer);

        return [
            'id' => $setup->getId(),
            'moderationState' => $setup->getModerationState(),
            'moderationReason' => $canEdit ? $setup->getModerationReason() : null,
            'author' => $setup->getAuthor()?->getUsername(),
            'canEdit' => $canEdit,
            'name' => $setup->getName(),
            'cornerOnly' => $setup->isCornerOnly(),
            'backrollDependent' => $setup->isBackrollDependent(),
            'nodes' => array_map(fn (OkiNode $node): array => $this->buildNode($node), $setup->getNodes()->toArray()),
            'links' => $this->buildLinks($setup),
        ];
    }

    private function buildNode(OkiNode $node): array
    {
        return [
            'id' => $node->getId(),
            'move' => null === $node->getMove() ? null : $this->buildMove($node->getMove()),
            'action' => $node->getAction(),
            'sortOrder' => $node->getSortOrder(),
            'hitLevel' => $node->getHitLevel(),
            'sideSwitch' => $node->isSideSwitch(),
        ];
    }

    /**
     * Same shape as a /api/moves/search result, so the ender picker can use either source.
     *
     * @param list<Move> $moves
     */
    public function buildEnderOptions(array $moves): array
    {
        return array_map(fn (Move $move): array => $this->buildMove($move) + [
            'summary' => $move->getCharacter()->getName() . ' ' . $move->getNumpadNotation(),
            'attackLevel' => $move->getFrameData()?->getAttackLevel(),
        ], $moves);
    }

    private function buildMove(Move $move): array
    {
        return [
            'id' => (string) $move->getId(),
            'numpadNotation' => $move->getNumpadNotation(),
            'name' => $move->getName(),
            'commonName' => $move->getCommonName(),
            'moveName' => $move->getFrameData()?->getMoveName(),
            'moveType' => $move->getFrameData()?->getMoveType(),
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
            foreach ($node->getIncomingLinks() as $link) {
                $links[] = [
                    'id' => $link->getId(),
                    'fromNodeId' => $link->getFromNode()?->getId(),
                    'toNodeId' => $node->getId(),
                    'stepType' => $link->getStepType(),
                    'kind' => $link->getKind(),
                    'readLabel' => $link->getReadLabel(),
                    'safeJump' => $link->isSafeJump(),
                    'recovery' => $link->getRecovery(),
                ];
            }
        }

        usort($links, static fn (array $left, array $right): int => ($left['id'] ?? 0) <=> ($right['id'] ?? 0));

        return $links;
    }
}
