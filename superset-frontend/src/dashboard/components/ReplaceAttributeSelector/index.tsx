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
import { Radio as AntdRadio } from 'antd';
import { css, styled, t } from '@superset-ui/core';
import type { QueryFormColumn } from '@superset-ui/core';
import Icons from 'src/components/Icons';
import { Input } from 'src/components/Input';
import Popover from 'src/components/Popover';
import { Tooltip } from 'src/components/Tooltip';
import type { Datasource } from 'src/dashboard/types';
import {
  getColumnKey,
  getReplaceAttributeOptions,
  getReplaceAttributeSettings,
} from 'src/dashboard/util/replaceAttributes';
import type { ReplaceAttributeOption } from 'src/dashboard/util/replaceAttributes';

type ReplaceAttributeSelectorProps = {
  formData: Record<string, any>;
  datasource?: Datasource;
  activeAttribute?: QueryFormColumn | null;
  chartWidth?: number;
  onChange: (attribute: QueryFormColumn) => void;
  onReset: () => void;
  logEvent?: (eventName: string, eventData?: object) => void;
  dashboardId?: number;
  sliceId?: number;
  onVisibleChange?: (visible: boolean) => void;
};

const INLINE_OPTION_LIMIT = 5;
const MIN_INLINE_SELECTOR_WIDTH = 520;

const InlineSelector = styled.div`
  ${({ theme }) => css`
    align-items: center;
    background: ${theme.colors.grayscale.light5};
    border: 1px solid ${theme.colors.grayscale.light2};
    border-radius: ${theme.borderRadius}px;
    display: inline-flex;
    height: ${theme.gridUnit * 7}px;
    max-width: min(100%, ${theme.gridUnit * 112}px);
    min-width: 0;
    overflow: hidden;
  `}
`;

const InlineLabel = styled.span`
  ${({ theme }) => css`
    align-items: center;
    border-right: 1px solid ${theme.colors.grayscale.light2};
    color: ${theme.colors.grayscale.base};
    display: inline-flex;
    flex: 0 0 auto;
    font-size: ${theme.typography.sizes.xs}px;
    font-weight: ${theme.typography.weights.normal};
    height: 100%;
    padding: 0 ${theme.gridUnit * 2}px;
    white-space: nowrap;
  `}
`;

const InlineOptions = styled.div`
  display: inline-flex;
  min-width: 0;
  overflow: hidden;
`;

const InlineOptionButton = styled.button<{ $active?: boolean }>`
  ${({ $active, theme }) => css`
    align-items: center;
    background: ${$active ? theme.colors.primary.light4 : 'transparent'};
    border: 0;
    border-right: 1px solid ${theme.colors.grayscale.light2};
    color: ${$active
      ? theme.colors.primary.dark1
      : theme.colors.grayscale.dark1};
    cursor: pointer;
    display: inline-flex;
    flex: 0 1 auto;
    font-size: ${theme.typography.sizes.s}px;
    font-weight: ${$active
      ? theme.typography.weights.bold
      : theme.typography.weights.normal};
    height: ${theme.gridUnit * 7 - 2}px;
    justify-content: center;
    max-width: ${theme.gridUnit * 24}px;
    min-width: ${theme.gridUnit * 12}px;
    overflow: hidden;
    padding: 0 ${theme.gridUnit * 2}px;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:last-of-type {
      border-right: 0;
    }

    &:hover,
    &:focus {
      background: ${theme.colors.primary.light4};
      color: ${theme.colors.primary.dark1};
      outline: none;
    }
  `}
`;

const MenuTriggerButton = styled.button<{ $active?: boolean }>`
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
    gap: ${theme.gridUnit}px;
    height: ${theme.gridUnit * 7}px;
    justify-content: center;
    max-width: ${theme.gridUnit * 48}px;
    min-width: 0;
    padding: 0 ${theme.gridUnit * 2}px;

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

    .trigger-label {
      font-size: ${theme.typography.sizes.s}px;
      font-weight: ${theme.typography.weights.normal};
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

const AttributeSection = styled.div`
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

const AttributeRow = styled.label`
  ${({ theme }) => css`
    align-items: flex-start;
    color: ${theme.colors.grayscale.dark2};
    cursor: pointer;
    display: flex;
    gap: ${theme.gridUnit * 2}px;
    margin: 0;
    padding: ${theme.gridUnit}px 0;

    .ant-radio-wrapper {
      margin-top: 1px;
    }
  `}
`;

const AttributeText = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const AttributeName = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.grayscale.dark2};
    font-size: ${theme.typography.sizes.s}px;
    overflow-wrap: anywhere;
  `}
`;

