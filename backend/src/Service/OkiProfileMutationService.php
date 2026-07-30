<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Character;
use App\Entity\CharacterReversal;
use App\Entity\Move;
use App\Entity\OkiNode;
use App\Entity\OkiNodeLink;
use App\Entity\OkiNodeProperty;
use App\Entity\OkiOptionInteraction;
use App\Entity\OkiProfile;
use App\Entity\OkiSetup;
use App\Entity\ReversalProperty;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use App\Util\Enum\OkiInteractionResult;
use App\Util\Enum\OkiNodePropertyType;
use App\Util\Enum\OkiOptionType;
use App\Util\Enum\OkiStepType;
use App\Util\Enum\ReversalPropertyType;
use App\Util\Enum\ReversalType;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class OkiProfileMutationService
{
    public function __construct(
        private readonly MoveRepository $moveRepository,
        private readonly CharacterRepository $characterRepository,
    ) {
    }

    /** @param array<string, mixed> $payload */
    public function hydrateProfile(OkiProfile $profile, array $payload): void
    {
        $move = $this->requireMove($payload['moveId'] ?? null, 'moveId');
        $profile->setMove($move);
        $profile->setFrameAdvantage($move->getFrameData()?->getOnHit());
        $profile->clearSetups();

        $setups = $payload['setups'] ?? [];
        if (!is_array($setups)) {
            throw new BadRequestHttpException('setups must be an array.');
        }

        foreach ($setups as $setupPayload) {
            if (!is_array($setupPayload)) {
                throw new BadRequestHttpException('Each setup must be an object.');
            }

            $profile->addSetup($this->buildSetup($setupPayload));
        }
    }

    /** @param array<string, mixed> $payload */
    public function hydrateReversal(CharacterReversal $reversal, array $payload): void
    {
        $character = $this->requireCharacter($payload['characterId'] ?? null, 'characterId');
        $move = $this->requireMove($payload['moveId'] ?? null, 'moveId');
        if ((string) $move->getCharacter()->getId() !== (string) $character->getId()) {
            throw new BadRequestHttpException('moveId must belong to characterId.');
        }

        $type = $this->requireString($payload['reversalType'] ?? null, 'reversalType');
        if (!ReversalType::isValid($type)) {
            throw new BadRequestHttpException('Invalid reversalType.');
        }

        $reversal
            ->setCharacter($character)
            ->setMove($move)
            ->setStartup($this->requireInt($payload['startup'] ?? null, 'startup'))
            ->setReversalType($type);

        foreach ($reversal->getProperties()->toArray() as $property) {
            $reversal->getProperties()->removeElement($property);
        }

        $properties = $payload['properties'] ?? [];
        if (!is_array($properties)) {
            throw new BadRequestHttpException('properties must be an array.');
        }

        foreach ($properties as $propertyValue) {
            $property = $this->requireString($propertyValue, 'property');
            if (!ReversalPropertyType::isValid($property)) {
                throw new BadRequestHttpException('Invalid reversal property.');
            }

            $reversal->addProperty((new ReversalProperty())->setProperty($property));
        }
    }

    /** @param array<string, mixed> $payload */
    private function buildSetup(array $payload): OkiSetup
    {
        $setup = (new OkiSetup())
            ->setUsesDriveRush($this->bool($payload['usesDriveRush'] ?? false))
            ->setAutoTimed($this->bool($payload['autoTimed'] ?? false))
            ->setCornerOnly($this->bool($payload['cornerOnly'] ?? false))
            ->setWorksNoBackroll($this->bool($payload['worksNoBackroll'] ?? true))
            ->setWorksBackroll($this->bool($payload['worksBackroll'] ?? true))
            ->setFakeNoBackroll($this->bool($payload['fakeNoBackroll'] ?? false))
            ->setFakeBackroll($this->bool($payload['fakeBackroll'] ?? false));

        $clientNodeMap = [];
        $nodes = $payload['nodes'] ?? [];
        if (!is_array($nodes)) {
            throw new BadRequestHttpException('nodes must be an array.');
        }

        foreach ($nodes as $index => $nodePayload) {
            if (!is_array($nodePayload)) {
                throw new BadRequestHttpException('Each node must be an object.');
            }

            $node = $this->buildNode($nodePayload, $index);
            $setup->addNode($node);
            $clientId = $this->requireString($nodePayload['clientId'] ?? null, 'node.clientId');
            $clientNodeMap[$clientId] = $node;
        }

        $links = $payload['links'] ?? [];
        if (!is_array($links)) {
            throw new BadRequestHttpException('links must be an array.');
        }

        foreach ($links as $linkPayload) {
            if (!is_array($linkPayload)) {
                throw new BadRequestHttpException('Each link must be an object.');
            }

            $fromId = $this->requireString($linkPayload['fromClientId'] ?? null, 'link.fromClientId');
            $toId = $this->requireString($linkPayload['toClientId'] ?? null, 'link.toClientId');
            if (!isset($clientNodeMap[$fromId], $clientNodeMap[$toId])) {
                throw new BadRequestHttpException('Each link must reference existing node client IDs.');
            }

            $link = $this->buildLink($linkPayload, $clientNodeMap[$toId]);
            $clientNodeMap[$fromId]->addOutgoingLink($link);
        }

        return $setup;
    }

    /** @param array<string, mixed> $payload */
    private function buildNode(array $payload, int $index): OkiNode
    {
        $optionType = null;
        if (array_key_exists('optionType', $payload) && null !== $payload['optionType'] && '' !== $payload['optionType']) {
            $optionType = $this->requireString($payload['optionType'], 'optionType');
            if (!OkiOptionType::isValid($optionType)) {
                throw new BadRequestHttpException('Invalid optionType.');
            }
        }

        $node = (new OkiNode())
            ->setMove($this->requireMove($payload['moveId'] ?? null, 'node.moveId'))
            ->setSortOrder($this->intOrDefault($payload['sortOrder'] ?? null, $index))
            ->setDefaultRoute($this->bool($payload['isDefaultRoute'] ?? false))
            ->setRouteExplanation($this->nullableString($payload['routeExplanation'] ?? null))
            ->setOptionType($optionType);

        $properties = $payload['properties'] ?? [];
        if (!is_array($properties)) {
            throw new BadRequestHttpException('node.properties must be an array.');
        }

        foreach ($properties as $propertyValue) {
            $property = $this->requireString($propertyValue, 'property');
            if (!OkiNodePropertyType::isValid($property)) {
                throw new BadRequestHttpException('Invalid oki node property.');
            }
            $node->addProperty((new OkiNodeProperty())->setProperty($property));
        }

        $interactions = $payload['interactions'] ?? [];
        if (!is_array($interactions)) {
            throw new BadRequestHttpException('node.interactions must be an array.');
        }

        foreach ($interactions as $interactionPayload) {
            if (!is_array($interactionPayload)) {
                throw new BadRequestHttpException('Each interaction must be an object.');
            }
            $node->addInteraction($this->buildInteraction($interactionPayload));
        }

        return $node;
    }

    /** @param array<string, mixed> $payload */
    private function buildLink(array $payload, OkiNode $toNode): OkiNodeLink
    {
        $stepType = $this->requireString($payload['stepType'] ?? 'IMMEDIATE', 'stepType');
        if (!OkiStepType::isValid($stepType)) {
            throw new BadRequestHttpException('Invalid stepType.');
        }

        $minFrames = $this->nullableInt($payload['minFrames'] ?? null, 'minFrames');
        $maxFrames = $this->nullableInt($payload['maxFrames'] ?? null, 'maxFrames');
        if ('IMMEDIATE' === $stepType) {
            $minFrames = null;
            $maxFrames = null;
        } elseif (null === $minFrames || null === $maxFrames || $minFrames < 0 || $maxFrames < $minFrames) {
            throw new BadRequestHttpException('Timed links require a valid minFrames/maxFrames window.');
        }

        return (new OkiNodeLink())
            ->setToNode($toNode)
            ->setStepType($stepType)
            ->setMinFrames($minFrames)
            ->setMaxFrames($maxFrames);
    }

    /** @param array<string, mixed> $payload */
    private function buildInteraction(array $payload): OkiOptionInteraction
    {
        $result = $this->requireString($payload['result'] ?? null, 'interaction.result');
        if (!OkiInteractionResult::isValid($result)) {
            throw new BadRequestHttpException('Invalid interaction result.');
        }

        return (new OkiOptionInteraction())
            ->setDefensiveMove($this->requireMove($payload['defensiveMoveId'] ?? null, 'interaction.defensiveMoveId'))
            ->setResult($result)
            ->setCharacter($this->nullableCharacter($payload['characterId'] ?? null));
    }

    private function requireMove(mixed $id, string $field): Move
    {
        $value = $this->requireString($id, $field);
        $move = $this->moveRepository->findWithEffectiveFrameData($value);
        if (!$move instanceof Move) {
            throw new BadRequestHttpException(sprintf('%s does not reference an existing move.', $field));
        }

        return $move;
    }

    private function requireCharacter(mixed $id, string $field): Character
    {
        $value = $this->requireString($id, $field);
        $character = $this->characterRepository->find($value);
        if (!$character instanceof Character) {
            throw new BadRequestHttpException(sprintf('%s does not reference an existing character.', $field));
        }

        return $character;
    }

    private function nullableCharacter(mixed $id): ?Character
    {
        if (null === $id || '' === $id) {
            return null;
        }

        return $this->requireCharacter($id, 'interaction.characterId');
    }

    private function requireString(mixed $value, string $field): string
    {
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException(sprintf('%s is required.', $field));
        }

        return trim($value);
    }

    private function nullableString(mixed $value): ?string
    {
        return is_string($value) && '' !== trim($value) ? trim($value) : null;
    }

    private function requireInt(mixed $value, string $field): int
    {
        $integer = $this->nullableInt($value, $field);
        if (null === $integer) {
            throw new BadRequestHttpException(sprintf('%s is required.', $field));
        }

        return $integer;
    }

    private function nullableInt(mixed $value, string $field): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (is_int($value)) {
            return $value;
        }
        if (is_string($value) && preg_match('/^-?\d+$/', trim($value))) {
            return (int) $value;
        }

        throw new BadRequestHttpException(sprintf('%s must be an integer.', $field));
    }

    private function intOrDefault(mixed $value, int $default): int
    {
        return null === $value || '' === $value ? $default : $this->requireInt($value, 'sortOrder');
    }

    private function bool(mixed $value): bool
    {
        return true === $value || 'true' === $value || '1' === $value || 1 === $value;
    }
}
