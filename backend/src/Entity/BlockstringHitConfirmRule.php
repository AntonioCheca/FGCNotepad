<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_hit_confirm_rule', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_hit_confirm_plan', columns: ['offense_plan_id'])]
class BlockstringHitConfirmRule
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'offense_plan_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringOffensePlan $offensePlan = null;

    #[ORM\Column(name: 'step_ordinal')]
    private int $stepOrdinal = 1;

    #[ORM\Column(name: 'confirmable', options: ['default' => true])]
    private bool $confirmable = true;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'combo_sequence_id', referencedColumnName: 'id', nullable: true)]
    private ?ComboSequences $comboSequence = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $note = null;
}
