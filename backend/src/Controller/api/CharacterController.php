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
        // Now using the optimized repository method
        error_log('Controller start: ' . microtime(true));
        $data = $this->characterRepository->findAllIdsAndNames();

        $dataInJsonFormat = $this->json($data);
        error_log('Controller end: ' . microtime(true));
        return $dataInJsonFormat;
    }
}
