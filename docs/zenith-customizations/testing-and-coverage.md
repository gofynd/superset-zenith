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

# Testing and coverage baseline

## Test architecture

The frontend continues to use Jest 29, not Vitest. The main commands in
`superset-frontend/package.json` are:

```bash
npm test -- --runInBand
npm run cover -- --runInBand
npm run lint
```

`npm run cover` collects JavaScript and TypeScript coverage from `src/`,
`packages/*/src/`, and `plugins/*/src/`. Stories and the UI demo package are
excluded. Coverage output, dependencies, public assets, temporary paths, and
distribution folders are ignored.

The normal coverage command has no global threshold. `npm run core:cover`
requires 100%, but only for a narrower `packages/**/src/**/*.{js,ts}` slice; it
does not prove whole-frontend coverage.

## Audited results

Fresh results recorded on 7 August 2026:

| Metric | Apache 4.1.3 baseline | Zenith tip | Change |
| --- | ---: | ---: | ---: |
| Lines | 23,635 / 37,590 = 62.87% | 24,967 / 40,501 = 61.64% | -1.23 percentage points |
| Statements | 24,176 / 38,641 = 62.56% | 25,548 / 41,651 = 61.33% | -1.23 percentage points |
| Functions | 7,089 / 11,813 = 60.01% | 7,239 / 12,259 = 59.05% | -0.96 percentage points |
| Branches | 14,192 / 25,022 = 56.71% | 15,542 / 28,169 = 55.17% | -1.54 percentage points |

Zenith added 1,332 covered lines, but the executable-line denominator grew by
2,911. Uncovered lines increased from 13,955 to 15,534.

The historical Apache 4.1.3 run completed with 691 passing suites, 2 skipped
suites, 4,537 passing tests, and 32 skipped tests. The current Zenith run had:

- 698 passing suites and 2 skipped suites.
- 36 failing suites.
- 4,914 passing, 40 skipped, and 144 failing tests.

Therefore, 61.64% is a real non-zero coverage measurement, but the current
suite is not a passing quality gate and the repository is not near a 95%
whole-frontend line threshold.

## Historical-run methodology

The Apache baseline was reconstructed in a temporary archive rather than by
mutating the active worktree. The historical lockfile did not install cleanly
with `npm ci`, so dependencies were resolved with `npm install` for that audit.

The first temporary run reported `0/0` because the repository's Jest config
ignores paths containing `tmp/`, and the archive lived under a temporary path.
That result was discarded. The rerun removed only that path collision while
retaining the source exclusions. This is why non-zero numerator and denominator
checks are mandatory when automating historical comparisons.

## Coverage and CR expectations

- Do not commit generated coverage as proof that tests passed.
- Require the test process exit code to be zero.
- Require `lines.total > 0`; `0/0` is invalid evidence.
- Enforce the agreed 95% threshold on the exact CR scope if that is the release
  rule. A non-zero denominator alone does not enforce 95%.
- Report the numerator, denominator, percentage, command, commit, and failed
  test count together.
- Do not improve percentages by excluding production logic or mocking the
  subject under test.

## Current focused test strengths

The strongest custom test clusters are:

- Date-filter parsing, formatting, timezone consistency, visibility, and the
  revamped picker.
- Big Number query construction, transforms, clickable cards, comparison data,
  and renderer behavior.
- Carousel transforms, controls, types, and component rendering.
- Table URL helpers and `ChipButton` rendering.
- AI summary helper/component flows.
- Embedded dashboard readiness aggregation.
- Sentry/core API error logging.
- Per-chart menu and download-control behavior.

Focused tests are useful, but they do not cancel the 36 failing suites in the
full run. Before using this repository as a CR testing benchmark, stabilize the
full Jest run and add an explicit threshold for the intended scope.
