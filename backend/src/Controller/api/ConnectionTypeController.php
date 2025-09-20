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
        private ConnectionTypeRepository $connectionTypeRepository,
        private SerializerInterface      $serializer
    )
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $connectionTypes = $this->connectionTypeRepository->findAll();
        $json = $this->serializer->serialize($connectionTypes, 'json');

        return new JsonResponse($json, 200, [], true);
    }
}
