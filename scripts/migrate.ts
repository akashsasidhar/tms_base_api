/// <reference types="node" />
import { execSync } from 'child_process';
import { resolve } from 'path';
import { register } from 'ts-node';

// Register ts-node for TypeScript support first
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'ES2022',
    esModuleInterop: true,
    skipLibCheck: true,
    resolveJsonModule: true,
  },
});

// Get project root directory
const projectRoot = resolve(__dirname || process.cwd(), '..');

// Run sequelize-cli migrate
const args = process.argv.slice(2);
const command = args[0] || 'db:migrate';

// Use node to run sequelize-cli to avoid path issues
const nodePath = process.execPath;
const sequelizeCliJs = resolve(projectRoot, 'node_modules/sequelize-cli/lib/sequelize');

try {
  execSync(`"${nodePath}" "${sequelizeCliJs}" ${command} ${args.slice(1).join(' ')}`, {
    stdio: 'inherit',
    cwd: projectRoot,
    env: {
      ...process.env,
      TS_NODE_PROJECT: resolve(projectRoot, 'tsconfig.json'),
    },
    shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
  });
} catch (error) {
  process.exit(1);
}
