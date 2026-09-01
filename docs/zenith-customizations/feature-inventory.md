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

# Feature inventory

This inventory describes code present at
`96898a6a19aedc4016347f0fd5fefa7632f78771`. “Current” confirms presence, not
production approval: the full frontend test suite is not green.

## Major customizations

### AI-generated chart summaries

**Status:** Current, feature-flagged, external-service dependent.

- `AI_SUMMARY_ON_CHART` enables the capability globally.
- The chart-level `enable_ai_insights` control enables it per chart.
- `ai_custom_system_prompt` supplies up to 4,000 characters of chart-specific
  instructions.
- The frontend sends a maximum of 200 raw rows plus chart metadata and selected
  URL context to `AI_SUMMARY_ENDPOINT`, using the current browser session.
- Big Number variants are excluded from the summary box.

Primary implementation:

- [`AISummaryBox.tsx`](../../superset-frontend/src/components/Chart/AISummaryBox.tsx)
- [`aiSummary.ts`](../../superset-frontend/src/utils/aiSummary.ts)
- [`ChartRenderer.jsx`](../../superset-frontend/src/components/Chart/ChartRenderer.jsx)
- [`sharedControls.tsx`](../../superset-frontend/packages/superset-ui-chart-controls/src/shared-controls/sharedControls.tsx)

Focused tests exist in `AISummaryBox.test.tsx`, `AISummary.integration.test.tsx`,
and `aiSummary.test.ts`.

### Timezone-aware date filtering

**Status:** Current, partially feature-flagged.

- A root `TimezoneProvider` exposes timezone state.
- URL `timezone` values are validated; the default is `Asia/Kolkata`.
- Backend-evaluated UTC ranges are formatted in the target timezone.
- Request dates can be converted back to UTC before API calls.
- A timezone chip appears when a valid timezone is explicitly present in the
  URL.
- `DATE_FILTER_INLINE_PICKER` switches the date control to a redesigned picker
  with quick ranges, time precision, and time-range selection.

Primary implementation:

- [`TimezoneContext`](../../superset-frontend/src/components/TimezoneContext/index.tsx)
- [`timezoneApiUtils.ts`](../../superset-frontend/src/utils/timezoneApiUtils.ts)
- [`dateUtils.ts`](../../superset-frontend/src/utils/dateUtils.ts)
- [`DateFilterLabel.tsx`](../../superset-frontend/src/explore/components/controls/DateFilterControl/DateFilterLabel.tsx)
- [`RevampedDateFilter`](../../superset-frontend/src/explore/components/controls/DateFilterControl/components/RevampedDateFilter/index.tsx)

The date-filter area has focused unit and integration-style tests under
`DateFilterControl/tests/`. The historical root timezone report is useful for
context but does not override current code.

### Big Number and KPI presentation system

**Status:** Current; spread across Total, Trendline, and Period-over-Period
variants.

The fork adds:

- Period-over-period comparison extraction and dashboard-header rendering.
- Positive, negative, and neutral trend states.
- Configurable trend icon source, colors, shape, position, and size.
- Optional card icon URL/upload, background, shape, size, and placement.
- Clickable scorecards using a manual URL or a URL column returned by a second
  query, with configurable hover border behavior.
- Additional chart controls such as chart ID, cache timeout, and URL parameters
  in the Period-over-Period panel.

Primary implementation:

- [`BigNumberViz.tsx`](../../superset-frontend/plugins/plugin-chart-echarts/src/BigNumber/BigNumberViz.tsx)
- [`sharedControls.ts`](../../superset-frontend/plugins/plugin-chart-echarts/src/BigNumber/sharedControls.ts)
- [`getBigNumberComparisonData.ts`](../../superset-frontend/src/dashboard/util/getBigNumberComparisonData.ts)
- [`SliceHeader`](../../superset-frontend/src/dashboard/components/SliceHeader/index.tsx)

Focused tests cover build queries, transform props, clickable cards, comparison
extraction, and rendering. The root icon summary overstates completeness and
must not be used as the coverage source of truth.

### Configurable table links and chip buttons

**Status:** Current.

- A display column can derive its target from a separate URL column.
- Per-link configuration controls new-tab behavior, colors, decoration, font,
  icon visibility, and button-like rendering.
- URL utility functions normalize display values and link targets.
- `ChipButton` provides the compact action presentation.

Primary implementation:

