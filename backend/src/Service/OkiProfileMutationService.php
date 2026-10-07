<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Move;
use App\Entity\OkiNode;
use App\Entity\OkiNodeLink;
use App\Entity\OkiProfile;
use App\Entity\OkiSetup;
use App\Entity\User;
use App\Repository\MoveRepository;
use App\Service\PressureGraph\PressureGraphFieldParser;
use App\Util\Enum\OkiAction;
use App\Util\Enum\OkiHitLevel;
use App\Util\Enum\OkiRecovery;
use App\Util\Enum\OkiStepType;
use App\Util\Enum\PressureEdgeKind;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class OkiProfileMutationService
{
    public const ENDER_CLIENT_ID = 'ender';
    public const SETUP_NAME_MAX_LENGTH = 80;
    private const EDGE_KINDS = [PressureEdgeKind::NORMAL, PressureEdgeKind::CONFIRM, PressureEdgeKind::READ];

    public function __construct(
        private readonly MoveRepository $moveRepository,
        private readonly OkiSetupAccessService $accessService,
        private readonly ModerationTransitionService $moderationTransitionService,
        private readonly PressureGraphFieldParser $graphFields,
    ) {
    }

    /**
     * Applies the actor's view of the profile: payload setups with an id replace that setup (author kept),
     * payload setups without an id are created, and setups the actor may edit but omitted are removed.
     * Every created or replaced setup goes back to pending review; setups the actor cannot edit are untouched.
     *
     * @param array<string, mixed> $payload
     */
    public function hydrateProfile(OkiProfile $profile, array $payload, User $actor): void
    {
        $move = $this->requireMove($payload['moveId'] ?? null, 'moveId');
        if (null !== $profile->getId() && (string) $profile->getMove()->getId() !== (string) $move->getId()) {
            throw new BadRequestHttpException('moveId cannot be changed on an existing oki profile.');
        }
        $profile->setMove($move);

        $setups = $payload['setups'] ?? [];
        if (!is_array($setups)) {
            throw new BadRequestHttpException('setups must be an array.');
        }

        foreach ($setups as $setupPayload) {
            if (!is_array($setupPayload)) {
                throw new BadRequestHttpException('Each setup must be an object.');
            }

            $author = $actor;
            $existingId = $setupPayload['id'] ?? null;
            if (null !== $existingId && '' !== $existingId) {
                $existing = $this->findSetup($profile, $this->requireInt($existingId, 'setup.id'));
                if (!$this->accessService->canEdit($existing, $actor)) {
                    throw new AccessDeniedHttpException('You cannot edit this oki setup.');
                }
                $author = $existing->getAuthor();
                $profile->removeSetup($existing);
            }

            $setup = $this->buildSetup($setupPayload)->setAuthor($author);
            $this->moderationTransitionService->submitOkiSetupForReview($setup);
            $profile->addSetup($setup);
        }

        foreach ($profile->getSetups()->toArray() as $existing) {
            if (null !== $existing->getId() && $this->accessService->canEdit($existing, $actor)) {
                $profile->removeSetup($existing);
            }
        }
    }

    private function findSetup(OkiProfile $profile, int $id): OkiSetup
    {
        foreach ($profile->getSetups() as $setup) {
            if ($setup->getId() === $id) {
                return $setup;
            }
        }

        throw new BadRequestHttpException('setup.id does not belong to this oki profile.');
    }

    /** @param array<string, mixed> $payload */
    private function buildSetup(array $payload): OkiSetup
    {
        $setup = (new OkiSetup())
            ->setName($this->setupName($payload['name'] ?? null))
            ->setCornerOnly($this->bool($payload['cornerOnly'] ?? false))
            ->setBackrollDependent($this->bool($payload['backrollDependent'] ?? false));

        $clientNodeMap = [];
        foreach ($this->requireList($payload['nodes'] ?? [], 'nodes') as $index => $nodePayload) {
            $node = $this->buildNode($nodePayload, $index);
            $setup->addNode($node);
            $clientNodeMap[$this->requireString($nodePayload['clientId'] ?? null, 'node.clientId')] = $node;
        }

        $linkKeys = [];
        foreach ($this->requireList($payload['links'] ?? [], 'links') as $linkPayload) {
            $fromId = $this->requireString($linkPayload['fromClientId'] ?? null, 'link.fromClientId');
            $toId = $this->requireString($linkPayload['toClientId'] ?? null, 'link.toClientId');
            $fromEnder = self::ENDER_CLIENT_ID === $fromId;
            if (!isset($clientNodeMap[$toId]) || (!$fromEnder && !isset($clientNodeMap[$fromId]))) {
                throw new BadRequestHttpException('Each link must reference existing node client IDs.');
            }
            if (isset($linkKeys[$fromId . '>' . $toId])) {
                throw new BadRequestHttpException('Two links cannot join the same nodes.');
            }
            $linkKeys[$fromId . '>' . $toId] = true;

            $link = $this->buildLink($linkPayload, $setup->isBackrollDependent(), $clientNodeMap[$toId])->setFromNode($fromEnder ? null : $clientNodeMap[$fromId]);
            $clientNodeMap[$toId]->addIncomingLink($link);
        }

        return $setup;
    }

    /** @param array<string, mixed> $payload */
    private function buildNode(array $payload, int $index): OkiNode
    {
        $moveId = $payload['moveId'] ?? null;
        $action = $this->nullableEnum($payload['action'] ?? null, OkiAction::class, 'action');
        if ((null === $moveId || '' === $moveId) === (null === $action)) {
            throw new BadRequestHttpException('Each node needs exactly one of moveId or action.');
        }

        return (new OkiNode())
            ->setMove(null === $action ? $this->requireMove($moveId, 'node.moveId') : null)
            ->setAction($action)
            ->setSortOrder($this->intOrDefault($payload['sortOrder'] ?? null, $index))
            ->setHitLevel($this->nullableEnum($payload['hitLevel'] ?? null, OkiHitLevel::class, 'hitLevel'))
            ->setSideSwitch($this->bool($payload['sideSwitch'] ?? false));
    }

    /** @param array<string, mixed> $payload */
    private function buildLink(array $payload, bool $backrollDependent, OkiNode $toNode): OkiNodeLink
    {
        $safeJump = $this->bool($payload['safeJump'] ?? false);
        if ($safeJump && !$this->isJumpingAttack($toNode)) {
            throw new BadRequestHttpException('safeJump is only allowed on steps into a jumping attack.');
        }
        $recovery = $this->nullableEnum($payload['recovery'] ?? null, OkiRecovery::class, 'recovery');
        if (null !== $recovery && !$backrollDependent) {
            throw new BadRequestHttpException('recovery is only allowed on backroll-dependent setups.');
        }
        $kind = $this->graphFields->edgeKind($payload['kind'] ?? null, self::EDGE_KINDS);

        return (new OkiNodeLink())
            ->setStepType($this->nullableEnum($payload['stepType'] ?? null, OkiStepType::class, 'stepType') ?? OkiStepType::IMMEDIATE->value)
            ->setKind($kind->value)
            ->setReadLabel($this->graphFields->readLabel($payload['readLabel'] ?? null, $kind))
            ->setSafeJump($safeJump)
            ->setRecovery($recovery);
    }

    private function setupName(mixed $value): string
    {
        $name = $this->requireString($value, 'setup.name');
        if (mb_strlen($name) > self::SETUP_NAME_MAX_LENGTH) {
            throw new BadRequestHttpException(sprintf('setup.name must be at most %d characters.', self::SETUP_NAME_MAX_LENGTH));
        }

        return $name;
    }

    private function isJumpingAttack(OkiNode $node): bool
    {
        return 1 === preg_match('/^[89]/', $node->getMove()?->getNumpadNotation() ?? '');
    }

    /**
     * @param class-string<\BackedEnum> $enum
     */
    private function nullableEnum(mixed $value, string $enum, string $field): ?string
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_string($value) || null === $enum::tryFrom($value)) {
            throw new BadRequestHttpException(sprintf('Invalid %s.', $field));
        }

        return $value;
    }

    /** @return list<array<string, mixed>> */
    private function requireList(mixed $value, string $field): array
    {
        if (!is_array($value)) {
            throw new BadRequestHttpException(sprintf('%s must be an array.', $field));
        }
        foreach ($value as $item) {
            if (!is_array($item)) {
                throw new BadRequestHttpException(sprintf('Each item in %s must be an object.', $field));
            }
        }

        return array_values($value);
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

    private function requireString(mixed $value, string $field): string
    {
        if (!is_string($value) || '' === trim($value)) {
            throw new BadRequestHttpException(sprintf('%s is required.', $field));
        }

        return trim($value);
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
