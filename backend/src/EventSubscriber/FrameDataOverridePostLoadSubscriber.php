<?php declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\FrameData;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;

#[AsDoctrineListener(event: Events::postLoad)]
class FrameDataOverridePostLoadSubscriber
{
    public function __construct(private readonly Connection $connection)
    {
    }

    /** @param LifecycleEventArgs<\Doctrine\Persistence\ObjectManager> $args */
    public function postLoad(LifecycleEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof FrameData || null === $entity->getId()) {
            return;
        }

        $rows = $this->connection->fetchAllAssociative(
            'SELECT column_name, override_value FROM sf6.frame_data_override WHERE frame_data_id = :frameDataId',
            ['frameDataId' => $entity->getId()->toRfc4122()]
        );

        $overrides = $this->loadSupplementalOverlay($entity->getId()->toRfc4122());
        foreach ($rows as $row) {
            if (!is_string($row['column_name'])) {
                continue;
            }

            $rawValue = $row['override_value'] ?? null;
            $overrides[$row['column_name']] = is_string($rawValue) ? json_decode($rawValue, true) : $rawValue;
        }

        $entity->applyEffectiveOverrides($overrides);
    }

    /**
     * @return array<string, mixed>
     */
    private function loadSupplementalOverlay(string $frameDataId): array
    {
        $rows = $this->connection->fetchAllAssociative(
            <<<'SQL'
SELECT supplemental.*
FROM sf6.frame_data_supplemental_value supplemental
INNER JOIN sf6.frame_data_import_batch batch ON batch.id = supplemental.import_batch_id
INNER JOIN sf6.move move ON move.id = supplemental.move_id
WHERE move.frame_data_id = :frameDataId
  AND batch.source_type = 'supplemental'
  AND batch.is_active = true
ORDER BY batch.imported_at ASC
SQL,
            ['frameDataId' => $frameDataId]
        );

        $columnMap = [
            'startup' => 'startup',
            'active' => 'active',
            'recovery' => 'recovery',
            'total' => 'total',
            'on_hit' => 'onHit',
            'on_block' => 'onBlock',
            'on_punish_counter' => 'onPunishCounter',
            'move_type' => 'moveType',
            'cancels_to' => 'cancelsTo',
            'damage' => 'damage',
            'scaling' => 'scaling',
            'scaling_start_percent' => 'scalingStartPercent',
            'scaling_immediate_percent' => 'scalingImmediatePercent',
            'scaling_minimum_percent' => 'scalingMinimumPercent',
            'scaling_combo_hits' => 'scalingComboHits',
            'scaling_combo_extra_percent' => 'scalingComboExtraPercent',
            'scaling_multiplier_percent' => 'scalingMultiplierPercent',
            'scaling_parse_status' => 'scalingParseStatus',
            'scaling_parse_note' => 'scalingParseNote',
            'chip_damage' => 'chipDamage',
            'attack_level' => 'attackLevel',
            'on_hit_after_drive_rush' => 'onHitAfterDriveRush',
            'on_block_after_drive_rush' => 'onBlockAfterDriveRush',
            'on_perfect_parry' => 'onPerfectParry',
            'drive_damage_on_hit' => 'driveDamageOnHit',
            'drive_damage_on_block' => 'driveDamageOnBlock',
            'drive_gain' => 'driveGain',
            'on_hit_self_super_meter_gain' => 'onHitSelfSuperMeterGain',
            'on_block_self_super_meter_gain' => 'onBlockSelfSuperMeterGain',
            'on_hit_opponent_super_meter_gain' => 'onHitOpponentSuperMeterGain',
            'on_block_opponent_super_meter_gain' => 'onBlockOpponentSuperMeterGain',
            'hit_confirm_specials_and_supers' => 'hitConfirmSpecialsAndSupers',
            'hit_confirm_target_combos' => 'hitConfirmTargetCombos',
            'juggle_limit' => 'juggleLimit',
            'juggle_increase' => 'juggleIncrease',
            'juggle_start' => 'juggleStart',
            'hitstun' => 'hitstun',
            'blockstun' => 'blockstun',
            'hitstop' => 'hitstop',
            'extra_information' => 'extraInformation',
        ];

        $overlay = [];
        foreach ($rows as $row) {
            foreach ($columnMap as $dbColumn => $propertyName) {
                if (array_key_exists($dbColumn, $row) && null !== $row[$dbColumn]) {
                    $overlay[$propertyName] = $row[$dbColumn];
                }
            }
        }

        return $overlay;
    }
}
