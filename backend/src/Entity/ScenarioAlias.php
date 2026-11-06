<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * A readable, environment-independent name for a scenario (for example "juri-214mk-main-oki"), so research articles
 * and resource grid exports can point at it without a database id. Kept out of the scenario table so setting it
 * does not count as an edit of the scenario.
 */
#[ORM\Table(name: 'scenario_alias', schema: 'sf6')]
#[ORM\UniqueConstraint(name: 'uniq_scenario_alias_scenario', columns: ['scenario_id'])]
#[ORM\UniqueConstraint(name: 'uniq_scenario_alias_alias', columns: ['alias'])]
#[ORM\Entity]
class ScenarioAlias
{
    public const MAX_LENGTH = 80;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Scenario::class)]
    #[ORM\JoinColumn(name: 'scenario_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Scenario $scenario;

    #[ORM\Column(name: 'alias', type: Types::STRING, length: self::MAX_LENGTH)]
    private string $alias;

    public function __construct(Scenario $scenario, string $alias)
    {
        $this->scenario = $scenario;
        $this->alias = $alias;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getScenario(): Scenario
    {
        return $this->scenario;
    }

    public function getAlias(): string
    {
        return $this->alias;
    }

    public function setAlias(string $alias): static
    {
        $this->alias = $alias;

        return $this;
    }
}
