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
import { ActiveTabs, ChartsState, DashboardLayout } from 'src/dashboard/types';
import { CHART_TYPE, TABS_TYPE } from 'src/dashboard/util/componentTypes';
import { DASHBOARD_ROOT_ID } from 'src/dashboard/util/constants';
import {
  postEmbeddedDashboardFailure,
  resetEmbeddedFailureFlag,
} from 'src/utils/embeddedUtils';

export type DashboardStatus = 'loading' | 'ready' | 'failed';

export type DashboardStatusError = {
  message: string;
  status?: number;
  statusText?: string;
} | null;

export type DashboardReadinessStatus = {
  status: DashboardStatus;
  settled: boolean;
  totalCharts: number;
  pendingCharts: number;
  renderedCharts: number;
  failedCharts: number;
  error: DashboardStatusError;
};

export type DashboardStatusWindow = Window & {
  __SUPERSET_DASHBOARD_STATUS__?: DashboardReadinessStatus;
};

type ChartReadiness = 'pending' | 'rendered' | 'failed';
type ChartQueryResponse = {
  data?: unknown;
  error?: unknown;
  rowcount?: unknown;
  sql_rowcount?: unknown;
};

function queryResponseHasNoRows(response: ChartQueryResponse) {
  if (response.error) return false;

  if (typeof response.rowcount === 'number') {
    return response.rowcount === 0;
  }

  if (typeof response.sql_rowcount === 'number') {
    return response.sql_rowcount === 0;
  }

  return Array.isArray(response.data) && response.data.length === 0;
}

function isNoDataChart(chart: ChartsState[string]) {
  const queriesResponse = chart.queriesResponse as
    | ChartQueryResponse[]
    | null
    | undefined;

  if (!queriesResponse || queriesResponse.length === 0) {
    return true;
  }

  return (
    Array.isArray(queriesResponse) &&
    queriesResponse.every(queryResponseHasNoRows)
  );
}

function getChartReadiness(
  chart: ChartsState[string] | undefined,
): ChartReadiness {
  if (!chart) return 'failed';

  const { chartStatus } = chart;
  if (
    chartStatus === 'rendered' ||
    (chartStatus === 'success' && isNoDataChart(chart))
  ) {
    return 'rendered';
  }

  if (chartStatus === 'failed' || chartStatus === 'stopped') {
    return 'failed';
  }

  return 'pending';
}

export function normalizeDashboardStatusError(
  error: unknown,
): DashboardStatusError {
  if (!error) return null;

  if (typeof error !== 'object') {
    return { message: String(error) || 'Dashboard failed to load' };
  }

  const maybeError = error as {
    message?: unknown;
    status?: unknown;
    statusText?: unknown;
  };
  const status =
    typeof maybeError.status === 'number' && Number.isFinite(maybeError.status)
      ? maybeError.status
      : undefined;
  const statusText =
    typeof maybeError.statusText === 'string'
      ? maybeError.statusText
      : undefined;

  return {
    message:
      typeof maybeError.message === 'string'
        ? maybeError.message
        : 'Dashboard failed to load',
    ...(status !== undefined && { status }),
    ...(statusText !== undefined && { statusText }),
  };
}

export function getCurrentViewChartIds(
  dashboardLayout: DashboardLayout | undefined,
  activeTabs: ActiveTabs = [],
) {
  if (!dashboardLayout) return [];

  const chartIds = new Set<number>();
  const visitedComponentIds = new Set<string>();

  function visit(componentId: string | undefined) {
    if (!componentId || visitedComponentIds.has(componentId)) return;

    visitedComponentIds.add(componentId);
    const component = dashboardLayout[componentId];
    if (!component) return;

    if (component.type === CHART_TYPE) {
      const chartId = component.meta?.chartId;
      if (typeof chartId === 'number' && Number.isFinite(chartId)) {
        chartIds.add(chartId);
      }
      return;
    }

    if (component.type === TABS_TYPE) {
      visit(
        component.children?.find(tabId => activeTabs.includes(tabId)) ??
          component.children?.[0],
      );
      return;
    }

    component.children?.forEach(visit);
  }

  visit(DASHBOARD_ROOT_ID);
  return Array.from(chartIds);
}

export function buildDashboardReadinessStatus({
  activeTabs,
  chartQueries,
  dashboardLayout,
  error,
  isLoading = false,
}: {
  activeTabs?: ActiveTabs;
  chartQueries: ChartsState;
  dashboardLayout?: DashboardLayout;
  error?: unknown;
  isLoading?: boolean;
}): DashboardReadinessStatus {
  const chartIds = getCurrentViewChartIds(dashboardLayout, activeTabs);

  if (error) {
    return {
      status: 'failed',
      settled: true,
      totalCharts: chartIds.length,
      pendingCharts: 0,
      renderedCharts: 0,
      failedCharts: 0,
      error: normalizeDashboardStatusError(error),
    };
  }

  if (isLoading) {
    return {
      status: 'loading',
      settled: false,
      totalCharts: chartIds.length,
      pendingCharts: chartIds.length,
      renderedCharts: 0,
      failedCharts: 0,
      error: null,
    };
  }

  let pendingCharts = 0;
  let renderedCharts = 0;
  let failedCharts = 0;

  chartIds.forEach(chartId => {
    const readiness = getChartReadiness(chartQueries[chartId]);
    if (readiness === 'pending') pendingCharts += 1;
    if (readiness === 'rendered') renderedCharts += 1;
    if (readiness === 'failed') failedCharts += 1;
  });

  const settled = pendingCharts === 0;
  const allChartsFailed =
    settled && chartIds.length > 0 && failedCharts === chartIds.length;

  return {
    status: allChartsFailed ? 'failed' : settled ? 'ready' : 'loading',
    settled,
    totalCharts: chartIds.length,
    pendingCharts,
    renderedCharts,
    failedCharts,
    error: null,
  };
}

export function syncDashboardStatusWindowState(
  dashboardStatus: DashboardReadinessStatus,
) {
  if (typeof window === 'undefined') return;
  const dashboardWindow = window as DashboardStatusWindow;
  /* eslint-disable no-underscore-dangle */
  dashboardWindow.__SUPERSET_DASHBOARD_STATUS__ = dashboardStatus;
  /* eslint-enable no-underscore-dangle */

  if (dashboardStatus.status === 'loading') {
    resetEmbeddedFailureFlag();
  } else if (
    dashboardStatus.status === 'failed' &&
    dashboardStatus.failedCharts > 0
  ) {
    postEmbeddedDashboardFailure(dashboardStatus.failedCharts);
  }
}
