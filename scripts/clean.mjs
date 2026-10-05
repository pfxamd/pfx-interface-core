import { rm } from 'node:fs/promises';

await Promise.all([
  rm(new URL('../dist/', import.meta.url), { recursive: true, force: true }),
  rm(new URL('../examples/basic/generated/', import.meta.url), { recursive: true, force: true }),
  rm(new URL('../examples/validation/marketing/generated/', import.meta.url), { recursive: true, force: true }),
  rm(new URL('../examples/validation/dashboard/generated/', import.meta.url), { recursive: true, force: true }),
]);
