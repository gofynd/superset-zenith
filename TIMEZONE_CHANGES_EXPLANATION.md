<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Timezone Changes Explanation

This document explains the timezone/date-filter changes in plain English, with
code snippets showing the important behavior.

## Short Summary

The timezone conversion path is now intended to be opt-in. By default, the date
filter UI should display backend UTC ranges without converting them to a company
timezone. When the `DATE_FILTER_TIMEZONE` feature flag is enabled, the date
filter UI treats backend-evaluated time ranges as UTC, converts them into a
target timezone, and displays the converted values in the date filter label,
tooltip, and "Actual time range" preview.

The target timezone comes from the URL:

```text
?timezone=Asia/Dubai
```

If the URL does not provide a valid timezone, the code defaults to:

```text
Asia/Kolkata
```

The conversion behavior should be guarded by the `DATE_FILTER_TIMEZONE` Superset
feature flag.

## Main Data Flow

The intended flow is:

```text
User opens date filter
  -> frontend asks backend to evaluate the selected time range
  -> backend returns concrete UTC since/until timestamps
  -> if DATE_FILTER_TIMEZONE is enabled, frontend converts those UTC timestamps
     to the selected timezone
  -> frontend formats the timestamps for display
  -> custom date picker saves changed values back as UTC ISO strings
```

In simpler terms:

```text
backend UTC time
  -> selected display timezone
  -> readable UI label
  -> UTC string when saved
```

## Timezone Source

File:

```text
superset-frontend/src/utils/dateUtils.ts
```

The shared timezone utility reads the timezone from the URL and validates it
with `moment-timezone`.

```ts
const URL_PARAMS = { timezone: { name: "timezone" } } as const;
const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function getCurrentTimezone(): string {
  const urlTimezone = getUrlParam(URL_PARAMS.timezone);
  if (typeof urlTimezone === "string" && moment.tz.zone(urlTimezone)) {
    return urlTimezone;
  }
  return DEFAULT_TIMEZONE;
}
```

What this means:

- `?timezone=Asia/Dubai` displays date filters in Dubai time.
- `?timezone=UTC` displays date filters in UTC.
- Missing or invalid timezone falls back to `Asia/Kolkata`.

## DateFilterLabel Changes

File:

```text
superset-frontend/src/explore/components/controls/DateFilterControl/DateFilterLabel.tsx
```

`DateFilterLabel` is the component responsible for the visible date filter pill,
tooltip, and "Actual time range" preview inside the filter popover.

It now uses the shared timezone source:

```ts
const getTimezoneFromUrl = getCurrentTimezone;
```

Then, inside the component:

```ts
const urlTZ = getTimezoneFromUrl();
```

That timezone is used when formatting backend-evaluated ranges.

### Fetching The Actual Range

The component asks the backend to resolve a human time range into concrete
timestamps.

```ts
fetchTimeRange(value, "date").then(({ value: actualRange, error }) => {
  // ...
});
```

Example:

```text
Last week
```

may become:

```text
2025-09-10T00:00:00 to 2025-09-17T00:00:00
```

The frontend then converts that range into the configured timezone.

### UTC Parsing And Timezone Conversion

The helper `parseNaiveUTC` treats backend timestamps as UTC.

```ts
function parseNaiveUTC(input: string): DateTime | null {
  if (!input) return null;
  let iso = input.trim().replace(" ", "T");
  const hasTZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso);
  if (!hasTZ) iso += "Z";
  const dt = DateTime.fromISO(iso, { zone: "utc" });
  return dt.isValid ? dt : null;
}
```

Then `convertRangeUTCToTZ` converts the parsed UTC range to the target timezone:

```ts
function convertRangeUTCToTZ(range: string, tz: string): string {
  if (!range) return range;
  const parts = range.split(/\s+(?:to|:)\s+/i);
  if (parts.length !== 2) return range;

  const startUTC = parseNaiveUTC(parts[0]);
  const endUTC = parseNaiveUTC(parts[1]);
  if (!startUTC || !endUTC) return range;

  const startStr = startUTC.setZone(tz).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
  const endStr = endUTC.setZone(tz).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
  return `${startStr} to ${endStr}`;
}
```

Example conversion:

```text
Input from backend:
2025-09-10T00:00:00 to 2025-09-17T00:00:00

Timezone:
Asia/Kolkata

Converted internal display range:
2025-09-10T05:30:00+05:30 to 2025-09-17T05:30:00+05:30
```

### Human-Friendly Formatting

After conversion, the component formats timestamps for display:

```ts
const formattedADR = convertedADR
  ? formatDateTimeForDisplay(convertedADR, urlTZ, guessedFrame === "Custom")
  : convertedADR;
```

`ADR` means "actual datetime range".

For normal frames like `Last`, `Previous`, `Current`, and calendar-based ranges,
the UI uses a user-friendly AM/PM format.

