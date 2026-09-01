<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

# Maintenance and contribution guide

## Before changing code

1. Read the [feature inventory](feature-inventory.md) and
   [runtime integrations](runtime-integrations.md).
2. Compare the target file with Apache 4.1.3 before assuming behavior is
   upstream or Fynd-specific.
3. Identify every external consumer: embedded SDK, Intelligence API, Boltic
   workflow, Sentry, or Stelios.
4. State the expected behavior and failure mode before implementing the change.
5. Add a focused test that executes the real subject under test.

## Change boundaries

- Prefer a narrow adapter or component over editing many upstream files.
- Keep build-time configuration in one documented path.
- Do not add hard-coded service URLs, write keys, tenant IDs, chart IDs, or
  thresholds to production code.
- Fail closed when required integration configuration is absent.
- Treat URL parameters as untrusted input and document every supported name.
- Restrict cross-window messages to an agreed origin and version their payload
  contract when consumers depend on it.
- Minimize personal, filter, and tenancy data sent to telemetry or AI services.

## Verification

For a frontend change, run the narrow test first, then the affected package or
directory, then the complete checks required by the CR:

```bash
cd superset-frontend
npm test -- --runInBand path/to/changed.test.ts
npm test -- --runInBand
npm run cover -- --runInBand
npm run lint
```

Record the exact commit and command. A coverage report is invalid if tests
failed, the process exit code was ignored, or the line denominator is zero.

## Documentation maintenance

Update this collection in the same change when any of the following changes:

- Feature behavior, activation conditions, or supported URL parameters.
- Environment variables, external endpoints, or event payloads.
- Upstream baseline or merge/rebase strategy.
- Test command, coverage scope, or threshold.
- A feature is removed, reverted, or superseded.

Put durable behavior here. Keep ticket timelines, rollout evidence, screenshots,
and one-time investigation notes in the relevant change request rather than in
the feature inventory.

## Commit and review hygiene

The current history contains repeated debug commits, vague subjects, reverts,
and large merge sequences. Future changes should use one clear ticket-linked
subject per coherent change and remove temporary logging before review.

Reviewers should ask:

- Is this current behavior or an assumption based on a commit title?
- Does the test fail when the implementation is broken?
- Is the real subject under test, rather than a mock of it?
- Does the change widen data sharing, PII exposure, or an external dependency?
- Does it create another fork-only modification where an extension point would
  be easier to maintain across upstream upgrades?
- Are rollback, observability, and downstream consumer coordination explicit?

## Ownership record

The audited branch does not contain a current Fynd `CODEOWNERS` file. Until one
is restored, ownership must be explicit in the change request for these areas:

- Superset fork/upstream sync.
- AI summary API contract.
- Embedded-dashboard/SDK protocol.
- Snapshot email workflow.
- Boltic Streams analytics.
- Sentry/privacy configuration.
- Custom chart plugins and Big Number controls.

Do not infer ownership from the most recent committer or email domain.
