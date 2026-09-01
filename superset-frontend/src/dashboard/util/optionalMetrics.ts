/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { ensureIsArray, getMetricLabel } from '@superset-ui/core';
import type { QueryFormMetric } from '@superset-ui/core';

export type OptionalMetricSelectionMode = 'multi' | 'single';

export type OptionalMetricEntry =
  | QueryFormMetric
  | {
      metric: QueryFormMetric;
      group?: string;
      category?: string;
      label?: string;
      description?: string;
      axis?: string;
    };

export type OptionalMetricSettings = {
  enabled: boolean;
  selectionMode: OptionalMetricSelectionMode;
  allowDefaultMetricDeselection: boolean;
  minActiveMetrics: number;
  maxActiveMetrics: number;
  showSearch: boolean;
};

const DEFAULT_MIN_ACTIVE_METRICS = 1;
const DEFAULT_MAX_ACTIVE_METRICS = 4;

const metricConfigKeys = [
  'metric',
  'metrics',
  'optional_metrics',
  'optional_metric_settings',
  'enable_optional_metrics',
  'optional_metric_selection_mode',
  'optional_metric_allow_default_deselection',
  'optional_metric_min_active',
  'optional_metric_max_active',
];

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function inferSelectionMode(formData: Record<string, any>) {
  const vizType = String(formData?.viz_type ?? '').toLowerCase();
  if (
    vizType.includes('big_number') ||
    vizType.includes('pie') ||
    vizType.includes('gauge')
  ) {
    return 'single';
  }
  return 'multi';
}

function normalizeSelectionMode(
  value: unknown,
  fallback: OptionalMetricSelectionMode,
): OptionalMetricSelectionMode {
  if (value === 'single' || value === 'replacement') {
    return 'single';
  }
  if (value === 'multi') {
    return 'multi';
  }
  return fallback;
}

export function getMetricFromOptionalEntry(
  entry: OptionalMetricEntry,
): QueryFormMetric | undefined {
  if (entry && typeof entry === 'object' && 'metric' in entry && entry.metric) {
    return entry.metric;
  }
  return entry as QueryFormMetric | undefined;
}

export function getOptionalMetricGroup(entry: OptionalMetricEntry) {
  if (entry && typeof entry === 'object' && 'metric' in entry) {
    return entry.group ?? entry.category;
  }
  return undefined;
}

export function getOptionalMetricDescription(entry: OptionalMetricEntry) {
  if (entry && typeof entry === 'object' && 'metric' in entry) {
    return entry.description;
  }
  return undefined;
}

export function getOptionalMetricLabel(entry: OptionalMetricEntry) {
  if (entry && typeof entry === 'object' && 'metric' in entry) {
    return entry.label;
  }
  return undefined;
}

export function getMetricKey(metric: QueryFormMetric | undefined) {
  if (metric === undefined || metric === null) {
    return '';
  }
  if (typeof metric === 'string') {
    return metric;
  }
  try {
    return getMetricLabel(metric);
  } catch {
    return JSON.stringify(metric);
  }
}

function getMetricSignature(metric: QueryFormMetric | undefined) {
  if (metric === undefined || metric === null) {
    return '';
  }
  return typeof metric === 'string' ? metric : JSON.stringify(metric);
}

