<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

// DatabaseTestCase truncates the shared test database before every test.
// Serialize separate PHPUnit processes until worker-specific databases exist.
$testSuiteLock = fopen(sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fgcnotepad-phpunit.lock', 'c');
if (false === $testSuiteLock || !flock($testSuiteLock, LOCK_EX)) {
    throw new RuntimeException('Unable to acquire the FGCNotepad PHPUnit lock.');
}

register_shutdown_function(static function () use ($testSuiteLock): void {
    flock($testSuiteLock, LOCK_UN);
    fclose($testSuiteLock);
});

if (file_exists(dirname(__DIR__).'/config/bootstrap.php')) {
    require dirname(__DIR__).'/config/bootstrap.php';
} elseif (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
}
