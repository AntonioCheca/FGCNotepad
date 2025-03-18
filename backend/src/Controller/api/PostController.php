<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Component;
use App\Entity\Post;
use App\Entity\User;
use App\Repository\MoveRepository;
use App\Repository\PostRepository;
use App\Repository\UserRepository;
use App\Service\HtmlSanitizerService;
use App\Service\MarkdownParserToHtml;
use App\Service\PostComponentExtractor;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Constraints\Collection;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/posts', name: 'api_posts_')]
class PostController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security               $security
    )
    {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request                $request,
        ValidatorInterface     $validator,
        MoveRepository         $moveRepository,
        EntityManagerInterface $entityManager,
        PostComponentExtractor $componentExtractor
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new JsonResponse(['error' => 'Invalid JSON'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $constraints = new Collection([
            'title' => new NotBlank(),
            'body' => new NotBlank(),
        ]);

        $violations = $validator->validate($data, $constraints);
        if (count($violations) > 0) {
            return new JsonResponse(['error' => (string)$violations], JsonResponse::HTTP_BAD_REQUEST);
        }

        $userFromSymfony = $this->security->getUser();
        if (!$userFromSymfony) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        /** @var User $internalUserEntity */
        $internalUserEntity = $userFromSymfony;

        $post = new Post();
        $post->setTitle($data['title']);
        $post->setBody(json_encode($data['body'])); // Store JSON safely
        $post->setAuthor($internalUserEntity);
        $post->setCreatedAt(new \DateTimeImmutable());
        $post->setLastModified(new \DateTimeImmutable());

        $moveUuids = $componentExtractor->extractComponentIds(json_decode($data['body'], true));

        if (!empty($moveUuids)) {
            $moves = $moveRepository->findBy(['id' => $moveUuids]);
            foreach ($moves as $move) {
                $post->addComponent($move);
            }
        }

        $errors = $validator->validate($post);
        if (count($errors) > 0) {
            return new JsonResponse(['error' => (string)$errors], JsonResponse::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($post);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Post created', 'id' => $post->getId()], JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', methods: ['GET'])]
    public function read(string $id, PostRepository $postRepository): JsonResponse
    {
        $post = $postRepository->find($id);

        if (!$post) {
            throw new NotFoundHttpException(sprintf('Post not found with id %s', $id));
        }

        $body = $post->getBody();

        return new JsonResponse([
            'id' => $post->getId(),
            'title' => $post->getTitle(),
            'body' => $body,
            'author' => $post->getAuthor()->getUsername(),
            'created_at' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
            'last_modified' => $post->getLastModified()->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(PostRepository $postRepository): JsonResponse
    {
        $posts = $postRepository->findBy([], ['createdAt' => 'DESC']);

        $data = array_map(fn(Post $post) => [
            'id' => $post->getId(),
            'title' => $post->getTitle(),
            'author' => $post->getAuthor()->getUsername(),
            'created_at' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
        ], $posts);

        return new JsonResponse($data);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request, PostRepository $postRepository, ValidatorInterface $validator): JsonResponse
    {
        $post = $postRepository->find($id);
        if (!$post) {
            throw new NotFoundHttpException('Post not found');
        }

        $user = $this->security->getUser();
        if ($user !== $post->getAuthor()) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['title'])) {
            $post->setTitle($data['title']);
        }
        if (isset($data['body'])) {
            $post->setBody($data['body']);
        }

        $post->setLastModified(new \DateTimeImmutable());

        $errors = $validator->validate($post);
        if (count($errors) > 0) {
            return new JsonResponse(['error' => (string)$errors], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->flush();

        return new JsonResponse(['message' => 'Post updated']);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, PostRepository $postRepository): JsonResponse
    {
        $post = $postRepository->find($id);
        if (!$post) {
            throw new NotFoundHttpException('Post not found');
        }

        $user = $this->security->getUser();
        if ($user !== $post->getAuthor()) {
            return new JsonResponse(['error' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($post);
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'Post deleted']);
    }
}
