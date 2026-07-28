<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\ComboSpacing;
use App\Repository\ComboSpacingRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/combo-spacings', name: 'api_combo_spacings_')]
class ComboSpacingController extends AbstractController
{
    public function __construct(private readonly ComboSpacingRepository $comboSpacingRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        return new JsonResponse(array_map(
            static fn (ComboSpacing $spacing): array => [
                'id' => $spacing->getId(),
                'code' => $spacing->getCode(),
                'name' => $spacing->getName(),
                'description' => $spacing->getDescription(),
                'sortOrder' => $spacing->getSortOrder(),
            ],
            $this->comboSpacingRepository->findAllOrdered()
        ), JsonResponse::HTTP_OK);
    }
}
