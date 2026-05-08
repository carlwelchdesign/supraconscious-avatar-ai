#!/usr/bin/env node
// Lightweight launcher that ensures Yarn 4 is available on CI without Corepack.
// It prefers an existing `yarn` binary; otherwise falls back to `npx -y yarn@stable`.
const { spawnSync } = require('child_process')

const args = process.argv.slice(2)

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit' })
  process.exit(r.status || 0)
}

// Try native yarn first
try {
  const which = spawnSync('yarn', ['-v'], { stdio: 'ignore' })
  if (which.status === 0) {
    run('yarn', args)
  }
} catch (e) {
  // ignore
}

// Fallback to npx fetching Yarn 4.x
run('npx', ['-y', 'yarn@stable', ...args])
