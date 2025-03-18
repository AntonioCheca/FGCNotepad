<?php declare(strict_types=1);

namespace App\Service;

class PostComponentExtractor
{
    public function extractComponentIds(array $jsonBody): array
    {
        $ids = [];

        $this->recursiveSearch($jsonBody, $ids);

        return array_unique($ids); // Avoid duplicate IDs
    }

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
