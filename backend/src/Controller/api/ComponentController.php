<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Component;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/components', name: 'api_components_')]
class ComponentController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SerializerInterface    $serializer
    )
    {
    }

    #[Route('', methods: ['GET'], name: 'list')]
    public function list(): JsonResponse
    {
        $components = $this->entityManager->getRepository(Component::class)->findAll();
        return new JsonResponse(
            $this->serializer->serialize($components, 'json'),
            JsonResponse::HTTP_OK,
            [],
            true
        );
    }
}