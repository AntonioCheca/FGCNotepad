<?php declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'blockstring_adaptation', schema: 'sf6')]
#[ORM\Index(name: 'idx_blockstring_adaptation_source', columns: ['source_sequence_id'])]
class BlockstringAdaptation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'source_sequence_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BlockstringSequence $sourceSequence = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'target_sequence_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?BlockstringSequence $targetSequence = null;

    #[ORM\Column(name: 'actor_side', type: Types::STRING, length: 24)]
    private string $actorSide = 'attacker';

    #[ORM\Column(type: Types::TEXT)]
    private string $explanation = '';
}
