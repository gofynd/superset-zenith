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
import mockDatasource, { datasourceId } from 'spec/fixtures/mockDatasource';
import {
  applyActiveAttributeToFormData,
  getActiveAttributeLabel,
  getReplaceAttributeOptions,
  hasReplaceAttributes,
  renderViewerTitleTemplate,
} from './replaceAttributes';

const datasource = mockDatasource[datasourceId] as any;

test('hasReplaceAttributes requires enabled approved attributes', () => {
  expect(
    hasReplaceAttributes(
      {
        groupby: ['gender'],
        replace_attribute_attributes: ['name'],
      },
      datasource,
    ),
  ).toBe(true);
  expect(
    hasReplaceAttributes(
      {
        groupby: ['gender'],
        enable_replace_attribute: false,
        replace_attribute_attributes: ['name'],
      },
      datasource,
    ),
  ).toBe(false);
});

test('getReplaceAttributeOptions normalizes labels and groups from nested config', () => {
  expect(
    getReplaceAttributeOptions(
      {
        groupby: ['gender'],
        replace_attribute: {
          enabled: true,
          target: 'gender',
          attributes: [
            { column: 'name', label: 'Customer', group: 'People' },
            { column: 'state', label: 'State', group: 'Location' },
          ],
        },
      },
      datasource,
    ),
  ).toMatchObject([
    { key: 'gender', label: 'gender', isDefault: true },
    { key: 'name', label: 'Customer', group: 'People', isDefault: false },
    { key: 'state', label: 'State', group: 'Location', isDefault: false },
  ]);
});

test('hasReplaceAttributes allows replacements missing from trimmed dashboard datasource metadata', () => {
  expect(
    hasReplaceAttributes(
      {
        groupby: ['genre'],
        enable_replace_attribute: true,
        replace_attribute_target: 'genre',
        replace_attribute_attributes: ['platform', 'publisher'],
      },
      {
        ...datasource,
        columns: datasource.columns.filter(
          column => column.column_name === 'genre',
        ),
      },
    ),
  ).toBe(true);
});

test('applyActiveAttributeToFormData replaces target dimensions and attribute sorts', () => {
  const formData = {
    groupby: ['gender'],
    columns: ['gender'],
    series_columns: ['gender'],
    x_axis: 'gender',
    orderby: [['gender', true]],
    row_limit: 10,
    replace_attribute: {
      enabled: true,
      target: 'gender',
      attributes: [{ column: 'state', row_limit: 25 }],
    },
  };

  expect(
    applyActiveAttributeToFormData(formData, 'state', datasource),
  ).toMatchObject({
    groupby: ['state'],
    columns: ['state'],
    series_columns: ['state'],
    x_axis: 'state',
    orderby: [['state', true]],
    row_limit: 25,
    replace_attribute: {
      active_attribute: 'state',
      active_attribute_label: 'state',
    },
  });
  expect(formData.groupby).toEqual(['gender']);
});

test('renderViewerTitleTemplate resolves active attribute and metrics', () => {
  expect(
    renderViewerTitleTemplate({
      title: '{{ active_metrics }} by {{ active_attribute_label }}',
      formData: {
        groupby: ['gender'],
        replace_attribute: {
          enabled: true,
          target: 'gender',
          attributes: [{ column: 'state', label: 'State' }],
        },
      },
      datasource,
      activeAttribute: 'state',
      activeMetrics: ['sum__num', 'count'],
    }),
  ).toBe('sum__num, COUNT(*) by State');
});

test('getActiveAttributeLabel falls back to default attribute label', () => {
  expect(
    getActiveAttributeLabel(
      {
        groupby: ['gender'],
        replace_attribute_attributes: ['name'],
      },
      datasource,
    ),
  ).toBe('gender');
});
