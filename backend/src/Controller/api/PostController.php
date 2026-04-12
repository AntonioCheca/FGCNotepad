<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\Post;
use App\Entity\Scenario;
use App\Entity\ScenarioType;
use App\Entity\Tag;
use App\Entity\User;
use App\Repository\MoveRepository;
use App\Repository\PostRepository;
use App\Repository\TagRepository;
use App\Service\PostComponentExtractor;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Constraints\Collection;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\Optional;
use Symfony\Component\Validator\Constraints\Type;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Uid\Uuid;

#[Route('/api/posts', name: 'api_posts_')]
class PostController extends AbstractController
{
    public const SEPARATOR_FOR_TAGS_IN_FETCH_API = ',';

    public function __construct(private EntityManagerInterface $entityManager, private Security $security)
    {
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, ValidatorInterface $validator, MoveRepository $moveRepository, TagRepository $tagRepository, EntityManagerInterface $entityManager, PostComponentExtractor $componentExtractor): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new JsonResponse(['error' => 'Invalid JSON'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $constraints = new Collection([
            'title' => new NotBlank(),
            'body' => new NotBlank(),
            'tags' => new Optional([new Type('array')])
        ]);

        $violations = $validator->validate($data, $constraints);
        if (count($violations) > 0) {
            return new JsonResponse(['error' => (string)$violations], JsonResponse::HTTP_BAD_REQUEST);
        }

        $userFromSymfony = $this->security->getUser();
        if (!$userFromSymfony) {
            return new JsonResponse(['error' => 'Unauthorized'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $decodedBody = $this->decodeBodyToArray($data['body']);
        if (null === $decodedBody) {
            return new JsonResponse(['error' => 'Body should be valid JSON format'], JsonResponse::HTTP_BAD_REQUEST);
        }

        /** @var User $internalUserEntity */
        $internalUserEntity = $userFromSymfony;

        $post = new Post();
        $post->setTitle($data['title']);
        $decodedBody = $this->syncScenariosFromPostBody($decodedBody, $internalUserEntity, $data['title']);

        $bodyAsString = json_encode($decodedBody);
        if (false === $bodyAsString) {
            return new JsonResponse(['error' => 'Body should be JSON format, could not encode it'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $post->setBody($bodyAsString);
        $post->setAuthor($internalUserEntity);
        $post->setCreatedAt(new \DateTimeImmutable());
        $post->setLastModified(new \DateTimeImmutable());

        $moveUuids = $componentExtractor->extractComponentIds($decodedBody);
        if (!empty($moveUuids)) {
            $moves = $moveRepository->findBy(['id' => $moveUuids]);
            foreach ($moves as $move) {
                $post->addComponent($move);
            }
        }

        if (!empty($data['tags'])) {
            foreach ($data['tags'] as $tagName) {
                $tag = $tagRepository->findOneBy(['name' => $tagName]) ?? new Tag();
                $tag->setName($tagName);
                $entityManager->persist($tag);
                $post->addTag($tag);
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
        /**
         * @var Post|false $post
         */
        $post = $postRepository->find($id);
        if (!$post) {
            throw new NotFoundHttpException(sprintf('Post not found with id %s', $id));
        }

        $author = $post->getAuthor();
        $authorName = $author ? $author->getUsername() : 'UNKNOWN_USER';
        return new JsonResponse([
            'id' => $post->getId(),
            'title' => $post->getTitle(),
            'body' => $post->getBody(),
            'author' => $authorName,
            'created_at' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
            'last_modified' => $post->getLastModified()->format('Y-m-d H:i:s'),
            'tags' => array_map(fn(Tag $tag) => $tag->getName(), $post->getTags()->toArray()),
        ]);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(PostRepository $postRepository, Request $request): JsonResponse
    {
        $page = max(1, (int)$request->query->get('page', 1));
        $limit = min(500, (int)$request->query->get('size', 10));
        $query = $request->query->get('query', '');
        $includedTagsInRequest = $request->query->get('includedTags', '');
        $excludedTagsInRequest = $request->query->get('excludedTags', '');

        if (!is_string($query) || !is_string($includedTagsInRequest) || !is_string($excludedTagsInRequest)) {
            return new JsonResponse(['error' => 'Tags in includeTags and excludeTags should be strings with the tags separated by a comma'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $includedTags = [];
        $excludedTags = [];

        if ('' !== $includedTagsInRequest) {
            $includedTags = explode(self::SEPARATOR_FOR_TAGS_IN_FETCH_API, $includedTagsInRequest);
        }
        if ('' !== $excludedTagsInRequest) {
            $excludedTags = explode(self::SEPARATOR_FOR_TAGS_IN_FETCH_API, $excludedTagsInRequest);
        }

        $result = $postRepository->findPaginated($page, $limit, $query, $includedTags, $excludedTags);

        $data = $result['posts'];

        return new JsonResponse(['page' => $page, 'size' => $limit, 'data' => $data]);
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
            $decodedBody = $this->decodeBodyToArray($data['body']);
            if (null === $decodedBody) {
                return new JsonResponse(['error' => 'Body should be valid JSON format'], JsonResponse::HTTP_BAD_REQUEST);
            }

            $postTitle = is_string($post->getTitle()) && '' !== trim($post->getTitle()) ? $post->getTitle() : 'Untitled Post';
            $decodedBody = $this->syncScenariosFromPostBody($decodedBody, $post->getAuthor(), $postTitle);

            $encodedBody = json_encode($decodedBody);
            if (false === $encodedBody) {
                return new JsonResponse(['error' => 'Body should be JSON format, could not encode it'], JsonResponse::HTTP_BAD_REQUEST);
            }

            $post->setBody($encodedBody);
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

    /**
     * @return array<string, mixed>|null
     */
    private function decodeBodyToArray(mixed $body): ?array
    {
        if (is_array($body)) {
            return $body;
        }

        if (!is_string($body)) {
            return null;
        }

        $decoded = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    private function syncScenariosFromPostBody(array $body, ?User $author, string $postTitle): array
    {
        $scenarioType = $this->resolveScenarioType();
        $scenarioIndex = 0;

        $this->syncScenarioNode($body, $scenarioType, $author, $postTitle, $scenarioIndex);

        return $body;
    }

    private function resolveScenarioType(): ScenarioType
    {
        $scenarioTypeRepository = $this->entityManager->getRepository(ScenarioType::class);
        $type = $scenarioTypeRepository->findOneBy(['name' => 'MatrixRef']);
        if (null !== $type) {
            return $type;
        }

        $type = (new ScenarioType())->setName('MatrixRef');
        $this->entityManager->persist($type);

        return $type;
    }

    /**
     * @param array<string, mixed> $node
     */
    private function syncScenarioNode(array &$node, ScenarioType $scenarioType, ?User $author, string $postTitle, int &$scenarioIndex): void
    {
        $matrix = $this->normalizeMatrixPayload($node['matrix'] ?? null);
        if (($node['type'] ?? null) === 'scenario-table' && null !== $matrix) {
            $scenarioIndex++;
            $node['matrix'] = $this->upsertScenario($matrix, $scenarioType, $author, $postTitle, $scenarioIndex);
        }

        foreach ($node as &$value) {
            if (is_array($value)) {
                $this->syncScenarioNode($value, $scenarioType, $author, $postTitle, $scenarioIndex);
            }
        }
        unset($value);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeMatrixPayload(mixed $matrix): ?array
    {
        if (is_array($matrix)) {
            return $matrix;
        }

        if (!is_string($matrix)) {
            return null;
        }

        $decoded = json_decode($matrix, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    /**
     * @param array<string, mixed> $matrix
     *
     * @return array<string, mixed>
     */
    private function upsertScenario(array $matrix, ScenarioType $scenarioType, ?User $author, string $postTitle, int $scenarioIndex): array
    {
        $extensions = isset($matrix['extensions']) && is_array($matrix['extensions']) ? $matrix['extensions'] : [];
        $embeddedScenarioId = isset($extensions['scenarioId']) && is_string($extensions['scenarioId'])
            ? trim($extensions['scenarioId'])
            : '';

        $scenario = null;
        if ('' !== $embeddedScenarioId && Uuid::isValid($embeddedScenarioId)) {
            $scenarioRepository = $this->entityManager->getRepository(Scenario::class);
            $scenario = $scenarioRepository->findOneBy(['publicId' => $embeddedScenarioId]);
        }

        if (null === $scenario) {
            $scenario = new Scenario();
        }

        $metadata = isset($matrix['metadata']) && is_array($matrix['metadata']) ? $matrix['metadata'] : [];
        $matrixTitle = isset($metadata['title']) && is_string($metadata['title']) ? trim($metadata['title']) : '';
        $scenarioName = '' !== $matrixTitle ? $matrixTitle : sprintf('%s matrix %d', $postTitle, $scenarioIndex);

        $scenario
            ->setName($scenarioName)
            ->setType($scenarioType)
            ->setPayload($matrix)
            ->setAuthor($author);

        $this->entityManager->persist($scenario);

        $extensions['scenarioId'] = $scenario->getPublicId()->toRfc4122();
        $matrix['extensions'] = $extensions;

        return $matrix;
    }

}
