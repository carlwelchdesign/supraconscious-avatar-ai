#!/usr/bin/env node
// Lightweight launcher that ensures Yarn 4 is used even when CI invokes Yarn 1.
// Do not delegate to the ambient `yarn` binary: Vercel may provide Yarn Classic,
// which cannot resolve this repo's `workspace:*` dependencies.
const { spawnSync } = require('child_process')

const args = process.argv.slice(2)

function run(cmd, cmdArgs, options = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit' })
  if (r.error && !options.optional) {
    console.error(r.error.message)
    process.exit(1)
  }
  if (typeof r.status === 'number') process.exit(r.status)
  if (!options.optional) process.exit(1)
  return r
}

const corepack = spawnSync('corepack', ['--version'], { stdio: 'ignore' })
if (corepack.status === 0) {
  run('corepack', ['yarn@4.6.0', ...args])
}

console.error('Corepack is required to run Yarn 4. Enable Corepack or run with Node.js 18+.')
process.exit(1)
