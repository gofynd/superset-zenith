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
import userEvent from '@testing-library/user-event';
import { render, screen } from 'spec/helpers/testing-library';
import ReplaceAttributeSelector from '.';

const formData = {
  enable_replace_attribute: true,
  groupby: ['genre'],
  replace_attribute_target: 'genre',
  replace_attribute_attributes: ['platform', 'publisher'],
  replace_attribute_label: 'View by',
  viz_type: 'table',
};

const datasource = {
  columns: [
    { column_name: 'genre', groupby: true },
    { column_name: 'platform', groupby: true },
    { column_name: 'publisher', groupby: true },
  ],
} as any;

const createProps = (overrides = {}) => ({
  activeAttribute: null,
  dashboardId: 1,
  datasource,
  formData,
  logEvent: jest.fn(),
  onChange: jest.fn(),
  onReset: jest.fn(),
  sliceId: 10,
  ...overrides,
});

test('renders configured attributes inline on wider chart headers', () => {
  const props = createProps({ chartWidth: 700 });

  render(<ReplaceAttributeSelector {...props} />);

  expect(
    screen.getByTestId('replace-attribute-inline-selector'),
  ).toBeInTheDocument();
  expect(screen.getByText('View by')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'genre' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  expect(screen.getByRole('radio', { name: 'platform' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'publisher' })).toBeInTheDocument();

  userEvent.click(screen.getByRole('radio', { name: 'platform' }));

  expect(props.onChange).toHaveBeenCalledWith('platform');
});

test('uses a text trigger with menu options when the chart header is narrow', async () => {
  const props = createProps({ chartWidth: 320 });

  render(<ReplaceAttributeSelector {...props} />);

  expect(
    screen.queryByTestId('replace-attribute-inline-selector'),
  ).not.toBeInTheDocument();

  const trigger = screen.getByTestId('replace-attribute-selector-trigger');
  expect(trigger).toHaveTextContent('View by: genre');
  userEvent.click(trigger);

  expect(
    await screen.findByRole('dialog', { name: 'View chart by attribute' }),
  ).toHaveTextContent('platform');
});
