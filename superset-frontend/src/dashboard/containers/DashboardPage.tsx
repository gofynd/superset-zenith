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
import { createContext, lazy, FC, useEffect, useMemo, useRef } from 'react';
import { Global } from '@emotion/react';
import { useHistory } from 'react-router-dom';
import { t, useTheme } from '@superset-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { useToasts } from 'src/components/MessageToasts/withToasts';
import Loading from 'src/components/Loading';
import {
  useDashboard,
  useDashboardCharts,
  useDashboardDatasets,
} from 'src/hooks/apiResources';
import { hydrateDashboard } from 'src/dashboard/actions/hydrate';
import { setDatasources } from 'src/dashboard/actions/datasources';
import injectCustomCss from 'src/dashboard/util/injectCustomCss';

import { LocalStorageKeys, setItem } from 'src/utils/localStorageHelpers';
import { URL_PARAMS } from 'src/constants';
import { getUrlParam } from 'src/utils/urlUtils';
import { setDatasetsStatus } from 'src/dashboard/actions/dashboardState';
import {
  getFilterValue,
  getPermalinkValue,
} from 'src/dashboard/components/nativeFilters/FilterBar/keyValue';
import DashboardContainer from 'src/dashboard/containers/Dashboard';

import { nanoid } from 'nanoid';
import { RootState } from '../types';
import {
  chartContextMenuStyles,
  filterCardPopoverStyle,
  focusStyle,
  headerStyles,
  chartHeaderStyles,
} from '../styles';
import SyncDashboardState, {
  getDashboardContextLocalStorage,
} from '../components/SyncDashboardState';

export const DashboardPageIdContext = createContext('');

const DashboardBuilder = lazy(
  () =>
    import(
      /* webpackChunkName: "DashboardContainer" */
      /* webpackPreload: true */
      'src/dashboard/components/DashboardBuilder/DashboardBuilder'
    ),
);

const originalDocumentTitle = document.title;

type SnapshotStatus = 'loading' | 'completed' | 'failed';
type SnapshotError = {
  message: string;
  status?: number;
  statusText?: string;
} | null;


type SnapshotWindow = Window & {
  __SNAPSHOT_STATUS__?: SnapshotStatus;
  __SNAPSHOT_READY__?: boolean;
  __SNAPSHOT_ERROR__?: SnapshotError;
};

const SNAPSHOT_TERMINAL_CHART_STATUSES = [
  'success',
  'rendered',
  'failed',
  'stopped',
];

function normalizeSnapshotError(error: any): SnapshotError {
  if (!error) return null;
  return {
    message: error.message || 'Dashboard failed to load',
    status: error.status,
    statusText: error.statusText,
  };
}


function syncSnapshotWindowState(status: SnapshotStatus, error: SnapshotError) {
  if (typeof window === 'undefined') return;
  const snapshotWindow = window as SnapshotWindow;
  /* eslint-disable no-underscore-dangle */
  snapshotWindow.__SNAPSHOT_STATUS__ = status;
  snapshotWindow.__SNAPSHOT_READY__ =
    status === 'completed' || status === 'failed';
  snapshotWindow.__SNAPSHOT_ERROR__ = status === 'failed' ? error : null;
  /* eslint-enable no-underscore-dangle */
}

type PageProps = {
  idOrSlug: string;
};