For the `Custom` frame, the code uses a 24-hour format with seconds:

```ts
if (use24HourFormat) {
  options.hour = "2-digit";
  options.minute = "2-digit";
  options.second = "2-digit";
  options.hour12 = false;
} else {
  options.hour = "numeric";
  options.minute = "2-digit";
  options.hour12 = true;
}
```

## Display Behavior By Frame

The code distinguishes between human-readable frames and custom/advanced-style
frames.

For `Common`, `Calendar`, and `Current` frames:

```ts
setActualTimeRange(value);
setEvalResponse(formattedADR || "");
setTooltipTitle(getTooltipTitle(labelIsTruncated, value, formattedADR));
```

Meaning:

- Pill shows the original human label, such as `Last week`.
- Tooltip shows the converted actual date range.
- "Actual time range" preview shows the converted actual date range.

For the `Custom` frame:

```ts
setActualTimeRange(formattedADR || "");
setEvalResponse(formattedADR || "");
```

Meaning:

- Pill shows the actual converted date range.
- Tooltip shows the actual converted date range.
- "Actual time range" preview shows the actual converted date range.

## Custom Date Picker Changes

File:

```text
superset-frontend/src/explore/components/controls/DateFilterControl/components/CustomFrame.tsx
```

The custom range picker now uses the same timezone source as
`DateFilterLabel`.

```ts
const timezone = getCurrentTimezone();
```

### Displaying Stored UTC Values

When the picker receives a stored datetime, it parses it as UTC and displays it
in the selected timezone.

```ts
const convertToTimezone = (datetime: string): Moment => {
  return moment.utc(datetime).tz(timezone);
};
```

Example:

```text
Stored value:
2025-09-10T00:00:00.000Z

Timezone:
Asia/Kolkata

Picker display:
2025-09-10 05:30:00
```

### Saving Picker Values

When the user changes the picker value, the value is converted back to UTC ISO
before being stored in the time range string.

```ts
const convertFromTimezone = (momentDate: Moment): string => {
  return momentDate.clone().utc().toISOString();
};
```

Example:

```text
User picks:
2025-09-10 05:30:00 in Asia/Kolkata

Stored value:
2025-09-10T00:00:00.000Z
```

This keeps storage/API values in UTC while letting users interact with local
timezone values.

### Default Custom Range

If the existing value cannot be decoded as a custom range, `CustomFrame`
defaults to today's start and end in the selected timezone, converted to UTC.

```ts
const todayStart = moment().tz(timezone).startOf("day").utc().toISOString();

const todayEnd = moment().tz(timezone).endOf("day").utc().toISOString();

customRange.sinceDatetime = todayStart;
customRange.untilDatetime = todayEnd;
```

Example for `Asia/Kolkata`:

```text
Local day:
2025-09-10 00:00:00 to 2025-09-10 23:59:59 Asia/Kolkata

Stored UTC:
2025-09-09T18:30:00.000Z to 2025-09-10T18:29:59.999Z
```

## Core fetchTimeRange Formatting Change

File:

```text
superset-frontend/packages/superset-ui-core/src/time-comparison/fetchTimeRange.ts
```

The formatter was changed from the old Superset style:

```text
start <= column < end
```

or visually:

```text
start ≤ column < end
```

to a simpler text format:

```text
start to end
```

Current code:

```ts
export const formatTimeRange = (
  timeRange: string,
  columnPlaceholder = "col",
) => {
  const splitDateRange = timeRange.split(SEPARATOR);
  if (splitDateRange.length === 1) return timeRange;
  return `${formatDateEndpoint(
    splitDateRange[0],
    true,
  )} to ${formatDateEndpoint(splitDateRange[1])}`;
};
```

Example:

```text
Before:
2021-04-13 ≤ temporal_col < 2021-04-14

After:
2021-04-13 to 2021-04-14
```

This is a global change because `fetchTimeRange` is shared outside
`DateFilterLabel`.

## Timezone Chip

`DateFilterLabel` includes UI code for a small timezone chip. The chip should
only appear when `DATE_FILTER_TIMEZONE` is enabled and the effective timezone is
not UTC:

```ts
const dateFilterTimezoneEnabled = isFeatureEnabled(
  FeatureFlag.DateFilterTimezone,
);
const timezone = getCurrentTimezone();
const showTimezone =
  dateFilterTimezoneEnabled &&
  timezone &&
  timezone !== "UTC" &&
  timezone !== "Etc/UTC";
```

## Is It Feature-Flag Driven?

Yes, it should be.

The intended flag is:

```ts
FeatureFlag.DateFilterTimezone; // DATE_FILTER_TIMEZONE
```

The frontend reads this through one shared helper:

```ts
getDateFilterTimezoneConfig();
```

That helper lives in:

