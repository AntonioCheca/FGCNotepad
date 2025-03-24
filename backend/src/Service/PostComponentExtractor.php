<?php declare(strict_types=1);

namespace App\Service;

class PostComponentExtractor
{
    /**
     * @param array<mixed> $jsonBody
     * @return array<string>
     */
    public function extractComponentIds(array $jsonBody): array
    {
        $ids = [];

        $this->recursiveSearch($jsonBody, $ids);

        return array_unique($ids); // Avoid duplicate IDs
    }

    /**
     * @param array<mixed> $node
     * @param array<string> $ids
     */
    private function recursiveSearch(array $node, array &$ids): void
    {
        if (isset($node['idForComponent']) && is_string($node['idForComponent'])) {
            $ids[] = $node['idForComponent'];
        }

        foreach ($node as $key => $value) {
            if (is_array($value)) {
                $this->recursiveSearch($value, $ids);
            }
        }
    }
}
