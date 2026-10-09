<?php declare(strict_types=1);

namespace App\Controller\api;

use App\Entity\User;
use App\Service\AccountDeletionRequestService;
use App\Service\AuthenticatedUserPayloadFactory;
use App\Service\TermsAcceptanceService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/profile', name: 'api_profile_account_')]
class ProfileAccountController extends AbstractController
{
    public function __construct(
        private readonly TermsAcceptanceService $termsAcceptanceService,
        private readonly AccountDeletionRequestService $accountDeletionRequestService,
        private readonly AuthenticatedUserPayloadFactory $userPayloadFactory,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    #[Route('/terms-acceptance', name: 'terms_acceptance', methods: ['POST'])]
    public function acceptTerms(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return new JsonResponse(['message' => 'Authentication required.'], Response::HTTP_UNAUTHORIZED);
        }

        $this->termsAcceptanceService->acceptCurrentTerms($user);

        return new JsonResponse(['user' => $this->userPayloadFactory->create($user)], Response::HTTP_OK);
    }

    #[Route('/deletion-request', name: 'deletion_request', methods: ['POST'])]
    public function requestDeletion(#[CurrentUser] ?User $user, Request $request): JsonResponse
    {
        if (null === $user) {
            return new JsonResponse(['message' => 'Authentication required.'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $this->accountDeletionRequestService->requestDeletion($user);
        } catch (ConflictHttpException $exception) {
            return new JsonResponse(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        $this->tokenStorage->setToken(null);
        if ($request->hasSession()) {
            $request->getSession()->invalidate();
        }

        return new JsonResponse(['message' => 'Account deletion requested.'], Response::HTTP_OK);
    }
}
