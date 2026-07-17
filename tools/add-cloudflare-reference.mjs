#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prepends the Cloudflare protocol reference to a types.d.ts file.
 * Usage: node tools/add-cloudflare-reference.mjs <path-to-types.d.ts>
 */
import {readFileSync, writeFileSync} from 'fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: add-cloudflare-reference.mjs <types.d.ts>');
  process.exit(1);
}

const reference = '/// <reference path="../cloudflare-protocol.d.ts" />\n';
const content = readFileSync(file, 'utf8');

if (!content.startsWith(reference)) {
  writeFileSync(file, reference + content);
}
