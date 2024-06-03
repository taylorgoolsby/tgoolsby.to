// generateSecret.js

import uuid from 'uuid-with-v6';

export function generateSecret() {
  return uuid.v6();
}
