// For each folder that matches src/web-*, run cp -r build/web-*/dist artifact/backend/src/web-*/dist.

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const webProjects = fs.readdirSync('src').filter((f) => f.startsWith('web-'))

for (const project of webProjects) {
  console.log(`Installing ${project}...`)
  // Make sure console output is shown in real time:
  execSync(
    `cp -r build/${project}/dist artifact/backend/src/${project}/dist`, {
    cwd: path.join('src', project),
    stdio: 'inherit',
  })
}