export const DashboardPage: FC<PageProps> = ({ idOrSlug }: PageProps) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const history = useHistory();
  const dashboardPageId = useMemo(() => nanoid(), []);
  const hasDashboardInfoInitiated = useSelector<RootState, Boolean>(
    ({ dashboardInfo }) =>
      dashboardInfo && Object.keys(dashboardInfo).length > 0,
  );
  const chartQueries = useSelector<RootState, RootState['charts']>(
    ({ charts }) => charts,
  );
  const sliceIds = useSelector<RootState, number[]>(
    ({ dashboardState }) => dashboardState?.sliceIds || [],
  );
  const { addDangerToast } = useToasts();
  const { result: dashboard, error: dashboardApiError } =
    useDashboard(idOrSlug);
  const { result: charts, error: chartsApiError } =
    useDashboardCharts(idOrSlug);
  const {
    result: datasets,
    error: datasetsApiError,
    status,
  } = useDashboardDatasets(idOrSlug);
  const isDashboardHydrated = useRef(false);

  const error = dashboardApiError || chartsApiError;
  const readyToRender = Boolean(dashboard && charts);
  const { dashboard_title, css, id = 0 } = dashboard || {};

  useEffect(() => {
    if (error) {
      syncSnapshotWindowState('failed', normalizeSnapshotError(error));
      return;
    }

    if (!readyToRender || !hasDashboardInfoInitiated) {
      syncSnapshotWindowState('loading', null);
      return;
    }

    const trackedChartIds = sliceIds.length
      ? sliceIds
      : Object.keys(chartQueries).map(chartId => Number(chartId));

    const isComplete =
      trackedChartIds.length === 0 ||
      trackedChartIds.every((chartId) =>
        SNAPSHOT_TERMINAL_CHART_STATUSES.includes(
          chartQueries[chartId]?.chartStatus as any,
        ),
      );

    syncSnapshotWindowState(isComplete ? 'completed' : 'loading', null);
  }, [chartQueries, error, hasDashboardInfoInitiated, readyToRender, sliceIds]);

  useEffect(() => {
    // mark tab id as redundant when user closes browser tab - a new id will be
    // generated next time user opens a dashboard and the old one won't be reused
    const handleTabClose = () => {
      const dashboardsContexts = getDashboardContextLocalStorage();
      setItem(LocalStorageKeys.DashboardExploreContext, {
        ...dashboardsContexts,
        [dashboardPageId]: {
          ...dashboardsContexts[dashboardPageId],
          isRedundant: true,
        },
      });
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [dashboardPageId]);

  useEffect(() => {
    dispatch(setDatasetsStatus(status));
  }, [dispatch, status]);

  useEffect(() => {
    // eslint-disable-next-line consistent-return
    async function getDataMaskApplied() {
      const permalinkKey = getUrlParam(URL_PARAMS.permalinkKey);
      const nativeFilterKeyValue = getUrlParam(URL_PARAMS.nativeFiltersKey);
      const isOldRison = getUrlParam(URL_PARAMS.nativeFilters);

      let dataMask = nativeFilterKeyValue || {};
      // activeTabs is initialized with undefined so that it doesn't override
      // the currently stored value when hydrating
      let activeTabs: string[] | undefined;
      if (permalinkKey) {
        const permalinkValue = await getPermalinkValue(permalinkKey);
        if (permalinkValue) {
          ({ dataMask, activeTabs } = permalinkValue.state);
        }
      } else if (nativeFilterKeyValue) {
        dataMask = await getFilterValue(id, nativeFilterKeyValue);
      }
      if (isOldRison) {
        dataMask = isOldRison;
      }

      if (readyToRender) {
        if (!isDashboardHydrated.current) {
          isDashboardHydrated.current = true;
        }
        dispatch(
          hydrateDashboard({
            history,
            dashboard,
            charts,
            activeTabs,
            dataMask,
          }),
        );
      }
      return null;
    }
    if (id) getDataMaskApplied();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToRender]);

  useEffect(() => {
    if (dashboard_title) {
      document.title = dashboard_title;
    }
    return () => {
      document.title = originalDocumentTitle;
    };
  }, [dashboard_title]);

  useEffect(() => {
    if (typeof css === 'string') {
      // returning will clean up custom css
      // when dashboard unmounts or changes
      return injectCustomCss(css);
    }
    return () => {};
  }, [css]);

  useEffect(() => {
    if (datasetsApiError) {
      addDangerToast(
        t('Error loading chart datasources. Filters may not work correctly.'),
      );
    } else {
      dispatch(setDatasources(datasets));
    }
  }, [addDangerToast, datasets, datasetsApiError, dispatch]);

  if (error) throw error; // caught in error boundary
  if (!readyToRender || !hasDashboardInfoInitiated) return <Loading />;

  return (
    <>
      <Global
        styles={[
          filterCardPopoverStyle(theme),
          headerStyles(theme),
          chartContextMenuStyles(theme),
          focusStyle(theme),
          chartHeaderStyles(theme),
        ]}
      />
      <SyncDashboardState dashboardPageId={dashboardPageId} />
      <DashboardPageIdContext.Provider value={dashboardPageId}>
        <DashboardContainer>
          <DashboardBuilder />
        </DashboardContainer>
      </DashboardPageIdContext.Provider>
    </>
  );
};

export default DashboardPage;
