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
import { ChartsState, DashboardLayout } from 'src/dashboard/types';
import {
  CHART_TYPE,
  DASHBOARD_GRID_TYPE,
  DASHBOARD_ROOT_TYPE,
  ROW_TYPE,
  TABS_TYPE,
  TAB_TYPE,
} from 'src/dashboard/util/componentTypes';
import {
  DASHBOARD_GRID_ID,
  DASHBOARD_ROOT_ID,
} from 'src/dashboard/util/constants';
import {
  buildDashboardReadinessStatus,
  getCurrentViewChartIds,
  syncDashboardStatusWindowState,
} from './dashboardStatus';

function getLayoutWithTabs() {
  return {
    [DASHBOARD_ROOT_ID]: {
      type: DASHBOARD_ROOT_TYPE,
      id: DASHBOARD_ROOT_ID,
      children: [DASHBOARD_GRID_ID],
    },
    [DASHBOARD_GRID_ID]: {
      type: DASHBOARD_GRID_TYPE,
      id: DASHBOARD_GRID_ID,
      children: ['TABS-1'],
      parents: [DASHBOARD_ROOT_ID],
      meta: {},
    },
    'TABS-1': {
      type: TABS_TYPE,
      id: 'TABS-1',
      children: ['TAB-1', 'TAB-2'],
      parents: [DASHBOARD_ROOT_ID, DASHBOARD_GRID_ID],
      meta: {},
    },
    'TAB-1': {
      type: TAB_TYPE,
      id: 'TAB-1',
      children: ['ROW-1'],
      parents: [DASHBOARD_ROOT_ID, DASHBOARD_GRID_ID, 'TABS-1'],
      meta: {},
    },
    'ROW-1': {
      type: ROW_TYPE,
      id: 'ROW-1',
      children: ['CHART-1'],
      parents: [DASHBOARD_ROOT_ID, DASHBOARD_GRID_ID, 'TABS-1', 'TAB-1'],
      meta: {},
    },
    'CHART-1': {
      type: CHART_TYPE,
      id: 'CHART-1',
      children: [],
      parents: [
        DASHBOARD_ROOT_ID,
        DASHBOARD_GRID_ID,
        'TABS-1',
        'TAB-1',
        'ROW-1',
      ],
      meta: { chartId: 1 },
    },
    'TAB-2': {
      type: TAB_TYPE,
      id: 'TAB-2',
      children: ['ROW-2'],
      parents: [DASHBOARD_ROOT_ID, DASHBOARD_GRID_ID, 'TABS-1'],
      meta: {},
    },
    'ROW-2': {
      type: ROW_TYPE,
      id: 'ROW-2',
      children: ['CHART-2'],
      parents: [DASHBOARD_ROOT_ID, DASHBOARD_GRID_ID, 'TABS-1', 'TAB-2'],
      meta: {},
    },
    'CHART-2': {
      type: CHART_TYPE,
      id: 'CHART-2',
      children: [],
      parents: [
        DASHBOARD_ROOT_ID,
        DASHBOARD_GRID_ID,
        'TABS-1',
        'TAB-2',
        'ROW-2',
      ],
      meta: { chartId: 2 },
    },
  } as unknown as DashboardLayout;
}

type ChartFixture =
  | ChartsState[string]['chartStatus']
  | Partial<Pick<ChartsState[string], 'chartStatus' | 'queriesResponse'>>;

function getChartsState(charts: Record<number, ChartFixture>) {
  return Object.fromEntries(
    Object.entries(charts).map(([chartId, chartFixture]) => {
      const chart =
        chartFixture && typeof chartFixture === 'object'
          ? chartFixture
          : { chartStatus: chartFixture };

      return [chartId, { id: Number(chartId), ...chart }];
    }),
  ) as ChartsState;
}

test('getCurrentViewChartIds tracks only the active tab charts', () => {
  expect(getCurrentViewChartIds(getLayoutWithTabs(), ['TAB-1'])).toEqual([1]);
});

test('getCurrentViewChartIds defaults to the first tab when active tab state is empty', () => {
  expect(getCurrentViewChartIds(getLayoutWithTabs())).toEqual([1]);
});

test('buildDashboardReadinessStatus ignores inactive tab charts', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({ 1: 'rendered', 2: 'loading' }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('ready');
  expect(status.settled).toBe(true);
  expect(status.totalCharts).toBe(1);
  expect(status.pendingCharts).toBe(0);
});

test('buildDashboardReadinessStatus returns failed when all visible charts fail', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({ 1: 'failed', 2: 'loading' }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('failed');
  expect(status.settled).toBe(true);
  expect(status.failedCharts).toBe(1);
});

