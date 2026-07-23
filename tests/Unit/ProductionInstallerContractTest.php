<?php

declare(strict_types=1);

use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

function productionInstallerContents(string $name): string
{
    return file_get_contents(base_path("scripts/{$name}")) ?: '';
}

it('documents copyable one-line installers for Linux and Windows', function (): void {
    $gettingStarted = file_get_contents(base_path('GETTING_STARTED.md')) ?: '';
    $readme = file_get_contents(base_path('README.md')) ?: '';
    $bashCommand = 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/yukazakiri/koakademy/master/scripts/install.sh)"';
    $powerShellCommand = '& ([scriptblock]::Create((irm https://raw.githubusercontent.com/yukazakiri/koakademy/master/scripts/install.ps1)))';

    expect($gettingStarted)
        ->toContain($bashCommand)
        ->toContain($powerShellCommand)
        ->toContain('local RustFS')
        ->toContain('external S3-compatible service')
        ->and($readme)
        ->toContain($bashCommand)
        ->toContain($powerShellCommand);
});

it('keeps the Bash and PowerShell Swarm contracts aligned', function (): void {
    $bash = productionInstallerContents('install.sh');
    $powerShell = productionInstallerContents('install.ps1');
    $services = [
        'koakademy-app',
        'koakademy-postgres',
        'koakademy-redis',
        'koakademy-gotenberg',
        'koakademy-rustfs',
    ];

    foreach ($services as $service) {
        expect($bash)->toContain($service)
            ->and($powerShell)->toContain($service);
    }

    expect($bash)
        ->toContain('api.github.com/repos/${repository}/tags')
        ->toContain('https://github.com/${repository}/tags.atom')
        ->toContain('--mode replicated-job')
        ->toContain('mode=host')
        ->toContain('docker secret create')
        ->toContain('Swarm is already active; preserving the existing cluster.')
        ->and($powerShell)
        ->toContain('api.github.com/repos/$RepositoryName/tags')
        ->toContain('https://github.com/$RepositoryName/tags.atom')
        ->toContain("'--mode', 'replicated-job'")
        ->toContain('mode=host')
        ->toContain('docker secret create')
        ->toContain('Docker Swarm is already active; preserving the existing cluster.');
});

it('does not use destructive Swarm operations or mutable application images', function (): void {
    $installers = productionInstallerContents('install.sh')."\n".productionInstallerContents('install.ps1');

    expect($installers)
        ->not->toContain('docker swarm leave')
        ->not->toContain("'swarm', 'leave'")
        ->not->toContain('docker network rm')
        ->not->toContain('docker secret rm')
        ->not->toContain('ghcr.io/yukazakiri/koakademy:latest')
        ->not->toContain('rustfs/rustfs:latest')
        ->not->toContain('rustfsadmin');
});

it('parses the Bash installer', function (): void {
    $bash = (new ExecutableFinder)->find('bash');

    if ($bash === null) {
        $this->markTestSkipped('Bash is not available.');
    }

    $process = new Process([$bash, '-n', base_path('scripts/install.sh')], base_path());
    $process->run();

    expect($process->isSuccessful())
        ->toBeTrue($process->getErrorOutput() ?: $process->getOutput());
});

it('smoke tests a fresh and repeated Bash installation without a Docker daemon', function (): void {
    $bash = (new ExecutableFinder)->find('bash');

    if ($bash === null || DIRECTORY_SEPARATOR === '\\') {
        $this->markTestSkipped('The Bash smoke test requires a Unix-like host.');
    }

    $filesystem = new Filesystem;
    $state = storage_path('framework/testing/installer-'.bin2hex(random_bytes(6)));
    $filesystem->mkdir($state);

    $environment = [
        'PATH' => base_path('tests/Fixtures/installer').PATH_SEPARATOR.getenv('PATH'),
        'KOAKADEMY_INSTALLER_TEST_STATE' => $state,
        'KOAKADEMY_APP_URL' => 'http://127.0.0.1:18000',
        'KOAKADEMY_APP_PORT' => '18000',
        'KOAKADEMY_RUSTFS_PORT' => '19000',
        'KOAKADEMY_STORAGE' => 'rustfs',
        'KOAKADEMY_VERSION' => 'v1.9.0',
        'RUSTFS_VERSION' => '1.0.0-beta.10',
    ];

    try {
        $firstRun = new Process([$bash, base_path('scripts/install.sh')], base_path(), $environment);
        $firstRun->setTimeout(30);
        $firstRun->run();

        expect($firstRun->isSuccessful())
            ->toBeTrue($firstRun->getErrorOutput().$firstRun->getOutput());

        $log = file_get_contents($state.'/docker.log') ?: '';
        expect($log)
            ->toContain('volume create --label com.koakademy.managed-by=swarm-installer koakademy-postgres-data')
            ->toContain('volume create --label com.koakademy.managed-by=swarm-installer koakademy-rustfs-data')
            ->toContain('service create --name koakademy-postgres')
            ->toContain('service create --name koakademy-redis')
            ->toContain('service create --name koakademy-gotenberg')
            ->toContain('service create --name koakademy-rustfs')
            ->toContain('service create --name koakademy-app')
            ->toContain('published=18000,target=8000,mode=host')
            ->toContain('published=19000,target=9000,mode=host')
            ->not->toContain('swarm init');

        $createsBeforeRepeat = mb_substr_count($log, 'service create --name');
        $secondRun = new Process([$bash, base_path('scripts/install.sh')], base_path(), $environment);
        $secondRun->setTimeout(30);
        $secondRun->run();

        expect($secondRun->isSuccessful())
            ->toBeTrue($secondRun->getErrorOutput().$secondRun->getOutput())
            ->and($secondRun->getOutput())->toContain('KoAkademy is already installed.');

        $repeatedLog = file_get_contents($state.'/docker.log') ?: '';
        expect(mb_substr_count($repeatedLog, 'service create --name'))->toBe($createsBeforeRepeat);
    } finally {
        $filesystem->remove($state);
    }
});
