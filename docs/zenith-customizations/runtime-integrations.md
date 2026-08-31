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

# Runtime architecture and integrations

## Frontend startup

`src/preamble.ts` initializes Sentry and Boltic Streams before the React
application mounts. `RootContextProviders.tsx` then adds the Zenith timezone
provider around the existing Superset provider tree. Webpack injects Zenith
configuration as compile-time `process.env` values.

This means changing an integration environment variable generally requires a
frontend rebuild; it is not runtime server configuration.

## Environment variables

| Variable | Consumer | Current behavior when absent |
| --- | --- | --- |
| `AI_SUMMARY_ENDPOINT` | `utils/aiSummary.ts` | Uses a hard-coded Intelligence API endpoint. |
| `BOLTIC_STREAMS_KEY` | Declared in Webpack/env example | The loader currently uses a hard-coded write key instead. |
| `BOLTIC_STREAMS_CHART_TRIGGER_THRESHOLDS` | Declared and logged | The helper currently uses three hard-coded chart thresholds. |
| `ZEN_SENTRY_DSN` | `setup/sentryConfig.ts` | Sentry initialization is skipped. |
| `ZEN_SENTRY_ENVIRONMENT` | `setup/sentryConfig.ts` | Sentry initialization is skipped. |
| `ZEN_SENTRY_RELEASE` | `setup/sentryConfig.ts` | Defaults to `superset@4.1.3`. |
| `ENABLE_DASHBOARD_SNAPSHOT` | Filter action buttons | Enabled unless the value is exactly `false`, so unset means enabled. |
| `SNAPSHOT_EMAIL_WEBHOOK_URL` | Snapshot email action | Uses a hard-coded Boltic workflow URL. |
| `RUN_MANIFEST_LOCAL` | Webpack proxy | Selects the custom local-manifest proxy path. |
| `SUPERSET` | Webpack proxy/local script | Defaults the proxy target to `http://localhost:8088`. |

The reference names are listed in
[`env.sh.example`](../../superset-frontend/env.sh.example). Do not place actual
secrets in that file or commit generated `env.sh` files.

## Integration flows

### AI summary

```text
chart query response
  -> first result set, capped at 200 rows
  -> chart metadata + optional custom system prompt + URL context
  -> credentialed POST to AI_SUMMARY_ENDPOINT
  -> insight string rendered below the chart
```

The endpoint is a data boundary. Treat chart rows, tenancy-related URL
parameters, and prompts as potentially sensitive. `filters` and `timeRange`
currently trigger summary regeneration but are not included in the payload
constructed by `generateSummary`.

### Embedded dashboard status

```text
Redux chart state + active dashboard tab
  -> readiness aggregation
  -> window.__SUPERSET_DASHBOARD_STATUS__
  -> window.parent.postMessage(..., '*')
```

The parent SDK is expected to decide what to do with each update. The current
sender uses wildcard target origin. Any contract change must be coordinated
with the embedding consumer.

### Dashboard snapshot

```text
dashboard DOM
  -> html2canvas
  -> compressed JPEG data URL
  -> browser download OR POST to the email workflow
```

Large dashboards create large in-memory canvas and base64 payloads. Validate
browser memory, request-size limits, and mail-workflow limits before expanding
this feature.

### Error telemetry

```text
Superset API failure
  -> core error normalization/logger
  -> dashboard/chart/request/filter context
  -> Sentry event
```

Sentry is configured with `sendDefaultPii: true`. URLs and filter context may
contain identifiers. Privacy and retention requirements must therefore be part
of deployment review.

### Boltic Streams

```text
embedded Big Number render success
  -> chart/user/dashboard/datasource/filter/RLS extraction
  -> threshold comparison
  -> Stelios event for a crossed chart threshold
```

The client loads JavaScript from PixelBin and sends events to a Boltic endpoint.
The implementation constructs a new helper for each invocation, so its
in-memory duplicate set does not suppress events across renders. It also
contains production `console.log` calls and hard-coded configuration. These
should be treated as operational debt, not copied as the preferred pattern.

## Known engineering risks

1. Snapshot and AI integrations have hard-coded production fallbacks. Missing
   configuration can therefore call an external service instead of failing
   closed.
2. Snapshot enablement defaults to on when the environment variable is absent.
3. Embedded status uses `postMessage` with `'*'` rather than an explicit parent
   origin.
4. Sentry sends default PII and attaches URL/filter context.
5. Boltic Streams contains a hard-coded write key and thresholds despite
   environment-variable plumbing.
6. Sentry's performance and user-context helpers have no callers at the audited
   tip; their presence does not mean those signals are collected.
7. Several integration paths retain debug logging and broad `any` types.
8. AI summaries send raw sampled rows with browser credentials; authorization
   at the receiving endpoint is a mandatory control.

These findings describe current code. Fixes should receive focused tests and
their own change requests rather than being bundled into documentation-only
work.
