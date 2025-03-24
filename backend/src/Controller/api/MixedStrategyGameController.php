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
    private MixedStrategyGameSolver $solver;

    public function __construct(MixedStrategyGameSolver $solver)
    {
        $this->solver = $solver;
    }

    #[Route('', name: 'solve_game', methods: ['POST'])]
    public function solveGame(Request $request, LoggerInterface $logger): JsonResponse
    {
        $data = $request->getContent();

        $payoffMatrix = json_decode($data, true)['game'];

        if ($payoffMatrix === null) {
            return new JsonResponse(
                ['error' => 'Invalid JSON data'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }

        try {
            $logger->debug("PAYOFF MATRIX: ", $payoffMatrix);
            $result = $this->solver->solveMixedStrategyGame($payoffMatrix);

            return new JsonResponse($result);
        } catch (\Exception $e) {
            return new JsonResponse(
                ['error' => 'Error solving the game: ' . $e->getMessage()],
                JsonResponse::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
