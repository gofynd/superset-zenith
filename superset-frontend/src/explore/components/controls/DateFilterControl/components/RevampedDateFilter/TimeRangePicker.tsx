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
import { useSelector } from 'react-redux';
import { Moment } from 'moment';
// @ts-ignore
import { locales } from 'antd/dist/antd-with-locales';
import { css, styled, t } from '@superset-ui/core';
import { InfoTooltipWithTrigger } from '@superset-ui/chart-controls';
import { DatePicker } from 'src/components/DatePicker';
import { ExplorePageState } from 'src/explore/types';
import { LOCALE_MAPPING } from '../../utils';

const PickerShell = styled.div`
  ${({ theme }) => css`
    margin-bottom: ${theme.gridUnit * 3}px;

    .revamped-date-fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: ${theme.gridUnit * 6}px;
    }

    .ant-picker {
      width: 100%;
    }

    @media (max-width: 767px) {
      .revamped-date-fields {
        grid-template-columns: 1fr;
        gap: ${theme.gridUnit * 3}px;
      }
    }
  `}
`;

type TimeRangePickerProps = {
  includeTime: boolean;
  value: [Moment, Moment];
  onChange: (range: [Moment, Moment]) => void;
};

export function TimeRangePicker({
  includeTime,
  value,
  onChange,
}: TimeRangePickerProps) {
  const localFromFlaskBabel = useSelector(
    (state: ExplorePageState) => state?.common?.locale,
  );
  const localeKey = localFromFlaskBabel
    ? LOCALE_MAPPING[localFromFlaskBabel as keyof typeof LOCALE_MAPPING]
    : undefined;
  const datePickerLocale = localeKey
    ? locales[localeKey]?.DatePicker
    : undefined;

  const handleStartChange = (datetime: Moment | null) => {
    if (datetime) {
      onChange([
        includeTime ? datetime : datetime.clone().startOf('day'),
        value[1],
      ]);
    }
  };

  const handleEndChange = (datetime: Moment | null) => {
    if (datetime) {
      onChange([
        value[0],
        includeTime ? datetime : datetime.clone().endOf('day'),
      ]);
    }
  };

  return (
    <PickerShell data-test="revamped-date-filter-picker">
      <div className="revamped-date-fields">
        <div>
          <div className="control-label">
            {t('Start Date')}{' '}
            <InfoTooltipWithTrigger
              tooltip={t('Start date included in time range')}
              placement="right"
            />
          </div>
          <DatePicker
            allowClear={false}
            format={includeTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
            locale={datePickerLocale}
            showTime={includeTime}
            value={value[0]}
            onChange={handleStartChange}
          />
        </div>
        <div>
          <div className="control-label">
            {t('End Date')}{' '}
            <InfoTooltipWithTrigger
              tooltip={t('End date excluded from time range')}
              placement="right"
            />
          </div>
          <DatePicker
            allowClear={false}
            format={includeTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
            locale={datePickerLocale}
            showTime={includeTime}
            value={value[1]}
            onChange={handleEndChange}
          />
        </div>
      </div>
    </PickerShell>
  );
}
