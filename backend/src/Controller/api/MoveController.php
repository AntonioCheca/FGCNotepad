<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Move;
use App\Repository\CharacterRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
}