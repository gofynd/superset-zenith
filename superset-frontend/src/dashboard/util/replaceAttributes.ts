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
import {
  ensureIsArray,
  getColumnLabel,
  getMetricLabel,
} from '@superset-ui/core';
import type { QueryFormColumn, QueryFormMetric } from '@superset-ui/core';
import type { Datasource } from 'src/dashboard/types';
import { getMetricKey } from 'src/dashboard/util/optionalMetrics';

export type ReplaceAttributePersistence = 'session' | 'none';

export type ReplaceAttributeEntry =
  | QueryFormColumn
  | {
      column?: QueryFormColumn;
      column_name?: string;
      label?: string;
      group?: string;
      category?: string;
      description?: string;
      enabled?: boolean;
      row_limit?: number;
      rowLimit?: number;
      top_n?: number;
      topN?: number;
      series_limit?: number;
      seriesLimit?: number;
    };

export type ReplaceAttributeSettings = {
  enabled: boolean;
  target?: QueryFormColumn;
  attributes: ReplaceAttributeEntry[];
  label: string;
  persistence: ReplaceAttributePersistence;
  rawConfig: Record<string, any>;
};

export type ReplaceAttributeOption = {
  column: QueryFormColumn;
  key: string;
  label: string;
  group?: string;
  description?: string;
  isDefault: boolean;
  rowLimit?: number;
  seriesLimit?: number;
};

const replaceAttributeConfigKeys = [
  'replace_attribute',
  'replace_attribute_config_json',
  'enable_replace_attribute',
  'replace_attribute_target',
  'replace_attribute_attributes',
  'replace_attribute_options',
  'replacement_attributes',
  'replace_attribute_label',
  'replace_attribute_persistence',
];

const dimensionFieldNames = [
  'groupby',
  'columns',
  'groupbyRows',
  'groupbyColumns',
  'series_columns',
  'all_columns',
];

const scalarDimensionFieldNames = [
  'x_axis',
  'series',
  'entity',
  'column',
  'source',
  'target',
];

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeConfig(value: unknown): Record<string, any> {
  const parsed = parseMaybeJson(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, any>;
  }
  return {};
}

function getNestedConfig(formData: Record<string, any>) {
  return {
    ...normalizeConfig(formData?.replace_attribute),
    ...normalizeConfig(formData?.replace_attribute_config_json),
  };
}

export function getColumnKey(column: QueryFormColumn | undefined) {
  if (column === undefined || column === null) {
    return '';
  }
  if (typeof column === 'string') {
    return column;
  }
  const columnRecord = column as Record<string, any>;
  if (columnRecord.column_name) {
    return String(columnRecord.column_name);
  }
  try {
    return getColumnLabel(column);
  } catch {
    return JSON.stringify(column);
  }
}

function normalizeColumn(value: unknown): QueryFormColumn | undefined {
  const parsed = parseMaybeJson(value);
  if (typeof parsed === 'string') {
    return parsed;
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const entry = parsed as Record<string, any>;
    if (entry.column) {
      return normalizeColumn(entry.column);
    }
    if (entry.column_name) {
      return entry.column_name;
    }
    if (entry.sqlExpression || entry.label || entry.expressionType) {
      return entry as QueryFormColumn;
    }
  }
  return undefined;
}

function getConfiguredLabel(entry: ReplaceAttributeEntry | undefined) {
  return entry && typeof entry === 'object' && 'label' in entry
    ? entry.label
    : undefined;
}

function getConfiguredGroup(entry: ReplaceAttributeEntry | undefined) {
  if (entry && typeof entry === 'object') {
    const configuredEntry = entry as Record<string, any>;
    return configuredEntry.group ?? configuredEntry.category;
  }
  return undefined;
}

function getConfiguredDescription(entry: ReplaceAttributeEntry | undefined) {
  return entry && typeof entry === 'object' && 'description' in entry
    ? entry.description
    : undefined;
}

