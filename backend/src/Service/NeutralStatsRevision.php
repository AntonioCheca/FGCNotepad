<?php declare(strict_types=1);

namespace App\Service;

use Psr\Cache\CacheItemPoolInterface;

/** Global neutral data revision: bumping it makes every cached neutral stats response unreachable. */
final class NeutralStatsRevision
{
    private const CACHE_KEY = 'neutral_stats.revision';

    public function __construct(private readonly CacheItemPoolInterface $cache)
    {
    }

    public function current(): string
    {
        $item = $this->cache->getItem(self::CACHE_KEY);
        if ($item->isHit() && is_string($item->get())) {
            return $item->get();
        }

        return $this->bump();
    }

    public function bump(): string
    {
        $revision = bin2hex(random_bytes(8));
        $this->cache->save($this->cache->getItem(self::CACHE_KEY)->set($revision));

        return $revision;
    }
}