- [`HyperlinkConfigControl.tsx`](../../superset-frontend/plugins/plugin-chart-table/src/controls/HyperlinkConfigControl.tsx)
- [`TableChart.tsx`](../../superset-frontend/plugins/plugin-chart-table/src/TableChart.tsx)
- [`ChipButton.tsx`](../../superset-frontend/plugins/plugin-chart-table/src/components/ChipButton.tsx)
- [`urlUtils.ts`](../../superset-frontend/plugins/plugin-chart-table/src/utils/urlUtils.ts)

### Carousel visualization plugin

**Status:** Current, custom plugin.

The plugin supports table and carousel views, configurable card/image/gallery
presentation, navigation, text fields, and call-to-action behavior. It is
registered in the main visualization preset and has its own package, control
panel, transform layer, test configuration, and focused tests.

Primary implementation:

- [`plugin-chart-carousel`](../../superset-frontend/plugins/plugin-chart-carousel/README.md)
- [`CarouselChart.tsx`](../../superset-frontend/plugins/plugin-chart-carousel/src/CarouselChart.tsx)
- [`controlPanel.tsx`](../../superset-frontend/plugins/plugin-chart-carousel/src/controlPanel.tsx)
- [`MainPreset.js`](../../superset-frontend/src/visualizations/presets/MainPreset.js)

### Dashboard snapshots and email delivery

**Status:** Current, build-time configured, external-workflow dependent.

- Captures `#dashboard-snapshot-root` or `.dashboard-content` with
  `html2canvas`.
- Produces a JPEG preview with a cross-origin-image retry path.
- Downloads locally or sends the image data URL and recipient email to a
  workflow endpoint.
- Exposes snapshot readiness flags from the dashboard wrapper.

Primary implementation:

- [`ActionButtons`](../../superset-frontend/src/dashboard/components/nativeFilters/FilterBar/ActionButtons/index.tsx)
- [`DashboardWrapper.tsx`](../../superset-frontend/src/dashboard/components/DashboardBuilder/DashboardWrapper.tsx)
- [`webpack.config.js`](../../superset-frontend/webpack.config.js)

The current enablement rule treats an unset `ENABLE_DASHBOARD_SNAPSHOT` as
enabled, and the email endpoint has a hard-coded fallback. These are documented
risks, not recommended configuration patterns.

### Embedded-dashboard readiness protocol

**Status:** Current, embedding-context dependent.

- Traverses the current dashboard view and active tab to identify visible
  charts.
- Classifies charts as pending, rendered, or failed.
- Publishes totals, failure details, and settled state to
  `window.__SUPERSET_DASHBOARD_STATUS__`.
- Emits every status update to the parent frame using
  `__superset_dashboard_status__`.

Primary implementation:

- [`dashboardStatus.ts`](../../superset-frontend/src/dashboard/util/dashboardStatus.ts)
- [`embeddedUtils.ts`](../../superset-frontend/src/utils/embeddedUtils.ts)
- [`DashboardPage.tsx`](../../superset-frontend/src/dashboard/containers/DashboardPage.tsx)

### Boltic Streams analytics

**Status:** Current, embedded Big Number path only, external-script dependent.

- Loads the Stelios client during frontend startup.
- Extracts dashboard, chart, datasource, user, URL, filter, and RLS context.
- Attempts to suppress duplicate threshold events with an in-memory set.
- Runs from successful embedded Big Number renders.

Primary implementation:

- [`setupBolticStreams.ts`](../../superset-frontend/src/setup/setupBolticStreams.ts)
- [`bolticHelper.ts`](../../superset-frontend/src/setup/bolticHelper.ts)
- [`ChartRenderer.jsx`](../../superset-frontend/src/components/Chart/ChartRenderer.jsx)

Thresholds and the write key are currently hard-coded even though matching
environment variables are declared. `ChartRenderer` also constructs a new
helper for each invocation, so the helper's in-memory duplicate suppression does
not persist across render events.

### Sentry API-error observability

**Status:** Current, environment-dependent.

- Initializes Sentry early in the frontend lifecycle.
- Enriches API errors with page, dashboard, chart, request, filter, and user
  context.
- Provides performance, user-context, and breadcrumb helpers; no callers for
  those helpers were present at the audited tip, so they are not active
  instrumentation yet.
- Extends the core API client error path through a dedicated error logger.

Primary implementation:

- [`sentryConfig.ts`](../../superset-frontend/src/setup/sentryConfig.ts)
- [`errorLogger.ts`](../../superset-frontend/packages/superset-ui-core/src/connection/callApi/errorLogger.ts)
- [`callApi.ts`](../../superset-frontend/packages/superset-ui-core/src/connection/callApi/callApi.ts)

