<?php declare(strict_types=1);

namespace App\Service;

use App\Entity\Move;
use App\Repository\MoveRepository;
use App\Util\Enum\MoveType;

final class TurnsGuideService
{
    public function __construct(private readonly MoveRepository $moveRepository)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function buildGuide(): array
    {
        return [
            'title' => 'Beginner Turns Heuristics',
            'heuristics' => $this->buildHeuristics(),
            'sections' => [
                'plusNormals' => [
                    'title' => 'Positive normals and unique moves',
                    'status' => 'ready',
                    'moves' => $this->serializeMoves($this->withoutJumpOrAirNormals($this->moveRepository->findPlusOnBlockMovesByType(MoveType::NORMAL->value))),
                ],
                'plusSpecials' => [
                    'title' => 'Always positive specials',
                    'status' => 'ready',
                    'moves' => $this->serializeMoves($this->moveRepository->findPlusOnBlockMovesByType(MoveType::SPECIAL->value)),
                ],
                'spacedNormals' => [
                    'title' => 'Normals that become positive when spaced well',
                    'status' => 'planned_data_column',
                    'moves' => [],
                ],
                'spacedSpecials' => [
                    'title' => 'Specials that become positive when spaced well',
                    'status' => 'planned_data_column',
                    'moves' => [],
                ],
            ],
        ];
    }

    /**
     * @return list<array{title:string,body:string,tone:string}>
     */
    private function buildHeuristics(): array
    {
        return [
            ['title' => 'Blocked jump-ins', 'body' => 'If you block a jump-in, assume you are minus.', 'tone' => 'danger'],
            ['title' => 'Oki', 'body' => 'Unless you know the setup, assume it is not your turn during oki.', 'tone' => 'danger'],
            ['title' => 'Some plus buttons', 'body' => 'Some normals and unique moves are naturally plus. Check the list before challenging.', 'tone' => 'warning'],
            ['title' => 'Some plus specials', 'body' => 'Some specials are always plus on block. Only always-plus specials are listed here.', 'tone' => 'warning'],
            ['title' => 'Some well spaced normals', 'body' => 'Some normals are only plus when blocked at the right range. This list is reserved for a future data column.', 'tone' => 'info'],
            ['title' => 'Some well spaced specials', 'body' => 'Some specials are only plus when blocked at the right range. This list is reserved for a future data column.', 'tone' => 'info'],
            ['title' => 'Drive Rush pressure', 'body' => 'If you block Drive Rush pressure, assume you are minus.', 'tone' => 'danger'],
            ['title' => 'Blocked lights', 'body' => 'A blocked light usually does not mean you are minus, but lights can frame-trap. After three blocked lights, assume it is your turn again.', 'tone' => 'info'],
            ['title' => 'Blocked dive-kicks low', 'body' => 'As a rule of thumb, blocking dive-kicks above the waist leaves you plus; blocking them lower leaves you minus.', 'tone' => 'warning'],
            ['title' => 'Both players jumping', 'body' => 'If both players jump, it is usually not the turn of the player who lands later.', 'tone' => 'info'],
        ];
    }

    /**
     * @param list<Move> $moves
     *
     * @return list<Move>
     */
    private function withoutJumpOrAirNormals(array $moves): array
    {
        return array_values(array_filter($moves, static fn (Move $move): bool => !self::isJumpOrAirNormalNotation($move->getNumpadNotation())));
    }

    private static function isJumpOrAirNormalNotation(string $notation): bool
    {
        return preg_match('/^\s*j\.|(?:^|[^\d])(?:7|8|9)\s*(?=or\b|>|[LMH][PK]\b|$)/i', $notation) === 1;
    }

    /**
     * @param list<Move> $moves
     *
     * @return list<array<string, mixed>>
     */
    private function serializeMoves(array $moves): array
    {
        return array_map(static function (Move $move): array {
            $frameData = $move->getFrameData();

            return [
                'id' => $move->getId()?->toRfc4122(),
                'character' => [
                    'id' => $move->getCharacter()->getId()?->toRfc4122(),
                    'name' => $move->getCharacter()->getName(),
                ],
                'numpadNotation' => $move->getNumpadNotation(),
                'moveType' => $frameData?->getMoveType(),
                'advantageOnBlock' => $frameData?->getOnBlock(),
            ];
        }, $moves);
    }
}
