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
import moment, { Moment } from 'moment-timezone';
import {
  css,
  customTimeRangeDecode,
  NO_TIME_RANGE,
  styled,
  t,
} from '@superset-ui/core';
import { getCurrentTimezone } from 'src/utils/dateUtils';
import { resolveRelativeTimeRange } from 'src/utils/timezoneApiUtils';
import { customTimeRangeEncode } from '../../utils';
import {
  CurrentDay,
  CurrentMonth,
  CurrentWeek,
  CurrentYear,
  CustomRangeType,
  FrameType,
} from '../../types';
import { QuickRangeChips } from './QuickRangeChips';
import { TimePrecisionToggle } from './TimePrecisionToggle';
import { TimeRangePicker } from './TimeRangePicker';
import { QuickRangeOption } from './types';

const Root = styled.div`
  ${({ theme }) => css`
    .revamped-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${theme.gridUnit * 3}px;
      margin-bottom: ${theme.gridUnit * 2}px;
    }

    .revamped-section-title {
      color: ${theme.colors.grayscale.dark1};
      font-size: ${theme.typography.sizes.m}px;
      font-weight: ${theme.typography.weights.bold};
    }
  `}
`;

const QUICK_RANGE_OPTIONS: QuickRangeOption[] = [
  { value: 'Last day', label: t('Last 24hr'), frame: 'Common' },
  { value: CurrentDay, label: t('Current Day'), frame: 'Current' },
  { value: 'Last week', label: t('Last 7 Days'), frame: 'Common' },
  { value: CurrentWeek, label: t('Current Week'), frame: 'Current' },
  { value: 'Last month', label: t('Last 30 Days'), frame: 'Common' },
  { value: CurrentMonth, label: t('Current Month'), frame: 'Current' },
  { value: CurrentYear, label: t('Current Year'), frame: 'Current' },
];

function getDefaultRange(timezone: string): [Moment, Moment] {
  const today = moment.tz(timezone);
  return [today.clone().startOf('day'), today.clone().endOf('day')];
}

function getRangeFromRelativeValue(
  value: string,
  timezone: string,
): [Moment, Moment] | undefined {
  const resolvedRange = resolveRelativeTimeRange(value, timezone);
  const parts = resolvedRange.split(' : ');
  if (parts.length !== 2 || resolvedRange === value) {
    return undefined;
  }

  const start = moment.tz(parts[0], timezone);
  const end = moment.tz(parts[1], timezone);
  if (!start.isValid() || !end.isValid()) {
    return undefined;
  }

  return [start, end];
}

function getRangeFromCustomValue(
  value: string,
  timezone: string,
): [Moment, Moment] | undefined {
  const { customRange, matchedFlag } = customTimeRangeDecode(value);
  if (!matchedFlag) {
    return undefined;
  }

  const start = moment.utc(customRange.sinceDatetime).tz(timezone);
  const end = moment.utc(customRange.untilDatetime).tz(timezone);
  if (!start.isValid() || !end.isValid()) {
    return undefined;
  }

  return [start, end];
}

function getPickerRange(value: string, timezone: string): [Moment, Moment] {
  if (value !== NO_TIME_RANGE) {
    const relativeRange = getRangeFromRelativeValue(value, timezone);
    if (relativeRange) {
      return relativeRange;
    }

    const customRange = getRangeFromCustomValue(value, timezone);
    if (customRange) {
      return customRange;
    }
  }

  return getDefaultRange(timezone);
}

function shouldIncludeTime(value: string, timezone: string): boolean {
  const customRange = getRangeFromCustomValue(value, timezone);
  if (!customRange) {
    return false;
  }

  const [start, end] = customRange;
  return !(
    start.hours() === 0 &&
    start.minutes() === 0 &&
    start.seconds() === 0 &&
    end.hours() === 23 &&
    end.minutes() === 59 &&
    end.seconds() === 59
  );
}

function encodeCustomRange(
  range: [Moment, Moment],
  includeTime: boolean,
): string {
  const [start, end] = range;
  const customRange: CustomRangeType = {
    sinceMode: 'specific',
    sinceDatetime: includeTime
      ? start.clone().utc().toISOString()
      : start.clone().startOf('day').utc().toISOString(),
    sinceGrain: 'day',
    sinceGrainValue: -7,
    untilMode: 'specific',
    untilDatetime: includeTime
      ? end.clone().utc().toISOString()
      : end.clone().endOf('day').utc().toISOString(),
    untilGrain: 'day',
    untilGrainValue: 7,
    anchorMode: 'now',
    anchorValue: 'now',
  };

  return customTimeRangeEncode(customRange);
}

type RevampedDateFilterProps = {
  frame: FrameType;
  onChange: (timeRange: string) => void;
  onFrameChange: (frame: FrameType) => void;
  value: string;
};

export function RevampedDateFilter({
  frame,
  onChange,
  onFrameChange,
  value,
}: RevampedDateFilterProps) {
  const timezone = getCurrentTimezone();
  const [includeTime, setIncludeTime] = useState(() =>
    shouldIncludeTime(value, timezone),
  );
  const pickerRange = useMemo(
    () => getPickerRange(value, timezone),
    [timezone, value],
  );
  const handleCustomRangeChange = (range: [Moment, Moment]) => {
    onFrameChange('Custom');
    onChange(encodeCustomRange(range, includeTime));
  };

  const handleIncludeTimeChange = (checked: boolean) => {
    setIncludeTime(checked);
    if (frame === 'Custom') {
      onChange(encodeCustomRange(pickerRange, checked));
    }
  };

  const handleQuickRangeSelect = (option: QuickRangeOption) => {
    onFrameChange(option.frame);
    if (option.frame === 'Custom') {
      onChange(encodeCustomRange(pickerRange, includeTime));
      return;
    }
    onChange(option.value);
  };

  return (
    <Root data-test="revamped-date-filter">
      <div className="revamped-section-header">
        <div className="revamped-section-title">{t('Select date range')}</div>
        <TimePrecisionToggle
          checked={includeTime}
          onChange={handleIncludeTimeChange}
        />
      </div>
      <TimeRangePicker
        includeTime={includeTime}
        value={pickerRange}
        onChange={handleCustomRangeChange}
      />
      <QuickRangeChips
        activeValue={value}
        options={QUICK_RANGE_OPTIONS}
        onSelect={handleQuickRangeSelect}
      />
    </Root>
  );
}
