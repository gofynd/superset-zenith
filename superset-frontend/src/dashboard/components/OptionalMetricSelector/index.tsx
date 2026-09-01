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
import { useMemo, useState } from 'react';
import { Checkbox as AntdCheckbox } from 'antd';
import { css, ensureIsArray, styled, t } from '@superset-ui/core';
import type { QueryFormMetric } from '@superset-ui/core';
import Icons from 'src/components/Icons';
import { Input } from 'src/components/Input';
import Popover from 'src/components/Popover';
import { Tooltip } from 'src/components/Tooltip';
import type { Datasource } from 'src/dashboard/types';
import {
  getDefaultMetrics,
  getMetricFromOptionalEntry,
  getMetricKey,
  getOptionalMetricDescription,
  getOptionalMetricGroup,
  getOptionalMetricLabel,
  getOptionalMetricSettings,
  getOptionalMetrics,
  hasOptionalMetrics,
} from 'src/dashboard/util/optionalMetrics';
import type { OptionalMetricEntry } from 'src/dashboard/util/optionalMetrics';

type OptionalMetricSelectorProps = {
  formData: Record<string, any>;
  datasource?: Datasource;
  activeMetrics: QueryFormMetric[];
  onChange: (metrics: QueryFormMetric[]) => void;
  onReset: () => void;
  addDangerToast?: (message: string) => void;
  logEvent?: (eventName: string, eventData?: object) => void;
  dashboardId?: number;
  sliceId?: number;
  onVisibleChange?: (visible: boolean) => void;
};

type MetricOption = {
  metric: QueryFormMetric;
  key: string;
  label: string;
  description?: string;
  group?: string;
  isDefault: boolean;
};

const TriggerButton = styled.button<{ $active?: boolean }>`
  ${({ $active, theme }) => css`
    align-items: center;
    background: ${$active
      ? theme.colors.primary.light4
      : theme.colors.grayscale.light5};
    border: 1px solid
      ${$active ? theme.colors.primary.base : theme.colors.grayscale.light2};
    border-radius: ${theme.borderRadius}px;
    color: ${$active
      ? theme.colors.primary.dark1
      : theme.colors.grayscale.dark1};
    cursor: pointer;
    display: inline-flex;
    height: ${theme.gridUnit * 7}px;
    justify-content: center;
    padding: 0;
    width: ${theme.gridUnit * 7}px;

    &:hover,
    &:focus {
      background: ${theme.colors.primary.light4};
      border-color: ${theme.colors.primary.base};
      color: ${theme.colors.primary.dark1};
      outline: none;
    }

    svg {
      height: ${theme.gridUnit * 4}px;
      width: ${theme.gridUnit * 4}px;
    }
  `}
`;

const MenuContent = styled.div`
  ${({ theme }) => css`
    max-width: calc(100vw - ${theme.gridUnit * 8}px);
    width: ${theme.gridUnit * 78}px;
  `}
`;

const MenuHeader = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.grayscale.dark2};
    font-weight: ${theme.typography.weights.bold};
    margin-bottom: ${theme.gridUnit * 2}px;
  `}
`;

const MetricSection = styled.div`
  ${({ theme }) => css`
    margin-top: ${theme.gridUnit * 3}px;
  `}
`;

const SectionTitle = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.grayscale.base};
    font-size: ${theme.typography.sizes.s}px;
    font-weight: ${theme.typography.weights.bold};
    margin-bottom: ${theme.gridUnit}px;
    text-transform: uppercase;
  `}
`;

const MetricRow = styled.label<{ $disabled?: boolean }>`
  ${({ $disabled, theme }) => css`
    align-items: flex-start;
    color: ${$disabled
      ? theme.colors.grayscale.base
      : theme.colors.grayscale.dark2};
    cursor: ${$disabled ? 'not-allowed' : 'pointer'};
    display: flex;
    gap: ${theme.gridUnit * 2}px;
    margin: 0;
    padding: ${theme.gridUnit}px 0;

    .ant-checkbox-wrapper {
      margin-top: 1px;
    }
  `}
`;

const MetricText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const MetricName = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.grayscale.dark2};
    font-size: ${theme.typography.sizes.s}px;
    overflow-wrap: anywhere;
  `}
`;

const MetricDescription = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.grayscale.base};
    font-size: ${theme.typography.sizes.xs}px;
    line-height: 1.25;
    margin-top: ${theme.gridUnit / 2}px;
  `}
`;

const Footer = styled.div`
  ${({ theme }) => css`
    align-items: center;
    border-top: 1px solid ${theme.colors.grayscale.light2};
    display: flex;
    justify-content: space-between;
    margin-top: ${theme.gridUnit * 3}px;
    padding-top: ${theme.gridUnit * 3}px;
  `}
`;

const ResetButton = styled.button`
  ${({ theme }) => css`
    background: transparent;
    border: 0;
    color: ${theme.colors.primary.base};
    cursor: pointer;
    font-size: ${theme.typography.sizes.s}px;
    padding: 0;

    &:disabled {
      color: ${theme.colors.grayscale.base};
      cursor: default;
    }
  `}
`;

