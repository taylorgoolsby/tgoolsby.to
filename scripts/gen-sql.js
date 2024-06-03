// @flow

// This script will run `node src/backend/src/project/places/schema/generate-sql.mjs`

import { execSync } from 'child_process';

execSync('node src/backend/src/project/places/schema/generate-sql.mjs', { stdio: 'inherit' });