function dedupeMetrics(metrics: QueryFormMetric[]) {
  const seen = new Set<string>();
  return metrics.filter(metric => {
    const key = getMetricKey(metric);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getDefaultMetrics(formData: Record<string, any>) {
  const metrics = ensureIsArray<QueryFormMetric>(formData?.metrics).filter(
    Boolean,
  );
  if (metrics.length > 0) {
    return dedupeMetrics(metrics);
  }
  return formData?.metric ? [formData.metric] : [];
}

export function getOptionalMetrics(formData: Record<string, any>) {
  const defaultMetricKeys = new Set(
    getDefaultMetrics(formData).map(getMetricKey),
  );
  const optionalMetrics = ensureIsArray<OptionalMetricEntry>(
    formData?.optional_metrics,
  )
    .map(getMetricFromOptionalEntry)
    .filter(Boolean) as QueryFormMetric[];

  return dedupeMetrics(
    optionalMetrics.filter(
      metric => !defaultMetricKeys.has(getMetricKey(metric)),
    ),
  );
}

export function getOptionalMetricSettings(
  formData: Record<string, any>,
): OptionalMetricSettings {
  const nestedSettings = formData?.optional_metric_settings ?? {};
  const optionalMetrics = ensureIsArray(formData?.optional_metrics);
  const inferredMode = inferSelectionMode(formData);
  const selectionMode = normalizeSelectionMode(
    formData?.optional_metric_selection_mode ?? nestedSettings.selection_mode,
    inferredMode,
  );
  const minActiveMetrics =
    selectionMode === 'single'
      ? 1
      : parsePositiveInteger(
          formData?.optional_metric_min_active ??
            nestedSettings.minimum_active_metrics,
          DEFAULT_MIN_ACTIVE_METRICS,
        );
  const maxActiveMetrics =
    selectionMode === 'single'
      ? 1
      : Math.max(
          minActiveMetrics,
          parsePositiveInteger(
            formData?.optional_metric_max_active ??
              nestedSettings.maximum_active_metrics,
            DEFAULT_MAX_ACTIVE_METRICS,
          ),
        );
  const explicitEnabled =
    formData?.enable_optional_metrics ?? nestedSettings.enabled;

  return {
    enabled: explicitEnabled ?? optionalMetrics.length > 0,
    selectionMode,
    allowDefaultMetricDeselection: Boolean(
      formData?.optional_metric_allow_default_deselection ??
        nestedSettings.allow_default_metric_deselection ??
        false,
    ),
    minActiveMetrics,
    maxActiveMetrics,
    showSearch: Boolean(
      formData?.optional_metric_show_search ??
        nestedSettings.show_search ??
        optionalMetrics.length > 10,
    ),
  };
}

export function hasOptionalMetrics(formData: Record<string, any>) {
  const settings = getOptionalMetricSettings(formData);
  return settings.enabled && getOptionalMetrics(formData).length > 0;
}

export function getOptionalMetricConfigSignature(
  formData: Record<string, any>,
) {
  return JSON.stringify(
    Object.fromEntries(
      metricConfigKeys.map(key => {
        const value = formData?.[key];
        if (key === 'metrics') {
          return [key, ensureIsArray(value).map(getMetricSignature)];
        }
        if (key === 'optional_metrics') {
          return [
            key,
            ensureIsArray<OptionalMetricEntry>(value).map(entry => ({
              ...((entry &&
                typeof entry === 'object' &&
                'metric' in entry &&
                entry) ||
                {}),
              metric: getMetricSignature(getMetricFromOptionalEntry(entry)),
            })),
          ];
        }
        return [key, value];
      }),
    ),
  );
}

export function applyActiveMetricsToFormData(
  formData: Record<string, any>,
  activeMetrics: QueryFormMetric[],
) {
  const settings = getOptionalMetricSettings(formData);
  const metrics = activeMetrics.length
    ? activeMetrics
    : getDefaultMetrics(formData);
  const nextFormData = { ...formData };

  if (
    Object.prototype.hasOwnProperty.call(formData, 'metrics') ||
    settings.selectionMode === 'multi'
  ) {
    nextFormData.metrics = metrics;
  }

  if (
    Object.prototype.hasOwnProperty.call(formData, 'metric') ||
    settings.selectionMode === 'single'
  ) {
    [nextFormData.metric] = metrics;
  }

  const activeMetricKeys = new Set(metrics.map(getMetricKey));
  if (
    formData?.timeseries_limit_metric &&
    !activeMetricKeys.has(getMetricKey(formData.timeseries_limit_metric))
  ) {
    nextFormData.timeseries_limit_metric = metrics[0] ?? null;
  }

  return nextFormData;
}