```text
superset-frontend/src/explore/components/controls/DateFilterControl/utils/timezone.ts
```

It returns the full date-filter timezone configuration:

```ts
{
  enabled,
  timezone,
  showTimezone,
}
```

For quick local testing, the helper has one override point:

```ts
const LOCAL_DATE_FILTER_TIMEZONE_OVERRIDE: boolean | undefined = undefined;
```

Use:

```ts
const LOCAL_DATE_FILTER_TIMEZONE_OVERRIDE = true;
```

to force the conversion path locally, or:

```ts
const LOCAL_DATE_FILTER_TIMEZONE_OVERRIDE = false;
```

to force UTC/default behavior locally. Leave it as `undefined` to use the real
Superset feature flag.

Default behavior:

```text
DATE_FILTER_TIMEZONE = false
```

Meaning:

```text
show backend UTC ranges without company-timezone conversion
```

Opt-in behavior:

```text
DATE_FILTER_TIMEZONE = true
```

Meaning:

```text
convert backend UTC ranges to ?timezone=<valid timezone>, falling back to Asia/Kolkata
```

The backend default should be:

```py
"DATE_FILTER_TIMEZONE": False
```

## Build And Correctness Status

The current direction is safer than the earlier implementation because the
company-timezone conversion is now opt-in and the shared `fetchTimeRange`
formatter remains backward-compatible.

### 1. Feature Flag Default Is Safe

The backend default is:

```py
"DATE_FILTER_TIMEZONE": False
```

With the flag off:

- `DateFilterLabel` does not convert backend UTC ranges into a company timezone.
- `CustomFrame` uses `UTC` for picker display/storage normalization.
- The timezone chip does not render.
- DAs can continue handling business timezone semantics in Superset queries.

### 2. Shared fetchTimeRange Is Backward-Compatible

The shared formatter returns the existing Superset format:

```text
start ≤ column < end
```

Current code:

```ts
return `${formatDateEndpoint(
  splitDateRange[0],
  true,
)} ≤ ${columnPlaceholder} < ${formatDateEndpoint(splitDateRange[1])}`;
```

This avoids changing behavior for other callers such as filter labels,
comparison labels, and chart components.

### 3. Company-Timezone Conversion Is Local To DateFilterControl

When `DATE_FILTER_TIMEZONE` is enabled, `DateFilterLabel` can parse either:

```text
start to end
```

or:

```text
start ≤ column < end
```

and convert the two endpoints to the selected timezone for display.

### 4. Date-Only UTC Parsing Was Tightened

Date-only values are handled before appending a UTC suffix:

```ts
if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
  const dateOnly = DateTime.fromISO(iso, { zone: "utc" });
  return dateOnly.isValid ? dateOnly : null;
}
```

This avoids producing invalid values like:

```text
2025-09-10Z
```

### 5. Remaining TypeScript Risk

`npm run type` still fails in this repository, but the current failures are
broader branch issues, mostly in chart/plugin tests and older DateFilterControl
test files that still assume removed relative/custom frame modes.

The earlier direct timezone export conflict was removed by no longer exporting
`formatTimeRange` from `time-comparison/index.ts`.

### 6. Targeted Validation Passed

These targeted checks passed:

```bash
npm run test -- packages/superset-ui-core/test/time-comparison/fetchTimeRange.test.ts
npm run test -- DateFilterControl/tests/ActualTimeRangeFormatting.test.ts DateFilterControl/tests/TimezoneConsistency.test.ts DateFilterControl/tests/DateTimeFormatting.test.ts
npx prettier --check ...
```

## Recommended Next Direction

Recommended next steps:

1. Keep `DATE_FILTER_TIMEZONE` off by default.
2. Let DAs own business timezone semantics in datasets and SQL.
3. Use the frontend flag only for display/picker UX where needed.
4. Do not let URL timezone conversion become the source of analytical truth.
5. Consider a later backend-resolved `analytical_timezone` contract for governed
   tenant/user timezone semantics.

## Bottom Line

What has been done:

- Added `DATE_FILTER_TIMEZONE`, defaulted off.
- Kept default date filter behavior UTC/backward-compatible.
- Put URL-driven company-timezone display conversion behind the flag.
- Treated backend-evaluated ranges as UTC only when the flag is enabled.
- Converted backend UTC ranges into the selected timezone for UI display only
  when the flag is enabled.
- Made the custom date picker use UTC by default and company timezone only when
  the flag is enabled.
- Made the custom date picker save changed values back as UTC ISO strings.
- Restored shared time-range formatting to `≤ column <`.

What is still risky:

- Full-repo TypeScript still fails due broader branch issues.
- Frontend timezone conversion is still display-only and must not be treated as
  analytical correctness.
- Long-term tenant/business timezone semantics should live in the query/backend
  layer, not in this frontend flag.
