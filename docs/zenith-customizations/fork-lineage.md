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

# Fork lineage

## Verified baseline

| Reference | Commit | Date | Meaning |
| --- | --- | --- | --- |
| Apache Superset `4.1.3` | `da48584012622619378ad18d2500ee413ccbc968` | 26 June 2025 | Last pure-upstream release commit in this repository before Fynd changes. Use this as the customization baseline. |
| First Fynd-specific commit | `9300fec82a0996f52a20197fd437c1eb44d32fbc` | 22 August 2025 | Fork setup commit, titled `sub mod 4.1.1 set up`. The subject is not a reliable version marker; ancestry identifies 4.1.3 as the baseline. |
| Audited Zenith tip | `96898a6a19aedc4016347f0fd5fefa7632f78771` | 3 June 2026 commit date | `main` and `ZEN-138` both resolved to this commit during the 7 August 2026 audit. |

The merge-base between the audited Fynd branch and live Apache `master` was
`5b79752e5d774a9a6fd6b9c3caf26a83bfcc52ca`, an upstream commit from 19 July
2024. That is useful for ancestry, but it is not the right feature-comparison
baseline because the Fynd history includes later upstream release commits. Use
the Apache 4.1.3 tag for customization analysis.

## Size of the divergence

From Apache 4.1.3 to the audited Zenith tip:

- 311 total commits, including merges.
- 179 non-merge commits.
- 300 net changed files.
- 36,014 insertions and 11,007 deletions across the repository.
- 214 changed frontend files with 34,991 insertions and 6,870 deletions.
- Most upstream `.github` workflows, templates, Dependabot configuration,
  security guidance, and `CODEOWNERS` were removed from this branch.

The lockfile accounts for substantial line churn, so raw insertion totals must
not be treated as product-code size.

## Why author-email filtering is unsafe

There is no reliable “last non-Fynd email” boundary. Fynd contributors used a
mix of `@gofynd.com`, personal, noreply, and other identities, while upstream
history also contains varied domains. Determine ownership through ancestry,
changed paths, PR context, and code behavior—not email-domain heuristics.

## Reproducible queries

Run from the repository root:

```bash
git rev-parse main ZEN-138
git log -1 --format='%H %ad %an <%ae> %s' da48584012622619378ad18d2500ee413ccbc968
git log --reverse --no-merges --format='%H %ad %an <%ae> %s' \
  --date=short da48584012622619378ad18d2500ee413ccbc968..HEAD
git diff --stat da48584012622619378ad18d2500ee413ccbc968..HEAD
git diff --name-status da48584012622619378ad18d2500ee413ccbc968..HEAD
```

When comparing with the latest Apache branch, fetch or query the authoritative
Apache remote first. A locally named `master` branch may only be a historical
snapshot.
