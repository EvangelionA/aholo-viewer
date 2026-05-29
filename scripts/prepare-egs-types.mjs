import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getPnpmCommand, runCommandOrExit, workspaceRoot } from './package-utils.mjs';

const rootDir = workspaceRoot;
const egsRoot = join(rootDir, 'external/egs-core');

if (process.env.AHOLO_SKIP_EGS_TYPES === '1') {
    console.log('[egs-types] Skipping EGS type preparation because AHOLO_SKIP_EGS_TYPES=1.');
    process.exit(0);
}

runCommandOrExit(process.execPath, [join(rootDir, 'scripts/ensure-submodules.mjs')], {
    cwd: rootDir,
    label: 'node scripts/ensure-submodules.mjs',
});
ensureEgsInstall();

runCommandOrExit(getPnpmCommand(), ['run', '--filter=!@internal/*', '-r', '--if-present', 'build:types:release'], {
    cwd: egsRoot,
    label: 'pnpm run --filter=!@internal/* -r --if-present build:types:release',
    shell: process.platform === 'win32',
});

console.log('[egs-types] Ready.');

function ensureEgsInstall() {
    const requiredFiles = [
        join(egsRoot, 'node_modules/@internal/tsconfig/index.json'),
        join(egsRoot, 'node_modules/typescript/lib/tsc.js'),
    ];

    if (requiredFiles.every(file => existsSync(file))) {
        return;
    }

    console.log('[egs-types] Installing EGS build dependencies from external/egs-core/pnpm-lock.yaml.');
    runCommandOrExit(getPnpmCommand(), ['install', '--frozen-lockfile', '--ignore-scripts'], {
        cwd: egsRoot,
        label: 'pnpm install --frozen-lockfile --ignore-scripts',
        shell: process.platform === 'win32',
    });
}
