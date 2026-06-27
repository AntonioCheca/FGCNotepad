<?php declare(strict_types=1);

namespace App\Service;

final class ReplayAnnotationExportResult
{
    private int $clipsCreated = 0;
    private int $tasksCreated = 0;
    private int $studyCardsCreated = 0;
    private int $skipped = 0;
    private int $failed = 0;

    /**
     * @var list<array{id:string,message:string}>
     */
    private array $errors = [];

    public function addClipCreated(): void
    {
        ++$this->clipsCreated;
    }

    public function addTaskCreated(): void
    {
        ++$this->tasksCreated;
    }

    public function addStudyCardCreated(): void
    {
        ++$this->studyCardsCreated;
    }

    public function addSkipped(): void
    {
        ++$this->skipped;
    }

    public function addFailure(string $id, string $message): void
    {
        ++$this->failed;
        $this->errors[] = ['id' => $id, 'message' => $message];
    }

    /**
     * @return array{clipsCreated:int,tasksCreated:int,studyCardsCreated:int,skipped:int,failed:int,errors:list<array{id:string,message:string}>}
     */
    public function toArray(): array
    {
        return [
            'clipsCreated' => $this->clipsCreated,
            'tasksCreated' => $this->tasksCreated,
            'studyCardsCreated' => $this->studyCardsCreated,
            'skipped' => $this->skipped,
            'failed' => $this->failed,
            'errors' => $this->errors,
        ];
    }
}
