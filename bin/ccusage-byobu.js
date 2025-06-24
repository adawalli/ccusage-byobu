#!/usr/bin/env node

import { main } from '../lib/index.js';

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
