<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Move;
use App\Repository\CharacterRepository;
use App\Repository\MoveRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;


#[Route('/api/moves', name: 'api_moves_')]
class MoveController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SerializerInterface    $serializer,
        private ValidatorInterface     $validator
    )
    {
    }

    #[Route('', methods: ['GET'], name: 'list')]
    public function list(): JsonResponse
    {
        $moves = $this->entityManager->getRepository(Move::class)->findAll();
        return new JsonResponse(
            $this->serializer->serialize($moves, 'json', ['groups' => ['move:read']]),
            JsonResponse::HTTP_OK,
            [],
            true
        );
    }

    #[Route('/search', methods: ['GET'], name: 'query')]
    public function querySpecificMoves(Request $request, MoveRepository $moveRepository): JsonResponse
    {
        $query = $request->query->get('query', '');
        if (!is_string($query) || empty($query)) {
            return $this->json([]);
        }

        $moves = $moveRepository->queryForSpecificNumpadOrCharactersFromString($query);

        return $this->json(array_map(fn($move) => [
            'id' => $move->getId(),
            'summary' => $move->getCharacter()->getName() . ' ' . $move->getNumpadNotation()
        ], $moves));
    }

    #[Route('', methods: ['POST'], name: 'create')]
    public function create(Request $request, CharacterRepository $characterRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['characterId']) || !isset($data['numpadNotation'])) {
            return new JsonResponse(sprintf('Body for request incomplete, expected characterId and numpadNotation and not found, found %s instead', $this->serializer->serialize($data, 'json')), JsonResponse::HTTP_BAD_REQUEST, [], true);
        }
        $charactersInBackend = $characterRepository->findBy(['id' => $data['characterId']]);
        $character = $charactersInBackend[0];
        $move = new Move();
        $move->setNumpadNotation($data['numpadNotation']);
        $move->setCharacter($character);

        $errors = $this->validator->validate($move);
        if (count($errors) > 0) {
            return new JsonResponse($this->serializer->serialize($errors, 'json'), JsonResponse::HTTP_BAD_REQUEST, [], true);
        }

        $this->entityManager->persist($move);
        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($move, 'json', ['groups' => ['move:read']]),
            JsonResponse::HTTP_CREATED,
            [],
            true
        );
    }

    #[Route('/{id}', name: 'read', methods: ['GET'])]
    public function read(string $id, MoveRepository $moveRepository, Request $request): JsonResponse
    {
        /**
         * @var Move|null $move
         */
        $move = $moveRepository->find($id);

        if (!$move) {
            throw new NotFoundHttpException(sprintf('Move not found with id %s', $id));
        }

        $frameData = $move->getFrameData();

        return new JsonResponse([
            'id' => $move->getId(),
            'character' => $move->getCharacter()->getName(),
            'numpad_notation' => $move->getNumpadNotation(),
            'full_frame_data' => $frameData ? $frameData->getFullDataAsArray() : '',
            'summary_frame_data' => $frameData ? $frameData->getSummaryAsArray() : '',
        ]);
    }
}