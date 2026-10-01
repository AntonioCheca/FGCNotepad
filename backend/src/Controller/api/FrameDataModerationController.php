<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\FrameData;
use App\Entity\Move;
use App\Entity\User;
use App\Repository\FrameDataOverrideRepository;
use App\Repository\MoveRepository;
use App\Service\EndpointAuthorizationService;
use App\Service\FrameDataOverrideService;
use App\Service\CharacterResourceService;
use App\Service\MoveManualMetadataService;
use App\Service\MoveResourceEffectService;
use App\Repository\MoveResourceEffectRepository;
use App\Repository\CharacterRepository;
use App\Repository\ComboSequencesRepository;
use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Service\Modern\ModernGameDataService;
use App\Util\Enum\ModernAutoComboStrength;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/moderation/frame-data', name: 'api_moderation_frame_data_')]
class FrameDataModerationController extends AbstractController
{
    public function __construct(
        private readonly EndpointAuthorizationService $endpointAuthorizationService,
        private readonly MoveRepository $moveRepository,
        private readonly FrameDataOverrideRepository $frameDataOverrideRepository,
        private readonly FrameDataOverrideService $frameDataOverrideService,
        private readonly MoveManualMetadataService $moveManualMetadataService,
        private readonly MoveResourceEffectService $moveResourceEffectService,
        private readonly MoveResourceEffectRepository $moveResourceEffectRepository,
        private readonly CharacterResourceService $characterResourceService,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly ModernGameDataService $modernGameDataService,
        private readonly CharacterRepository $characterRepository,
        private readonly ComboSequencesRepository $comboSequencesRepository,
    ) {
    }

