<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Repository\CharacterRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/characters', name: 'api_characters_')]
class CharacterController extends AbstractController
{
    public function __construct(
        private CharacterRepository $characterRepository,
        private SerializerInterface $serializer
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        error_log('Controller start: ' . microtime(true));
        $characters = $this->characterRepository->findAll();

        $json = $this->serializer->serialize($characters, 'json');
        error_log('Controller end: ' . microtime(true));

        return new JsonResponse($json, 200, [], true);
    }

}