test('buildDashboardReadinessStatus returns ready when visible charts settle with mixed outcomes', () => {
  const dashboardLayout = getLayoutWithTabs();
  dashboardLayout['ROW-1'].children.push('CHART-3');
  dashboardLayout['CHART-3'] = {
    type: CHART_TYPE,
    id: 'CHART-3',
    children: [],
    parents: [DASHBOARD_ROOT_ID, DASHBOARD_GRID_ID, 'TABS-1', 'TAB-1', 'ROW-1'],
    meta: { chartId: 3 },
  } as DashboardLayout[string];

  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({ 1: 'failed', 3: 'rendered' }),
    dashboardLayout,
  });

  expect(status.status).toBe('ready');
  expect(status.settled).toBe(true);
  expect(status.totalCharts).toBe(2);
  expect(status.renderedCharts).toBe(1);
  expect(status.failedCharts).toBe(1);
});

test('buildDashboardReadinessStatus treats missing visible charts as settled failures', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({ 2: 'rendered' }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('failed');
  expect(status.settled).toBe(true);
  expect(status.failedCharts).toBe(1);
});

test('buildDashboardReadinessStatus stays loading while visible charts are pending', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({ 1: 'loading' }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('loading');
  expect(status.settled).toBe(false);
  expect(status.pendingCharts).toBe(1);
});

test('buildDashboardReadinessStatus treats successful no-data charts as rendered', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({
      1: { chartStatus: 'success', queriesResponse: [{ data: [] }] },
    }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('ready');
  expect(status.settled).toBe(true);
  expect(status.pendingCharts).toBe(0);
  expect(status.renderedCharts).toBe(1);
});

test('buildDashboardReadinessStatus treats successful empty response charts as rendered', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({
      1: { chartStatus: 'success', queriesResponse: [] },
    }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('ready');
  expect(status.settled).toBe(true);
  expect(status.pendingCharts).toBe(0);
  expect(status.renderedCharts).toBe(1);
});

test('buildDashboardReadinessStatus treats zero-row successful charts as rendered', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({
      1: {
        chartStatus: 'success',
        queriesResponse: [{ data: { series: [] }, rowcount: 0 }],
      },
    }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('ready');
  expect(status.settled).toBe(true);
  expect(status.pendingCharts).toBe(0);
  expect(status.renderedCharts).toBe(1);
});

test('buildDashboardReadinessStatus treats zero-sql-row successful charts as rendered', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({
      1: {
        chartStatus: 'success',
        queriesResponse: [{ data: { series: [] }, sql_rowcount: 0 }],
      },
    }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('ready');
  expect(status.settled).toBe(true);
  expect(status.pendingCharts).toBe(0);
  expect(status.renderedCharts).toBe(1);
});

test('buildDashboardReadinessStatus keeps successful data charts pending until rendered', () => {
  const status = buildDashboardReadinessStatus({
    activeTabs: ['TAB-1'],
    chartQueries: getChartsState({
      1: {
        chartStatus: 'success',
        queriesResponse: [{ data: [{ value: 1 }] }],
      },
    }),
    dashboardLayout: getLayoutWithTabs(),
  });

  expect(status.status).toBe('loading');
  expect(status.settled).toBe(false);
  expect(status.pendingCharts).toBe(1);
  expect(status.renderedCharts).toBe(0);
});

test('buildDashboardReadinessStatus returns ready for dashboards without visible charts', () => {
  const status = buildDashboardReadinessStatus({
    chartQueries: {},
    dashboardLayout: {
      [DASHBOARD_ROOT_ID]: {
        type: DASHBOARD_ROOT_TYPE,
        id: DASHBOARD_ROOT_ID,
        children: [DASHBOARD_GRID_ID],
      },
      [DASHBOARD_GRID_ID]: {
        type: DASHBOARD_GRID_TYPE,
        id: DASHBOARD_GRID_ID,
        children: [],
        parents: [DASHBOARD_ROOT_ID],
        meta: {},
      },
    } as unknown as DashboardLayout,
  });

  expect(status.status).toBe('ready');
  expect(status.settled).toBe(true);
  expect(status.totalCharts).toBe(0);
});

test('buildDashboardReadinessStatus returns failed for dashboard-level errors', () => {
  const status = buildDashboardReadinessStatus({
    chartQueries: {},
    dashboardLayout: getLayoutWithTabs(),
    error: { message: 'Dashboard failed', status: 500 },
  });

  expect(status.status).toBe('failed');
  expect(status.settled).toBe(true);
  expect(status.error).toEqual({
    message: 'Dashboard failed',
    status: 500,
  });
});

test('syncDashboardStatusWindowState writes the public dashboard status global', () => {
  const status = buildDashboardReadinessStatus({
    chartQueries: {},
    dashboardLayout: getLayoutWithTabs(),
  });

  syncDashboardStatusWindowState(status);

  /* eslint-disable no-underscore-dangle */
  expect(
    (
      window as Window & {
        __SUPERSET_DASHBOARD_STATUS__?: unknown;
      }
    ).__SUPERSET_DASHBOARD_STATUS__,
  ).toEqual(status);
  /* eslint-enable no-underscore-dangle */
});
