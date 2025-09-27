<?php declare(strict_types=1);

namespace App\Tests\Controller\api;

use App\Entity\Character;
use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Entity\User;
use App\Repository\ComboSequencesRepository;
use App\Tests\Controller\AuthenticatedWebTestCase;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ComboSequenceControllerTest extends AuthenticatedWebTestCase
{
    public function testListLeafs(): void
    {
        $this->client->request(
            'GET',
            '/api/combo-sequences/leafs/list',
            [], [], $this->getHeaders(),
        );

        $response = $this->client->getResponse();
        $this->assertEquals(Response::HTTP_OK, $response->getStatusCode());
    }

    public function testWorkingRouteComparison(): void
    {
        // Test the working route
        $this->client->request('GET', '/api/moves', [], [], $this->getHeaders());
        $workingResponse = $this->client->getResponse();

        // Test the broken route
        $this->client->request('GET', '/api/combo-sequences/leafs/list', [], [], $this->getHeaders());
        $brokenResponse = $this->client->getResponse();

        echo "Working route status: " . $workingResponse->getStatusCode() . "\n";
        echo "Broken route status: " . $brokenResponse->getStatusCode() . "\n";
        echo "Broken route content: " . $brokenResponse->getContent() . "\n";
    }
}
