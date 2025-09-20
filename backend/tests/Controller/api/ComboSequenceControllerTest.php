<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ComboSequenceControllerTest extends WebTestCase
{
    private function getToken(): string
    {
        self::bootKernel();
        $container = static::getContainer();

        /** @var EntityManagerInterface $em */
        $em = $container->get(EntityManagerInterface::class);
        $user = $em->getRepository(User::class)->findOneBy(['username' => 'Checa']);

        $jwtManager = $container->get('lexik_jwt_authentication.jwt_manager');
        return $jwtManager->create($user);
    }

    public function testListLeafs(): void
    {
        $client = static::createClient();
        $token = $this->getToken();

        $client->request(
            'GET',
            '/api/combo-sequences/leafs/list',
            [],
            [],
            [
                'HTTP_Authorization' => 'Bearer ' . $token,
                'CONTENT_TYPE' => 'application/json',
            ]
        );

        $this->assertResponseIsSuccessful();
        $this->assertResponseStatusCodeSame(200);
    }
}