const AttributeDescription = styled.span`
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
    justify-content: flex-end;
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

function groupOptions(options: ReplaceAttributeOption[]) {
  return options.reduce<Record<string, ReplaceAttributeOption[]>>(
    (groups, option) => {
      const key = option.group || t('Available');
      return {
        ...groups,
        [key]: [...(groups[key] || []), option],
      };
    },
    {},
  );
}

export default function ReplaceAttributeSelector({
  formData,
  datasource,
  activeAttribute,
  chartWidth,
  onChange,
  onReset,
  logEvent,
  dashboardId,
  sliceId,
  onVisibleChange,
}: ReplaceAttributeSelectorProps) {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const settings = getReplaceAttributeSettings(formData);
  const options = useMemo(
    () => getReplaceAttributeOptions(formData, datasource),
    [datasource, formData],
  );

  if (!settings.enabled || !options.some(option => !option.isDefault)) {
    return null;
  }

  const activeKey =
    getColumnKey(activeAttribute ?? undefined) ||
    options.find(option => option.isDefault)?.key;
  const activeOption =
    options.find(option => option.key === activeKey) ??
    options.find(option => option.isDefault) ??
    options[0];
  const resetDisabled = Boolean(activeOption?.isDefault);
  const lowerSearchText = searchText.toLowerCase();
  const visibleOptions = options.filter(
    option =>
      !lowerSearchText ||
      option.label.toLowerCase().includes(lowerSearchText) ||
      option.description?.toLowerCase().includes(lowerSearchText),
  );
  const defaultOptions = visibleOptions.filter(option => option.isDefault);
  const replacementGroups = groupOptions(
    visibleOptions.filter(option => !option.isDefault),
  );
  const showSearch = options.length > 10;
  const showInlineSelector =
    options.length <= INLINE_OPTION_LIMIT &&
    (chartWidth === undefined || chartWidth >= MIN_INLINE_SELECTOR_WIDTH);

  const emitAttributeEvent = (
    eventName: string,
    option?: ReplaceAttributeOption,
  ) => {
    logEvent?.(eventName, {
      dashboard_id: dashboardId,
      slice_id: sliceId,
      active_attribute: option?.key,
      default_attribute: options.find(item => item.isDefault)?.key,
      viz_type: formData.viz_type,
    });
  };

  const selectAttribute = (option: ReplaceAttributeOption) => {
    if (option.key === activeOption?.key) {
      return;
    }
    if (option.isDefault) {
      onReset();
      emitAttributeEvent('attribute_reset_to_default', option);
      return;
    }
    onChange(option.column);
    emitAttributeEvent('attribute_replaced', option);
  };

  const renderAttributeOption = (option: ReplaceAttributeOption) => {
    const checked = option.key === activeOption?.key;
    return (
      <AttributeRow key={option.key}>
        <AntdRadio
          checked={checked}
          onChange={() => selectAttribute(option)}
          value={option.key}
        />
        <AttributeText>
          <AttributeName>{option.label}</AttributeName>
          {option.description && (
            <AttributeDescription>{option.description}</AttributeDescription>
          )}
        </AttributeText>
      </AttributeRow>
    );
  };

  const renderInlineOption = (option: ReplaceAttributeOption) => {
    const checked = option.key === activeOption?.key;
    return (
      <Tooltip title={option.description} key={option.key}>
        <InlineOptionButton
          $active={checked}
          aria-checked={checked}
          data-test="replace-attribute-inline-option"
          onClick={() => selectAttribute(option)}
          role="radio"
          type="button"
        >
          {option.label}
        </InlineOptionButton>
      </Tooltip>
    );
  };

  const content = (
    <MenuContent
      role="dialog"
      aria-label={t('View chart by attribute')}
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
    >
      <MenuHeader>{settings.label}</MenuHeader>
      {showSearch && (
        <Input
          aria-label={t('Search attributes')}
          allowClear
          onChange={event => setSearchText(event.target.value)}
          placeholder={t('Search attributes...')}
          prefix={<Icons.SearchOutlined />}
          value={searchText}
        />
      )}
      {defaultOptions.length > 0 && (
        <AttributeSection>
          <SectionTitle>{t('Default')}</SectionTitle>
          {defaultOptions.map(renderAttributeOption)}
        </AttributeSection>
      )}
      {Object.entries(replacementGroups).map(([group, groupedOptions]) => (
        <AttributeSection key={group}>
          <SectionTitle>{group}</SectionTitle>
          {groupedOptions.map(renderAttributeOption)}
        </AttributeSection>
      ))}
      <Footer>
        <ResetButton
          disabled={resetDisabled}
          onClick={() => {
            onReset();
            emitAttributeEvent('attribute_reset_to_default', activeOption);
          }}
          type="button"
        >
          {t('Reset to default')}
        </ResetButton>
      </Footer>
    </MenuContent>
  );

  if (showInlineSelector) {
    return (
      <InlineSelector
        aria-label={t('View chart by attribute')}
        data-test="replace-attribute-inline-selector"
        onClick={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        role="radiogroup"
      >
        <InlineLabel>{settings.label}</InlineLabel>
        <InlineOptions>{options.map(renderInlineOption)}</InlineOptions>
      </InlineSelector>
    );
  }

  return (
    <Popover
      content={content}
      onVisibleChange={nextVisible => {
        setVisible(nextVisible);
        onVisibleChange?.(nextVisible);
        if (nextVisible) {
          logEvent?.('replace_attribute_menu_opened', {
            dashboard_id: dashboardId,
            slice_id: sliceId,
            active_attribute: activeOption?.key,
            viz_type: formData.viz_type,
          });
        }
      }}
      placement="bottomRight"
      trigger="click"
      visible={visible}
    >
      <Tooltip title={t('%s: %s', settings.label, activeOption?.label)}>
        <MenuTriggerButton
          $active={visible || !resetDisabled}
          aria-expanded={visible}
          aria-haspopup="dialog"
          aria-label={t(
            'View chart by attribute. Currently %s.',
            activeOption?.label,
          )}
          data-test="replace-attribute-selector-trigger"
          type="button"
        >
          <Icons.FieldAbc />
          <span className="trigger-label">
            {t('%s: %s', settings.label, activeOption?.label)}
          </span>
          <Icons.DownOutlined />
        </MenuTriggerButton>
      </Tooltip>
    </Popover>
  );
}
