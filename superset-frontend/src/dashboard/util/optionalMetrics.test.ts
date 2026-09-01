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
  applyActiveMetricsToFormData,
  getDefaultMetrics,
  getOptionalMetricSettings,
  getOptionalMetrics,
  hasOptionalMetrics,
} from './optionalMetrics';

test('getDefaultMetrics reads multi-metric charts', () => {
  expect(getDefaultMetrics({ metrics: ['net_sales', 'orders'] })).toEqual([
    'net_sales',
    'orders',
  ]);
});

test('getDefaultMetrics reads single metric charts', () => {
  expect(getDefaultMetrics({ metric: 'net_sales' })).toEqual(['net_sales']);
});

test('getOptionalMetrics excludes metrics already shown by default', () => {
  expect(
    getOptionalMetrics({
      metrics: ['net_sales'],
      optional_metrics: ['net_sales', 'orders', 'units'],
    }),
  ).toEqual(['orders', 'units']);
});

test('getOptionalMetricSettings infers single mode for big number charts', () => {
  expect(
    getOptionalMetricSettings({
      viz_type: 'big_number_total',
      metric: 'net_sales',
      optional_metrics: ['orders'],
    }),
  ).toMatchObject({
    enabled: true,
    selectionMode: 'single',
    minActiveMetrics: 1,
    maxActiveMetrics: 1,
  });
});

test('getOptionalMetricSettings honors an explicit multi mode', () => {
  expect(
    getOptionalMetricSettings({
      viz_type: 'big_number_total',
      metric: 'net_sales',
      optional_metrics: ['orders'],
      optional_metric_selection_mode: 'multi',
      optional_metric_max_active: 3,
    }),
  ).toMatchObject({
    selectionMode: 'multi',
    maxActiveMetrics: 3,
  });
});

test('hasOptionalMetrics requires enabled optional metric configuration', () => {
  expect(
    hasOptionalMetrics({
      metrics: ['net_sales'],
      optional_metrics: ['orders'],
    }),
  ).toBe(true);
  expect(
    hasOptionalMetrics({
      metrics: ['net_sales'],
      optional_metrics: ['orders'],
      enable_optional_metrics: false,
    }),
  ).toBe(false);
});

test('applyActiveMetricsToFormData updates metrics without mutating defaults', () => {
  const formData = {
    metrics: ['net_sales'],
    optional_metrics: ['orders'],
    timeseries_limit_metric: 'orders',
  };

  expect(
    applyActiveMetricsToFormData(formData, ['net_sales', 'orders']),
  ).toEqual({
    ...formData,
    metrics: ['net_sales', 'orders'],
    timeseries_limit_metric: 'orders',
  });
  expect(formData.metrics).toEqual(['net_sales']);
});

test('applyActiveMetricsToFormData reverts removed sort metrics', () => {
  expect(
    applyActiveMetricsToFormData(
      {
        metrics: ['net_sales'],
        optional_metrics: ['orders'],
        timeseries_limit_metric: 'orders',
      },
      ['net_sales'],
    ),
  ).toMatchObject({
    metrics: ['net_sales'],
    timeseries_limit_metric: 'net_sales',
  });
});

test('applyActiveMetricsToFormData updates single metric charts', () => {
  expect(
    applyActiveMetricsToFormData(
      {
        viz_type: 'big_number_total',
        metric: 'net_sales',
        optional_metrics: ['orders'],
      },
      ['orders'],
    ),
  ).toMatchObject({
    metric: 'orders',
  });
});
