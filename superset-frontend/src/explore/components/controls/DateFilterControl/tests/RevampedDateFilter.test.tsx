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
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import userEvent from '@testing-library/user-event';
import { FeatureFlag } from '@superset-ui/core';
import { render, screen } from 'spec/helpers/testing-library';
import DateFilterLabel from '../DateFilterLabel';
import { DateFilterControlProps } from '../types';
import { DateFilterTestKey } from '../utils';

const mockStore = configureStore([thunk]);

const defaultProps = {
  onChange: jest.fn(),
  onClosePopover: jest.fn(),
  onOpenPopover: jest.fn(),
  value: 'Current day',
};

function setup(props: Omit<DateFilterControlProps, 'name'> = defaultProps) {
  return render(
    <Provider store={mockStore({})}>
      <DateFilterLabel name="time_range" {...props} />
    </Provider>,
  );
}

beforeEach(() => {
  window.featureFlags = {};
  jest.clearAllMocks();
});

afterEach(() => {
  window.featureFlags = {};
});

test('renders the legacy date filter when inline picker flag is disabled', () => {
  window.featureFlags = {
    [FeatureFlag.DateFilterInlinePicker]: false,
  };

  setup();

  userEvent.click(screen.getByTestId(DateFilterTestKey.PopoverOverlay));

  expect(screen.getByText('RANGE TYPE')).toBeInTheDocument();
  expect(screen.getByText('Actual time range')).toBeInTheDocument();
  expect(screen.queryByTestId('revamped-date-filter')).not.toBeInTheDocument();
});

test('renders the revamped inline picker when feature flag is enabled', () => {
  window.featureFlags = {
    [FeatureFlag.DateFilterInlinePicker]: true,
  };

  setup();

  userEvent.click(screen.getByTestId(DateFilterTestKey.PopoverOverlay));

  expect(screen.getByTestId('revamped-date-filter')).toBeInTheDocument();
  expect(screen.getByText('Include time')).toBeInTheDocument();
  expect(screen.getByText('Last 24hr')).toBeInTheDocument();
  expect(screen.getByText('Current Year')).toBeInTheDocument();
  expect(screen.getByText('Start Date')).toBeInTheDocument();
  expect(screen.getByText('End Date')).toBeInTheDocument();
  expect(screen.queryByText('Custom range')).not.toBeInTheDocument();
  expect(screen.queryByText('Current quarter')).not.toBeInTheDocument();
  expect(screen.queryByText('previous calendar week')).not.toBeInTheDocument();
  expect(screen.queryByText('RANGE TYPE')).not.toBeInTheDocument();
  expect(screen.queryByText('Actual time range')).not.toBeInTheDocument();
});

test('keeps quick range values compatible with the legacy date filter', () => {
  window.featureFlags = {
    [FeatureFlag.DateFilterInlinePicker]: true,
  };
  const onChange = jest.fn();

  setup({
    ...defaultProps,
    onChange,
  });

  userEvent.click(screen.getByTestId(DateFilterTestKey.PopoverOverlay));
  userEvent.click(screen.getByText('Last 7 Days'));
  userEvent.click(screen.getByTestId(DateFilterTestKey.ApplyButton));

  expect(onChange).toHaveBeenCalledWith('Last week');
});
