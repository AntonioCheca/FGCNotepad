<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Post;
use App\Entity\User;
use App\Repository\PostRepository;
use App\Repository\UserRepository;
use App\Service\MarkdownParserToHtml;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
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
    public function create(Request $request, ValidatorInterface $validator, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['title'], $data['body'])) {
            return new JsonResponse(['error' => 'Missing required fields'], Response::HTTP_BAD_REQUEST);
        }

        $userFromSymfony = $this->security->getUser();
        if (!$userFromSymfony) {
            return new JsonResponse(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        /** @var User $internalUserEntity */
        $internalUserEntity = $userFromSymfony;

        $post = new Post();
        $post->setTitle($data['title']);
        $post->setBody($data['body']);
        $post->setAuthor($internalUserEntity);
        $post->setCreatedAt(new \DateTimeImmutable());
        $post->setLastModified(new \DateTimeImmutable());

        $errors = $validator->validate($post);
        if (count($errors) > 0) {
            return new JsonResponse(['error' => (string)$errors], Response::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($post);
        $this->entityManager->flush();

        return new JsonResponse(['message' => 'Post created', 'id' => $post->getId()], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'read', methods: ['GET'])]
    public function read(string $id, PostRepository $postRepository, MarkdownParserToHtml $markdownParser, Request $request): JsonResponse
    {
        $post = $postRepository->find($id);

        if (!$post) {
            throw new NotFoundHttpException('Post not found');
        }

        $markdownParse = $request->query->getBoolean('markdown_parse', false);
        $body = $markdownParse ? $markdownParser->parse($post->getBody()) : $post->getBody();

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
