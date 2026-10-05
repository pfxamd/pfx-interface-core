import { buildConsumer } from './lib.mjs';

const profiles = [
  'examples/validation/marketing/profile.json',
  'examples/validation/dashboard/profile.json',
];

for (const profile of profiles) {
  const result = await buildConsumer(profile);
  if (result.report.missingReferences.length > 0) {
    throw new Error(
      `${result.profile.id} references missing PFx variables: ${result.report.missingReferences.join(', ')}`,
    );
  }
  console.log(
    `${result.profile.id}: ${result.report.tokenCount} tokens, ${result.report.cssVariableCount} CSS variables, ${result.report.projectVariableReferenceCount} consumed`,
  );
}