const CountText = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.grayscale.base};
    font-size: ${theme.typography.sizes.s}px;
  `}
`;

function getSavedMetric(metric: QueryFormMetric, datasource?: Datasource) {
  const metricKey = getMetricKey(metric);
  return datasource?.metrics?.find(
    candidate =>
      candidate.metric_name === metricKey ||
      candidate.verbose_name === metricKey,
  );
}

function getDisplayLabel(
  metric: QueryFormMetric,
  datasource?: Datasource,
  configuredLabel?: string,
) {
  const savedMetric = getSavedMetric(metric, datasource);
  if (configuredLabel) {
    return configuredLabel;
  }
  if (savedMetric?.verbose_name) {
    return savedMetric.verbose_name;
  }
  return getMetricKey(metric);
}

function getDescription(
  metric: QueryFormMetric,
  datasource?: Datasource,
  configuredDescription?: string,
) {
  const savedMetric = getSavedMetric(metric, datasource);
  return configuredDescription || savedMetric?.description || undefined;
}

function getConfiguredEntry(
  metric: QueryFormMetric,
  entries: OptionalMetricEntry[],
) {
  const metricKey = getMetricKey(metric);
  return entries.find(entry => {
    const entryMetric = getMetricFromOptionalEntry(entry);
    return getMetricKey(entryMetric) === metricKey;
  });
}

function groupOptions(options: MetricOption[]) {
  return options.reduce<Record<string, MetricOption[]>>((groups, option) => {
    const key = option.group || t('Available');
    return {
      ...groups,
      [key]: [...(groups[key] || []), option],
    };
  }, {});
}

