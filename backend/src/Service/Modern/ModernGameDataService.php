<?php declare(strict_types=1);

namespace App\Service\Modern;

use App\Entity\Character;
use App\Entity\CharacterModernAutoCombo;
use App\Entity\ComboSequences;
use App\Entity\Move;
use App\Repository\CharacterModernAutoComboRepository;
use App\Util\Enum\ModernAutoComboStrength;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Edits the Modern rules stored per character (move availability/notation and auto combos). Every edit re-runs
 * Modern validation of that character's combos so their stored legality and damage never go stale.
 */
final class ModernGameDataService
{
    private const NOTATION_MAX_LENGTH = 64;

    public function __construct(
        private readonly CharacterModernAutoComboRepository $autoComboRepository,
        private readonly ModernComboRevalidationService $revalidationService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /** @return array{availableOnModern:bool,modernMaxNotation:string|null,modernSimpleNotation:string|null,modernSimpleDamagePercent:int|null} */
    public function toApi(Move $move): array
    {
        return [
            'availableOnModern' => $move->isAvailableOnModern(),
            'modernMaxNotation' => $move->getModernMaxNotation(),
            'modernSimpleNotation' => $move->getModernSimpleNotation(),
            'modernSimpleDamagePercent' => $move->getModernSimpleDamagePercent(),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array{availableOnModern:bool,modernMaxNotation:string|null,modernSimpleNotation:string|null,modernSimpleDamagePercent:int|null}
     */
    public function updateMove(Move $move, array $payload): array
    {
        if (!is_bool($payload['availableOnModern'] ?? null)) {
            throw new BadRequestHttpException('availableOnModern must be a boolean.');
        }

        $move
            ->setAvailableOnModern($payload['availableOnModern'])
            ->setModernMaxNotation($this->notation($payload, 'modernMaxNotation'))
            ->setModernSimpleNotation($this->notation($payload, 'modernSimpleNotation'))
            ->setModernSimpleDamagePercent($this->percent($payload['modernSimpleDamagePercent'] ?? null));
        $this->entityManager->flush();
        $result = $this->toApi($move);

        $this->revalidationService->revalidate((string) $move->getCharacter()->getId());

        return $result;
    }

    /** @return array<string, array{comboId:int,name:string}|null> */
    public function autoCombos(Character $character): array
    {
        $byStrength = [];
        foreach (ModernAutoComboStrength::cases() as $strength) {
            $byStrength[$strength->value] = null;
        }
        foreach ($this->autoComboRepository->findByCharacter($character) as $autoCombo) {
            $byStrength[$autoCombo->getStrength()->value] = [
                'comboId' => (int) $autoCombo->getCombo()->getId(),
                'name' => (string) $autoCombo->getCombo()->getName(),
            ];
        }

        return $byStrength;
    }

    /** @return array<string, array{comboId:int,name:string}|null> */
    public function setAutoCombo(Character $character, ModernAutoComboStrength $strength, ?ComboSequences $combo): array
    {
        if (null !== $combo && ('leaf' === $combo->getType()?->getName() || $combo->getCharacter()?->getId()?->toRfc4122() !== $character->getId()?->toRfc4122())) {
            throw new BadRequestHttpException('The auto combo must be a combo of this character.');
        }

        $existing = $this->autoComboRepository->findOneByCharacterAndStrength($character, $strength);
        if (null === $combo && null !== $existing) {
            $this->entityManager->remove($existing);
        } elseif (null !== $combo && null !== $existing) {
            $existing->setCombo($combo);
        } elseif (null !== $combo) {
            $this->entityManager->persist(new CharacterModernAutoCombo($character, $strength, $combo));
        }
        $this->entityManager->flush();
        $result = $this->autoCombos($character);

        $this->revalidationService->revalidate((string) $character->getId());

        return $result;
    }

    /** @param array<string, mixed> $payload */
    private function notation(array $payload, string $field): ?string
    {
        $value = $payload[$field] ?? null;
        if (null !== $value && !is_string($value)) {
            throw new BadRequestHttpException(sprintf('%s must be a string or null.', $field));
        }
        $trimmed = null === $value ? '' : trim($value);
        if (mb_strlen($trimmed) > self::NOTATION_MAX_LENGTH) {
            throw new BadRequestHttpException(sprintf('%s must be at most %d characters.', $field, self::NOTATION_MAX_LENGTH));
        }
        if (1 === preg_match('/[\s,]/', $trimmed)) {
            throw new BadRequestHttpException(sprintf('%s must not contain spaces or commas.', $field));
        }

        return '' === $trimmed ? null : $trimmed;
    }

    private function percent(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_int($value) || $value < 0 || $value > 100) {
            throw new BadRequestHttpException('modernSimpleDamagePercent must be an integer from 0 to 100, or null.');
        }

        return $value;
    }
}
