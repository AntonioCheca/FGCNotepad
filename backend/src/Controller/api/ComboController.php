<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Combo;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/combos', name: 'api_combos_')]
class ComboController extends AbstractController
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
        $combos = $this->entityManager->getRepository(Combo::class)->findAll();
        return new JsonResponse(
            $this->serializer->serialize($combos, 'json'),
            JsonResponse::HTTP_OK,
            [],
            true
        );
    }

    #[Route('', methods: ['POST'], name: 'create')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $combo = new Combo();
        $combo->setNumpadNotation($data['numpadNotation']);
        $combo->setDamage($data['damage']);

        $errors = $this->validator->validate($combo);
        if (count($errors) > 0) {
            return new JsonResponse($this->serializer->serialize($errors, 'json'), JsonResponse::HTTP_BAD_REQUEST, [], true);
        }

        $this->entityManager->persist($combo);
        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($combo, 'json'),
            JsonResponse::HTTP_CREATED,
            [],
            true
        );
    }
}