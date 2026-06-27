<?php declare(strict_types=1);

namespace App\Tests\Service\ReplayStorage;

use App\Service\ReplayStorage\LocalVideoStorage;
use PHPUnit\Framework\TestCase;

final class LocalVideoStorageTest extends TestCase
{
    private string $rootDirectory;
    private string $sourcePath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rootDirectory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fgc-replay-storage-' . bin2hex(random_bytes(6));
        $sourcePath = tempnam(sys_get_temp_dir(), 'fgc-video-source-');
        self::assertIsString($sourcePath);
        $this->sourcePath = $sourcePath;
        file_put_contents($this->sourcePath, 'video-bytes');
    }

    protected function tearDown(): void
    {
        if (is_file($this->sourcePath)) {
            unlink($this->sourcePath);
        }

        $this->removeDirectory($this->rootDirectory);

        parent::tearDown();
    }

    public function testItStoresVideoUnderRelativeKey(): void
    {
        $storage = new LocalVideoStorage($this->rootDirectory);

        $storedObject = $storage->store('replays/user-1/video-1/original.mp4', $this->sourcePath, 'video/mp4');

        self::assertSame('replays/user-1/video-1/original.mp4', $storedObject->getStorageKey());
        self::assertSame('video/mp4', $storedObject->getMimeType());
        self::assertSame(11, $storedObject->getSizeBytes());
        self::assertTrue($storage->exists('replays/user-1/video-1/original.mp4'));
        self::assertSame('video-bytes', file_get_contents($storage->resolvePath('replays/user-1/video-1/original.mp4')));
    }

    public function testItDeletesStoredVideo(): void
    {
        $storage = new LocalVideoStorage($this->rootDirectory);
        $storage->store('clips/user-1/clip-1.mp4', $this->sourcePath, 'video/mp4');

        $storage->delete('clips/user-1/clip-1.mp4');

        self::assertFalse($storage->exists('clips/user-1/clip-1.mp4'));
    }

    /**
     * @dataProvider invalidStorageKeyProvider
     */
    public function testItRejectsUnsafeStorageKeys(string $storageKey): void
    {
        $storage = new LocalVideoStorage($this->rootDirectory);

        $this->expectException(\InvalidArgumentException::class);

        $storage->store($storageKey, $this->sourcePath, 'video/mp4');
    }

    /**
     * @return iterable<string, array{string}>
     */
    public function invalidStorageKeyProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'parent-prefix' => ['../outside.mp4'];
        yield 'parent-middle' => ['replays/../outside.mp4'];
        yield 'unix-absolute' => ['/outside.mp4'];
        yield 'windows-rooted' => ['\\outside.mp4'];
        yield 'windows-drive' => ['C:/outside.mp4'];
        yield 'unsupported-character' => ['replays/user/video 1.mp4'];
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        $items = scandir($directory);
        if (false === $items) {
            return;
        }

        foreach ($items as $item) {
            if ('.' === $item || '..' === $item) {
                continue;
            }

            $path = $directory . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                $this->removeDirectory($path);
                continue;
            }

            unlink($path);
        }

        rmdir($directory);
    }
}