### Per-chart dashboard capability controls

**Status:** Current, permission and feature-flag aware.

Chart authors can control visibility of the three-dot menu, fullscreen, data
view, drill-to-detail, CSV, Excel, full-data exports, and image download.
`ENABLE_CHART_FORCE_REFRESH` separately controls force refresh. Defaults retain
the upstream behavior unless a control is explicitly false.

Primary implementation:

- [`sharedControls.tsx`](../../superset-frontend/packages/superset-ui-chart-controls/src/shared-controls/sharedControls.tsx)
- [`SliceHeaderControls`](../../superset-frontend/src/dashboard/components/SliceHeaderControls/index.tsx)
- [`QueryFormData.ts`](../../superset-frontend/packages/superset-ui-core/src/query/types/QueryFormData.ts)

## Minor customizations

| Area | Current behavior | Evidence |
| --- | --- | --- |
| Chart loading | Replaces standard chart spinners with a chart-shaped shimmer and changes chart container alignment/overflow. | `src/components/Chart/Chart.jsx`, `ChartShimmer.tsx` |
| Empty results | Chart empty-result title is `No data`; generic list empty title defaults to `0`. | `ChartRenderer.jsx`, `components/ListView/ListView.tsx` |
| Chart description | Shows a description information icon in the chart header. | `dashboard/components/SliceHeader/index.tsx` |
| Dashboard refresh | Adds a refresh action beside filter actions and uses a Fynd CDN icon. | `FilterBar/ActionButtons/index.tsx` |
| Filter reset | Adds and tests `Reset All` behavior across native filter layouts. | `FilterBar/index.tsx`, `tests/ResetAllFunctionality.test.ts` |
| Filter badge | Suppresses the applied-filter count badge entirely. | `dashboard/components/FiltersBadge/index.tsx` |
| CSS editor | Replaces the standard trigger with a custom modal that supports a larger/fullscreen editor and compact template selector. | `dashboard/components/CssEditor/index.tsx` |
| Drill-to-detail | Keeps the modal title but removes the edit-chart action and metadata bar; also supports per-chart disabling. | `components/Chart/DrillDetail/*`, `ChartContextMenu.tsx` |
| Gateway timeout | Registers a dedicated gateway-timeout message with a user-facing refresh instruction. | `GatewayTimeoutErrorMessage.tsx`, `setupErrorMessages.ts` |
| Compact numbers | Adds `Compact numbers after 10M`: comma formatting up to 10M and SI-style compact formatting above it. | `createSmartNumberFormatter.ts`, `D3Formatting.ts` |
| Currency context | Reads `currency_code` from the URL and includes a custom Indonesian rupiah symbol mapping. | `CurrencyFormatter.ts`, `NumericCell/index.tsx` |
| Pie/donut labels | Repositions and centers the donut total as a two-line label. | `plugins/plugin-chart-echarts/src/Pie/transformProps.ts` |
| Treemap contrast | Chooses contrasting label colors from each node background. | `plugins/plugin-chart-echarts/src/Treemap/transformProps.ts` |
| Country maps | Adds UAE geometry, URL-driven country selection, map padding changes, and linear color-scheme controls. | `plugins/legacy-plugin-chart-country-map/src/*` |
| Chart height | Adjusts chart-holder sizing and fullscreen overflow behavior. | `gridComponents/ChartHolder.tsx`, `Chart.jsx` |
| Local frontend DX | Adds `env.sh.example`, `run.local.sh`, and a local-manifest proxy mode. | `superset-frontend/env.sh.example`, `run.local.sh`, `webpack.proxy-config.js` |
| Assets and branding | Adds an AI glyph/icon, new-tab icon, and a customized loading asset. | `src/assets/images/*`, `components/Icons/index.tsx` |

## Superseded or reverted work

- September 2025 color-range experiments were explicitly reverted; do not
  describe them as a current feature without checking the final diff.
- The first carousel implementation was reverted, but a later implementation
  created the current `plugin-chart-carousel` package.
- Compact formatting was initially introduced after 1M and later changed to
  10M. The current behavior is 10M.
- Drill-detail work briefly removed both the title and edit action. The final
  behavior retains the title while removing the edit action and metadata bar.

Commit counts and subjects are historical evidence, not acceptance criteria.
Every feature claim above is tied to code still present at the audited tip.
