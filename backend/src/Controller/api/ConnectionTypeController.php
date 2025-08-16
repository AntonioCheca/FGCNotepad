<?php
declare(strict_types=1);

namespace App\Controller\api;

use App\Repository\ConnectionTypeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/connection-types', name: 'api_connection_types_')]
class ConnectionTypeController extends AbstractController
{
    public function __construct(
        private SerializerInterface $serializer
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ConnectionTypeRepository $repo): JsonResponse
    {
        $types = $repo->findAll();

        return new JsonResponse(
            $this->serializer->serialize($types, 'json', ['groups' => ['connection_type:read']]),
            JsonResponse::HTTP_OK,
            [],
            true
        );
    }
}