function getConfiguredRowLimit(entry: ReplaceAttributeEntry | undefined) {
  if (!entry || typeof entry !== 'object') {
    return undefined;
  }
  const configuredEntry = entry as Record<string, any>;
  const value =
    configuredEntry.row_limit ??
    configuredEntry.rowLimit ??
    configuredEntry.top_n ??
    configuredEntry.topN;
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getConfiguredSeriesLimit(entry: ReplaceAttributeEntry | undefined) {
  if (!entry || typeof entry !== 'object') {
    return undefined;
  }
  const configuredEntry = entry as Record<string, any>;
  const value = configuredEntry.series_limit ?? configuredEntry.seriesLimit;
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function inferTarget(formData: Record<string, any>) {
  const candidates = [
    formData?.groupby,
    formData?.groupbyRows,
    formData?.columns,
    formData?.series_columns,
    formData?.x_axis,
  ];
  for (const candidate of candidates) {
    const column = normalizeColumn(ensureIsArray(candidate)[0] ?? candidate);
    if (column) {
      return column;
    }
  }
  return undefined;
}

function getConfiguredAttributes(
  formData: Record<string, any>,
  nestedConfig: Record<string, any>,
) {
  return [
    ...ensureIsArray<ReplaceAttributeEntry>(nestedConfig.attributes),
    ...ensureIsArray<ReplaceAttributeEntry>(nestedConfig.replacements),
    ...ensureIsArray<ReplaceAttributeEntry>(nestedConfig.options),
    ...ensureIsArray<ReplaceAttributeEntry>(
      formData.replace_attribute_attributes,
    ),
    ...ensureIsArray<ReplaceAttributeEntry>(formData.replace_attribute_options),
    ...ensureIsArray<ReplaceAttributeEntry>(formData.replacement_attributes),
  ].filter(entry => {
    if (entry && typeof entry === 'object' && 'enabled' in entry) {
      return entry.enabled !== false;
    }
    return Boolean(normalizeColumn(entry));
  });
}

export function getReplaceAttributeSettings(
  formData: Record<string, any>,
): ReplaceAttributeSettings {
  const nestedConfig = getNestedConfig(formData);
  const attributes = getConfiguredAttributes(formData, nestedConfig);
  const explicitEnabled =
    formData?.enable_replace_attribute ?? nestedConfig.enabled;
  const target =
    normalizeColumn(formData?.replace_attribute_target) ??
    normalizeColumn(nestedConfig.target) ??
    normalizeColumn(nestedConfig.default_attribute) ??
    inferTarget(formData);

  return {
    enabled: explicitEnabled ?? attributes.length > 0,
    target,
    attributes,
    label:
      formData?.replace_attribute_label ??
      nestedConfig.label ??
      nestedConfig.display_label ??
      'View by',
    persistence:
      (formData?.replace_attribute_persistence ?? nestedConfig.persistence) ===
      'none'
        ? 'none'
        : 'session',
    rawConfig: nestedConfig,
  };
}

function getDatasourceColumn(column: QueryFormColumn, datasource?: Datasource) {
  const key = getColumnKey(column);
  return datasource?.columns?.find(
    datasourceColumn => datasourceColumn.column_name === key,
  );
}

function getDisplayLabel(
  column: QueryFormColumn,
  datasource?: Datasource,
  configuredLabel?: string,
) {
  if (configuredLabel) {
    return configuredLabel;
  }
  const datasourceColumn = getDatasourceColumn(column, datasource);
  return datasourceColumn?.verbose_name || getColumnKey(column);
}

function isVisibleColumn(column: QueryFormColumn, datasource?: Datasource) {
  if (!datasource?.columns?.length || typeof column !== 'string') {
    return true;
  }
  const datasourceColumn = getDatasourceColumn(column, datasource);
  return datasourceColumn ? datasourceColumn.groupby !== false : true;
}

function createOption(
  entry: ReplaceAttributeEntry,
  datasource: Datasource | undefined,
  isDefault: boolean,
): ReplaceAttributeOption | undefined {
  const column = normalizeColumn(entry);
  if (!column || !isVisibleColumn(column, datasource)) {
    return undefined;
  }
  return {
    column,
    key: getColumnKey(column),
    label: getDisplayLabel(column, datasource, getConfiguredLabel(entry)),
    group: isDefault ? undefined : getConfiguredGroup(entry),
    description: getConfiguredDescription(entry),
    isDefault,
    rowLimit: getConfiguredRowLimit(entry),
    seriesLimit: getConfiguredSeriesLimit(entry),
  };
}

export function getReplaceAttributeOptions(
  formData: Record<string, any>,
  datasource?: Datasource,
) {
  const settings = getReplaceAttributeSettings(formData);
  if (!settings.enabled || !settings.target) {
    return [];
  }

  const targetKey = getColumnKey(settings.target);
  const matchingTargetEntry = settings.attributes.find(
    entry => getColumnKey(normalizeColumn(entry)) === targetKey,
  );
  const defaultOption = createOption(
    matchingTargetEntry ?? settings.target,
    datasource,
    true,
  );
  const replacementOptions = settings.attributes
    .map(entry => createOption(entry, datasource, false))
    .filter(Boolean) as ReplaceAttributeOption[];
  const options = [defaultOption, ...replacementOptions].filter(
    Boolean,
  ) as ReplaceAttributeOption[];
  const seen = new Set<string>();

  return options.filter(option => {
    if (seen.has(option.key)) {
      return false;
    }
    seen.add(option.key);
    return true;
  });
}

export function hasReplaceAttributes(
  formData: Record<string, any>,
  datasource?: Datasource,
) {
  const options = getReplaceAttributeOptions(formData, datasource);
  return (
    getReplaceAttributeSettings(formData).enabled &&
    options.some(option => !option.isDefault)
  );
}

export function findReplaceAttributeOption(
  formData: Record<string, any>,
  activeAttribute?: QueryFormColumn | null,
  datasource?: Datasource,
) {
  const options = getReplaceAttributeOptions(formData, datasource);
  const fallback = options.find(option => option.isDefault) ?? options[0];
  const activeKey = getColumnKey(activeAttribute ?? fallback?.column);
  return options.find(option => option.key === activeKey) ?? fallback;
}

export function isValidReplaceAttribute(
  formData: Record<string, any>,
  activeAttribute?: QueryFormColumn | null,
  datasource?: Datasource,
) {
  const activeKey = getColumnKey(activeAttribute ?? undefined);
  return Boolean(
    activeKey &&
      getReplaceAttributeOptions(formData, datasource).some(
        option => option.key === activeKey,
      ),
  );
}

function replaceColumnValue(
  value: unknown,
  targetKey: string,
  activeColumn: QueryFormColumn,
) {
  const column = normalizeColumn(value);
  return column && getColumnKey(column) === targetKey ? activeColumn : value;
}

function replaceColumnArray(
  value: unknown,
  targetKey: string,
  activeColumn: QueryFormColumn,
) {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map(item => replaceColumnValue(item, targetKey, activeColumn));
}

function replaceOrderBy(
  orderby: unknown,
  targetKey: string,
  activeColumn: QueryFormColumn,
) {
  if (!Array.isArray(orderby)) {
    return orderby;
  }
  return orderby.map(entry => {
    if (Array.isArray(entry)) {
      const [column, ascending] = entry;
      return [replaceColumnValue(column, targetKey, activeColumn), ascending];
    }
    return entry;
  });
}

function replacePostProcessingColumns(
  postProcessing: unknown,
  targetKey: string,
  activeColumn: QueryFormColumn,
) {
  if (!Array.isArray(postProcessing)) {
    return postProcessing;
  }
  const activeKey = getColumnKey(activeColumn);
  return postProcessing.map(operation => {
    if (!operation?.options || typeof operation.options !== 'object') {
      return operation;
    }
    const options = { ...operation.options };
    ['groupby', 'index', 'columns'].forEach(key => {
      options[key] = ensureIsArray(options[key]).map((column: unknown) => {
        const normalizedColumn = normalizeColumn(column);
        return normalizedColumn && getColumnKey(normalizedColumn) === targetKey
          ? activeKey
          : column;
      });
    });
    if (options.sort && typeof options.sort === 'object') {
      options.sort = Object.fromEntries(
        Object.entries(options.sort).map(([key, value]) => [
          key === targetKey ? activeKey : key,
          value,
        ]),
      );
    }
    return { ...operation, options };
  });
}

export function applyActiveAttributeToFormData(
  formData: Record<string, any>,
  activeAttribute?: QueryFormColumn | null,
  datasource?: Datasource,
) {
  const option = findReplaceAttributeOption(
    formData,
    activeAttribute,
    datasource,
  );
  const settings = getReplaceAttributeSettings(formData);
  if (!settings.enabled || !settings.target || !option) {
    return formData;
  }

  const targetKey = getColumnKey(settings.target);
  const nextFormData: Record<string, any> = {
    ...formData,
    replace_attribute: {
      ...settings.rawConfig,
      enabled: settings.enabled,
      target: settings.target,
      active_attribute: option.column,
      active_attribute_label: option.label,
    },
  };

  dimensionFieldNames.forEach(fieldName => {
    if (Object.prototype.hasOwnProperty.call(nextFormData, fieldName)) {
      nextFormData[fieldName] = replaceColumnArray(
        nextFormData[fieldName],
        targetKey,
        option.column,
      );
    }
  });

  scalarDimensionFieldNames.forEach(fieldName => {
    if (Object.prototype.hasOwnProperty.call(nextFormData, fieldName)) {
      nextFormData[fieldName] = replaceColumnValue(
        nextFormData[fieldName],
        targetKey,
        option.column,
      );
    }
  });

  if (Object.prototype.hasOwnProperty.call(nextFormData, 'orderby')) {
    nextFormData.orderby = replaceOrderBy(
      nextFormData.orderby,
      targetKey,
      option.column,
    );
  }

  if (Object.prototype.hasOwnProperty.call(nextFormData, 'x_axis_sort')) {
    nextFormData.x_axis_sort = replaceColumnValue(
      nextFormData.x_axis_sort,
      targetKey,
      option.column,
    );
  }

  if (Object.prototype.hasOwnProperty.call(nextFormData, 'post_processing')) {
    nextFormData.post_processing = replacePostProcessingColumns(
      nextFormData.post_processing,
      targetKey,
      option.column,
    );
  }

  if (option.rowLimit) {
    nextFormData.row_limit = option.rowLimit;
  }
  if (option.seriesLimit) {
    nextFormData.limit = option.seriesLimit;
    nextFormData.series_limit = option.seriesLimit;
  }

  return nextFormData;
}

export function getReplaceAttributeConfigSignature(
  formData: Record<string, any>,
) {
  const settings = getReplaceAttributeSettings(formData);
  return JSON.stringify(
    Object.fromEntries(
      replaceAttributeConfigKeys.map(key => [key, formData?.[key]]),
    ),
  ).concat(
    JSON.stringify({
      target: getColumnKey(settings.target),
      attributes: settings.attributes.map(entry =>
        getColumnKey(normalizeColumn(entry)),
      ),
    }),
  );
}

export function getReplaceAttributeStorageKey(
  dashboardId?: number,
  sliceId?: number,
) {
  if (!dashboardId || !sliceId) {
    return undefined;
  }
  return `superset:replace_attribute:${dashboardId}:${sliceId}`;
}

export function getActiveAttributeLabel(
  formData: Record<string, any>,
  datasource?: Datasource,
  activeAttribute?: QueryFormColumn | null,
) {
  return (
    findReplaceAttributeOption(formData, activeAttribute, datasource)?.label ??
    ''
  );
}

function renderMetricLabel(
  metric: QueryFormMetric | undefined,
  datasource?: Datasource,
) {
  if (!metric) {
    return '';
  }
  const metricKey = getMetricKey(metric);
  const datasourceMetric = datasource?.metrics?.find(
    candidate =>
      candidate.metric_name === metricKey ||
      candidate.verbose_name === metricKey,
  );
  if (datasourceMetric?.verbose_name) {
    return datasourceMetric.verbose_name;
  }
  try {
    return getMetricLabel(metric);
  } catch {
    return metricKey;
  }
}

export function renderViewerTitleTemplate({
  title,
  formData,
  datasource,
  activeAttribute,
  activeMetrics = [],
}: {
  title?: string;
  formData: Record<string, any>;
  datasource?: Datasource;
  activeAttribute?: QueryFormColumn | null;
  activeMetrics?: QueryFormMetric[];
}) {
  const template = title ?? '';
  if (!template.includes('{{')) {
    return template;
  }
  const activeAttributeLabel = getActiveAttributeLabel(
    formData,
    datasource,
    activeAttribute,
  );
  const activeMetricLabels = activeMetrics
    .map(metric => renderMetricLabel(metric, datasource))
    .filter(Boolean);
  const replacements: Record<string, string> = {
    active_attribute: getColumnKey(
      findReplaceAttributeOption(formData, activeAttribute, datasource)?.column,
    ),
    active_attribute_label: activeAttributeLabel,
    active_metric: activeMetricLabels[0] ?? '',
    active_metrics: activeMetricLabels.join(', '),
  };

  return template.replace(
    /\{\{\s*(active_attribute|active_attribute_label|active_metric|active_metrics)\s*\}\}/g,
    (_match, key) => replacements[key] ?? '',
  );
}
