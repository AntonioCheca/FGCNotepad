<?php declare(strict_types=1);

// src/Controller/MixedStrategyGameController.php

namespace App\Controller\api;

use App\Service\MixedStrategyGameSolver;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/solve_game', name: 'api_solve_game_')]
class MixedStrategyGameController extends AbstractController
{
    public function __construct(
        private readonly MixedStrategyGameSolver $solver,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('', name: 'solve_game', methods: ['POST'])]
    public function solveGame(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        $payoffMatrix = is_array($payload) ? ($payload['game'] ?? null) : null;

        if (!is_array($payoffMatrix)) {
            return new JsonResponse(
                ['error' => 'Invalid JSON data'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }

        try {
            return new JsonResponse($this->solver->solveMixedStrategyGame($payoffMatrix));
        } catch (\InvalidArgumentException $exception) {
            return new JsonResponse(['error' => $exception->getMessage()], JsonResponse::HTTP_BAD_REQUEST);
        } catch (\Throwable $exception) {
            $this->logger->error('Mixed strategy game solve failed.', ['exception' => $exception]);

            return new JsonResponse(['error' => 'Error solving the game.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
