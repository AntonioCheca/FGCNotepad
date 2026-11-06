<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Scenario;
use App\Entity\ScenarioAlias;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Readable scenario names for article embeds and grid transfers. Aliases are stored normalized: lowercase letters,
 * digits and single hyphens, so "Juri 214MK main oki" and "juri-214mk-main-oki" name the same scenario.
 */
class ScenarioAliasService
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public static function normalize(string $alias): string
    {
        return trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower($alias)), '-');
    }

    public function findAlias(Scenario $scenario): ?string
    {
        return $this->findEntityFor($scenario)?->getAlias();
    }

    public function findScenario(string $alias): ?Scenario
    {
        $normalized = self::normalize($alias);
        if ('' === $normalized) {
            return null;
        }

        return $this->entityManager->getRepository(ScenarioAlias::class)->findOneBy(['alias' => $normalized])?->getScenario();
    }

    /**
     * Sets or, with null or a blank alias, removes the scenario's alias. The caller flushes.
     *
     * @throws \InvalidArgumentException when the alias is too long or already names another scenario
     */
    public function assign(Scenario $scenario, ?string $alias): ?string
    {
        $normalized = null === $alias ? '' : self::normalize($alias);
        $existing = $this->findEntityFor($scenario);
        if ('' === $normalized) {
            if (null !== $existing) {
                $this->entityManager->remove($existing);
            }

            return null;
        }

        if (strlen($normalized) > ScenarioAlias::MAX_LENGTH) {
            throw new \InvalidArgumentException(sprintf('Alias must be at most %d characters.', ScenarioAlias::MAX_LENGTH));
        }

        $owner = $this->findScenario($normalized);
        if (null !== $owner && $owner !== $scenario) {
            throw new \InvalidArgumentException(sprintf('Alias "%s" already names another scenario.', $normalized));
        }

        if (null === $existing) {
            $this->entityManager->persist(new ScenarioAlias($scenario, $normalized));
        } else {
            $existing->setAlias($normalized);
        }

        return $normalized;
    }

    private function findEntityFor(Scenario $scenario): ?ScenarioAlias
    {
        return $this->entityManager->getRepository(ScenarioAlias::class)->findOneBy(['scenario' => $scenario]);
    }
}