export default function OptionalMetricSelector({
  formData,
  datasource,
  activeMetrics,
  onChange,
  onReset,
  addDangerToast,
  logEvent,
  dashboardId,
  sliceId,
  onVisibleChange,
}: OptionalMetricSelectorProps) {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const settings = getOptionalMetricSettings(formData);

  const {
    defaultOptions,
    optionalOptions,
    orderedOptions,
    activeMetricKeys,
    maxActiveMetrics,
  } = useMemo(() => {
    const defaultMetrics = getDefaultMetrics(formData);
    const optionalMetrics = getOptionalMetrics(formData);
    const optionalEntries = ensureIsArray<OptionalMetricEntry>(
      formData.optional_metrics,
    );
    const defaultItems = defaultMetrics.map(metric => ({
      metric,
      key: getMetricKey(metric),
      label: getDisplayLabel(metric, datasource),
      description: getDescription(metric, datasource),
      isDefault: true,
    }));
    const optionalItems = optionalMetrics.map(metric => {
      const entry = getConfiguredEntry(metric, optionalEntries);
      return {
        metric,
        key: getMetricKey(metric),
        label: getDisplayLabel(
          metric,
          datasource,
          entry ? getOptionalMetricLabel(entry) : undefined,
        ),
        description: getDescription(
          metric,
          datasource,
          entry ? getOptionalMetricDescription(entry) : undefined,
        ),
        group: entry ? getOptionalMetricGroup(entry) : undefined,
        isDefault: false,
      };
    });
    const activeKeys = new Set(activeMetrics.map(getMetricKey));
    const lockedDefaultCount =
      settings.selectionMode === 'multi' &&
      !settings.allowDefaultMetricDeselection
        ? defaultItems.length
        : 0;

    return {
      defaultOptions: defaultItems,
      optionalOptions: optionalItems,
      orderedOptions: [...defaultItems, ...optionalItems],
      activeMetricKeys: activeKeys,
      maxActiveMetrics: Math.max(settings.maxActiveMetrics, lockedDefaultCount),
    };
  }, [activeMetrics, datasource, formData, settings]);

  if (!hasOptionalMetrics(formData)) {
    return null;
  }

  const lowerSearchText = searchText.toLowerCase();
  const visibleDefaultOptions = defaultOptions.filter(
    option =>
      !lowerSearchText ||
      option.label.toLowerCase().includes(lowerSearchText) ||
      option.description?.toLowerCase().includes(lowerSearchText),
  );
  const visibleOptionalOptions = optionalOptions.filter(
    option =>
      !lowerSearchText ||
      option.label.toLowerCase().includes(lowerSearchText) ||
      option.description?.toLowerCase().includes(lowerSearchText),
  );
  const optionalGroups = groupOptions(visibleOptionalOptions);
  const showSearch = settings.showSearch || orderedOptions.length > 10;
  const defaultMetricKeys = new Set(defaultOptions.map(({ key }) => key));
  const activeCount = activeMetricKeys.size;
  const resetDisabled =
    activeCount === defaultOptions.length &&
    defaultOptions.every(({ key }) => activeMetricKeys.has(key));

  const emitMetricEvent = (eventName: string, metric?: QueryFormMetric) => {
    logEvent?.(eventName, {
      dashboard_id: dashboardId,
      slice_id: sliceId,
      metric: metric ? getMetricKey(metric) : undefined,
      active_metric_count: activeCount,
      viz_type: formData.viz_type,
    });
  };

  const showLimitMessage = (message: string) => {
    addDangerToast?.(message);
    logEvent?.('optional_metric_limit_reached', {
      dashboard_id: dashboardId,
      slice_id: sliceId,
      active_metric_count: activeCount,
      viz_type: formData.viz_type,
    });
  };

  const orderActiveMetrics = (metrics: QueryFormMetric[]) => {
    const selectedKeys = new Set(metrics.map(getMetricKey));
    return orderedOptions
      .filter(({ key }) => selectedKeys.has(key))
      .map(({ metric }) => metric);
  };

  const selectMetric = (option: MetricOption, selected: boolean) => {
    const isSelected = activeMetricKeys.has(option.key);
    if (selected === isSelected) {
      return;
    }

    let nextMetrics: QueryFormMetric[];
    if (settings.selectionMode === 'single') {
      if (!selected) {
        showLimitMessage(t('At least one metric must remain selected.'));
        return;
      }
      nextMetrics = [option.metric];
    } else if (selected) {
      const withMetric = [...activeMetrics, option.metric];
      if (withMetric.length > maxActiveMetrics) {
        showLimitMessage(
          t('You can display up to %s metrics at a time.', maxActiveMetrics),
        );
        return;
      }
      nextMetrics = withMetric;
    } else {
      const isLockedDefault =
        defaultMetricKeys.has(option.key) &&
        !settings.allowDefaultMetricDeselection;
      if (isLockedDefault) {
        return;
      }
      nextMetrics = activeMetrics.filter(
        metric => getMetricKey(metric) !== option.key,
      );
      if (nextMetrics.length < settings.minActiveMetrics) {
        showLimitMessage(t('At least one metric must remain selected.'));
        return;
      }
    }

    const orderedMetrics = orderActiveMetrics(nextMetrics);
    onChange(orderedMetrics);
    emitMetricEvent(
      selected ? 'optional_metric_selected' : 'optional_metric_deselected',
      option.metric,
    );
  };

  const renderMetricOption = (option: MetricOption) => {
    const checked = activeMetricKeys.has(option.key);
    const lockedDefault =
      settings.selectionMode === 'multi' &&
      option.isDefault &&
      !settings.allowDefaultMetricDeselection;
    const disabled =
      lockedDefault ||
      (!checked &&
        settings.selectionMode === 'multi' &&
        activeCount >= maxActiveMetrics);
    const title = lockedDefault
      ? t('Default metric is locked')
      : disabled
        ? t('Maximum active metrics reached')
        : option.description;

    return (
      <Tooltip title={title} key={option.key}>
        <MetricRow $disabled={disabled}>
          <AntdCheckbox
            checked={checked}
            disabled={disabled}
            onChange={event => selectMetric(option, event.target.checked)}
          />
          <MetricText>
            <MetricName>{option.label}</MetricName>
            {option.description && (
              <MetricDescription>{option.description}</MetricDescription>
            )}
          </MetricText>
        </MetricRow>
      </Tooltip>
    );
  };

  const content = (
    <MenuContent
      role="dialog"
      aria-label={t('Select metrics')}
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
    >
      <MenuHeader>{t('Metrics')}</MenuHeader>
      {showSearch && (
        <Input
          aria-label={t('Search metrics')}
          allowClear
          onChange={event => setSearchText(event.target.value)}
          placeholder={t('Search metrics...')}
          prefix={<Icons.SearchOutlined />}
          value={searchText}
        />
      )}
      {visibleDefaultOptions.length > 0 && (
        <MetricSection>
          <SectionTitle>{t('Default')}</SectionTitle>
          {visibleDefaultOptions.map(renderMetricOption)}
        </MetricSection>
      )}
      {Object.entries(optionalGroups).map(([group, options]) => (
        <MetricSection key={group}>
          <SectionTitle>{group}</SectionTitle>
          {options.map(renderMetricOption)}
        </MetricSection>
      ))}
      <Footer>
        <CountText aria-live="polite">
          {t('%s of %s metrics selected', activeCount, maxActiveMetrics)}
        </CountText>
        <ResetButton
          disabled={resetDisabled}
          onClick={() => {
            onReset();
            emitMetricEvent('optional_metrics_reset');
          }}
          type="button"
        >
          {t('Reset to default')}
        </ResetButton>
      </Footer>
    </MenuContent>
  );

  return (
    <Popover
      content={content}
      onVisibleChange={nextVisible => {
        setVisible(nextVisible);
        onVisibleChange?.(nextVisible);
        if (nextVisible) {
          logEvent?.('optional_metrics_menu_opened', {
            dashboard_id: dashboardId,
            slice_id: sliceId,
            active_metric_count: activeCount,
            viz_type: formData.viz_type,
          });
        }
      }}
      placement="bottomRight"
      trigger="click"
      visible={visible}
    >
      <Tooltip title={t('Select metrics')}>
        <TriggerButton
          $active={visible || !resetDisabled}
          aria-expanded={visible}
          aria-haspopup="dialog"
          aria-label={t('Select metrics')}
          data-test="optional-metric-selector-trigger"
          type="button"
        >
          <Icons.BarChartOutlined />
        </TriggerButton>
      </Tooltip>
    </Popover>
  );
}
