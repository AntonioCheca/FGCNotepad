<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Repository\CharacterRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/characters', name: 'api_characters_')]
class CharacterController extends AbstractController
{
    public function __construct(private CharacterRepository $characterRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {

        $start = microtime(true);
        $characters = $this->characterRepository->findAll();
        $end = microtime(true);
        error_log('Characters query time: ' . ($end - $start) . ' seconds');
        error_log('Characters count: ' . count($characters));

        $data = array_map(fn($character) => [
            'id' => $character->getId(),
            'name' => $character->getName(),
        ], $characters);

        return $this->json($data);
    }
}