    #[Route('/columns', name: 'columns', methods: ['GET'])]
    public function columns(): JsonResponse
    {
        try {
            $this->requireModeratorActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        return new JsonResponse(['columns' => $this->frameDataOverrideService->getEditableColumns()], Response::HTTP_OK);
    }

    #[Route('/characters/{characterId}/moves', name: 'moves_by_character', methods: ['GET'])]
    public function movesByCharacter(string $characterId): JsonResponse
    {
        try {
            $this->requireModeratorActor();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $moves = $this->moveRepository->findByCharacterWithEffectiveFrameData($characterId);
        $metadataMap = $this->moveManualMetadataService->findMapForMoves($moves);
        $overrideMap = $this->buildOverrideMap($moves);
        $effectsByMove = $this->moveResourceEffectRepository->findGroupedByMove($moves);
        $characterName = (($moves[0] ?? null) instanceof Move) ? $moves[0]->getCharacter()->getName() : null;

        return new JsonResponse([
            'columns' => $this->frameDataOverrideService->getEditableColumns(),
            'resources' => $characterName ? $this->characterResourceService->listForApi($characterName) : [],
            'moves' => array_map(function (Move $move) use ($metadataMap, $overrideMap, $effectsByMove): array {
                return $this->serializeMove($move, $metadataMap, $overrideMap) + [
                    'resourceEffects' => array_map(fn ($effect): array => $this->moveResourceEffectService->toApi($effect), $effectsByMove[(string) $move->getId()] ?? []),
                ];
            }, $moves),
        ], Response::HTTP_OK);
    }

    #[Route('/overrides/{frameDataId}/{columnName}', name: 'save_override', methods: ['PATCH'])]
    public function saveOverride(string $frameDataId, string $columnName, Request $request): JsonResponse
    {
        try {
            $actor = $this->requireModeratorActor();
            $payload = $this->decodePayload($request);
            $frameData = $this->entityManager->getRepository(FrameData::class)->find($frameDataId);
            if (!$frameData instanceof FrameData) {
                throw new NotFoundHttpException('Frame data not found.');
            }

            $this->frameDataOverrideService->saveOverride($frameData, $columnName, $payload['value'] ?? null, $actor);
            $this->entityManager->flush();
            $this->entityManager->refresh($frameData);
            $this->frameDataOverrideService->applyOverridesToFrameDataRows([$frameData]);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }

        $rawValue = $frameData->getRawValue($columnName);
        $effectiveValue = $this->readEffectiveValue($frameData, $columnName);

        return new JsonResponse([
            'columnName' => $columnName,
            'baseValue' => $rawValue,
            'effectiveValue' => $effectiveValue,
            'isOverridden' => $rawValue !== $effectiveValue,
        ], Response::HTTP_OK);
    }

    #[Route('/manual-metadata/{moveId}', name: 'save_manual_metadata', methods: ['PATCH'])]
    public function saveManualMetadata(string $moveId, Request $request): JsonResponse
    {
        try {
            $actor = $this->requireModeratorActor();
            $payload = $this->decodePayload($request);
            $move = $this->moveRepository->find($moveId);
            if (!$move instanceof Move) {
                throw new NotFoundHttpException('Move not found.');
            }

            $whiffOnCrouch = (bool) ($payload['whiffOnCrouch'] ?? false);
            $forcesStanding = (bool) ($payload['forcesStanding'] ?? false);
            $metadata = $this->moveManualMetadataService->saveMetadata($move, $whiffOnCrouch, $forcesStanding, $actor);
            $this->entityManager->flush();
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse([
            'moveId' => $moveId,
            'whiffOnCrouch' => $metadata->whiffsOnCrouch(),
            'forcesStanding' => $metadata->forcesStanding(),
        ], Response::HTTP_OK);
    }

    #[Route('/resource-effects/{moveId}', name: 'save_resource_effects', methods: ['PATCH'])]
    public function saveResourceEffects(string $moveId, Request $request): JsonResponse
    {
        try {
            $actor = $this->requireModeratorActor();
            $payload = $this->decodePayload($request);
            $move = $this->moveRepository->find($moveId);
            if (!$move instanceof Move) {
                throw new NotFoundHttpException('Move not found.');
            }
            if (!is_array($payload['effects'] ?? null)) {
                throw new BadRequestHttpException('effects must be an array.');
            }

            $effects = $this->moveResourceEffectService->replaceEffects($move, array_values($payload['effects']), $actor);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        } catch (BadRequestHttpException|\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse([
            'moveId' => $moveId,
            'resourceEffects' => array_map(fn ($effect): array => $this->moveResourceEffectService->toApi($effect), $effects),
        ], Response::HTTP_OK);
    }

    #[Route('/modern/{moveId}', name: 'save_modern', methods: ['PATCH'])]
    public function saveModern(string $moveId, Request $request): JsonResponse
    {
        try {
            $this->requireModeratorActor();
            $payload = $this->decodePayload($request);
            $move = $this->moveRepository->find($moveId);
            if (!$move instanceof Move) {
                throw new NotFoundHttpException('Move not found.');
            }

            $modern = $this->modernGameDataService->updateMove($move, $payload);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse(['moveId' => $moveId, 'modern' => $modern], Response::HTTP_OK);
    }

    #[Route('/characters/{characterId}/modern-auto-combos', name: 'modern_auto_combos', methods: ['GET'])]
    public function modernAutoCombos(string $characterId): JsonResponse
    {
        try {
            $this->requireModeratorActor();
            $autoCombos = $this->modernGameDataService->autoCombos($this->requireCharacter($characterId));
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse(['autoCombos' => $autoCombos], Response::HTTP_OK);
    }

    #[Route('/characters/{characterId}/modern-auto-combos/{strength}', name: 'save_modern_auto_combo', methods: ['PUT'])]
    public function saveModernAutoCombo(string $characterId, string $strength, Request $request): JsonResponse
    {
        try {
            $this->requireModeratorActor();
            $character = $this->requireCharacter($characterId);
            $autoComboStrength = ModernAutoComboStrength::tryFrom($strength) ?? throw new NotFoundHttpException('Unknown auto combo strength.');
            $comboId = $this->decodePayload($request)['comboId'] ?? null;
            if (null !== $comboId && !is_int($comboId)) {
                throw new BadRequestHttpException('comboId must be an integer or null.');
            }
            $combo = null === $comboId ? null : $this->comboSequencesRepository->find($comboId);
            if (null !== $comboId && !$combo instanceof ComboSequences) {
                throw new NotFoundHttpException('Combo not found.');
            }

            $autoCombos = $this->modernGameDataService->setAutoCombo($character, $autoComboStrength, $combo);
        } catch (UnauthorizedHttpException) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        } catch (AccessDeniedHttpException) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        } catch (BadRequestHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse(['autoCombos' => $autoCombos], Response::HTTP_OK);
    }

    private function requireCharacter(string $characterId): Character
    {
        $character = $this->characterRepository->find($characterId);
        if (!$character instanceof Character) {
            throw new NotFoundHttpException('Character not found.');
        }

        return $character;
    }

    private function requireModeratorActor(): User
    {
        $actor = $this->endpointAuthorizationService->requireAuthenticatedUser($this->security->getUser(), 'Authentication required.');
        $this->endpointAuthorizationService->assertCanModerateContent($actor);

        return $actor;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodePayload(Request $request): array
    {
        $payload = json_decode((string) $request->getContent(), true);
        if (!is_array($payload)) {
            throw new BadRequestHttpException('Request body must be valid JSON.');
        }

        return $payload;
    }

    /**
     * @param list<Move> $moves
     *
     * @return array<string, array<string, mixed>>
     */
    private function buildOverrideMap(array $moves): array
    {
        $frameDataRows = [];
        foreach ($moves as $move) {
            $frameData = $move->getFrameData();
            if ($frameData instanceof FrameData) {
                $frameDataRows[] = $frameData;
            }
        }

        return $this->frameDataOverrideRepository->findOverrideMapForFrameDataRows($frameDataRows);
    }

    /**
     * @param array<string, \App\Entity\MoveManualMetadata> $metadataMap
     * @param array<string, array<string, mixed>> $overrideMap
     *
     * @return array<string, mixed>
     */
    private function serializeMove(Move $move, array $metadataMap, array $overrideMap): array
    {
        $frameData = $move->getFrameData();
        $moveId = $move->getId()?->toRfc4122() ?? '';
        $frameDataId = $frameData?->getId()?->toRfc4122() ?? '';
        $metadata = $metadataMap[$moveId] ?? null;
        $values = [];

        if ($frameData instanceof FrameData) {
            foreach ($this->frameDataOverrideService->getEditableColumns() as $column) {
                $columnName = $column['columnName'];
                $baseValue = $frameData->getRawValue($columnName);
                $values[$columnName] = [
                    'baseValue' => $baseValue,
                    'effectiveValue' => $this->readEffectiveValue($frameData, $columnName),
                    'isOverridden' => array_key_exists($columnName, $overrideMap[$frameDataId] ?? []),
                ];
            }
        }

        return [
            'moveId' => $moveId,
            'frameDataId' => $frameDataId,
            'name' => $move->getName(),
            'numpadNotation' => $move->getNumpadNotation(),
            'values' => $values,
            'manualMetadata' => [
                'whiffOnCrouch' => $metadata?->whiffsOnCrouch() ?? false,
                'forcesStanding' => $metadata?->forcesStanding() ?? false,
            ],
            'modern' => $this->modernGameDataService->toApi($move),
        ];
    }

    private function readEffectiveValue(FrameData $frameData, string $columnName): mixed
    {
        $getter = 'get' . ucfirst($columnName);
        if (!method_exists($frameData, $getter)) {
            throw new BadRequestHttpException(sprintf('Column "%s" is not readable.', $columnName));
        }

        return $frameData->{$getter}();
    }
}
