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

# Zenith customization documentation

This directory documents the behavior added by Fynd Intelligence on top of
Apache Superset 4.1.3. The inventory was verified against commit
`96898a6a19aedc4016347f0fd5fefa7632f78771` on 7 August 2026.

## Documents

- [Fork lineage](fork-lineage.md): the upstream baseline, fork point, current
  branch state, and reproducible Git queries.
- [Feature inventory](feature-inventory.md): current major and minor
  customizations, their implementation paths, and superseded work.
- [Runtime integrations](runtime-integrations.md): data flows, environment
  variables, trust boundaries, and known operational risks.
- [Testing and coverage](testing-and-coverage.md): test commands, exact current
  and historical coverage, and the present quality-gate gap.
- [Maintenance guide](maintenance-guide.md): how to change the fork without
  losing traceability or widening the upstream divergence unnecessarily.

## Source-of-truth order

Use this order when sources disagree:

1. Current executable code and configuration.
2. Tests that execute the real implementation.
3. This documentation set.
4. Historical implementation notes and commit subjects.
5. Upstream Apache documentation for unchanged behavior only.

The root [timezone explanation](../../TIMEZONE_CHANGES_EXPLANATION.md) and
[icon feature summary](../../ICON_FEATURE_SUMMARY.md) are retained as historical
notes. They contain implementation-era claims and are not authoritative proof
of current behavior, coverage, accessibility, or production readiness.

## Scope terminology

- **Current** means the implementation exists at the audited commit.
- **Runtime-dependent** means code exists, but activation depends on feature
  flags, environment variables, embedding context, permissions, or external
  services.
- **Partially verified** means focused tests exist but the complete frontend
  suite is not green.
- **Historical** means a commit or document records work that is no longer the
  current implementation.

This repository is a customized BI frontend used by Fynd Intelligence. It is
distinct from the public Zenith recommendations product surface.
