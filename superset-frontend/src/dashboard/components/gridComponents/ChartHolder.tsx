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
import { useState, useMemo, useCallback, useEffect } from 'react';

import { ResizeCallback, ResizeStartCallback } from 're-resizable';
import cx from 'classnames';
import { useSelector } from 'react-redux';
import { css, useTheme } from '@superset-ui/core';
import { LayoutItem, RootState } from 'src/dashboard/types';
import AnchorLink from 'src/dashboard/components/AnchorLink';
import Chart from 'src/dashboard/containers/Chart';
import DeleteComponentButton from 'src/dashboard/components/DeleteComponentButton';
import { Draggable } from 'src/dashboard/components/dnd/DragDroppable';
import HoverMenu from 'src/dashboard/components/menu/HoverMenu';
import ResizableContainer from 'src/dashboard/components/resizable/ResizableContainer';
import getChartAndLabelComponentIdFromPath from 'src/dashboard/util/getChartAndLabelComponentIdFromPath';
import useFilterFocusHighlightStyles from 'src/dashboard/util/useFilterFocusHighlightStyles';
import { COLUMN_TYPE, ROW_TYPE } from 'src/dashboard/util/componentTypes';
import {
  GRID_BASE_UNIT,
  GRID_GUTTER_SIZE,
  GRID_MIN_COLUMN_COUNT,
  GRID_MIN_ROW_UNITS,
} from 'src/dashboard/util/constants';
import getFormDataWithExtraFilters from 'src/dashboard/util/charts/getFormDataWithExtraFilters';
import { getAppliedFilterValues } from 'src/dashboard/util/activeDashboardFilters';

export const CHART_MARGIN = 32;

interface ChartHolderProps {
  id: string;
  parentId: string;
  dashboardId: number;
  component: LayoutItem;
  parentComponent: LayoutItem;
  getComponentById?: (id?: string) => LayoutItem | undefined;
  index: number;
  depth: number;
  editMode: boolean;
  directPathLastUpdated?: number;
  fullSizeChartId: number | null;
  isComponentVisible: boolean;

  // grid related
  availableColumnCount: number;
  columnWidth: number;
  onResizeStart: ResizeStartCallback;
  onResize: ResizeCallback;
  onResizeStop: ResizeCallback;

  // dnd
  deleteComponent: (id: string, parentId: string) => void;
  updateComponents: Function;
  handleComponentDrop: (...args: unknown[]) => unknown;
  setFullSizeChartId: (chartId: number | null) => void;
  isInView: boolean;
}

const ChartHolder: React.FC<ChartHolderProps> = ({
  id,
  parentId,
  component,
  parentComponent,
  index,
  depth,
  availableColumnCount,
  columnWidth,
  onResizeStart,
  onResize,
  onResizeStop,
  editMode,
  isComponentVisible,
  dashboardId,
  fullSizeChartId,
  getComponentById = () => undefined,
  deleteComponent,
  updateComponents,
  handleComponentDrop,
  setFullSizeChartId,
  isInView,
}) => {
  const theme = useTheme();
  const fullSizeStyle = css`
    && {
      position: fixed;
      z-index: 3000;
      left: 0;
      top: 0;
      padding: ${theme.gridUnit * 2}px;
    }
  `;
  const { chartId } = component.meta;
  const isFullSize = fullSizeChartId === chartId;

  // Control HTML root overflow when in fullscreen mode
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isFullSize) {
      // Store original overflow value
      const originalOverflow = htmlElement.style.overflow;
      htmlElement.style.overflow = 'hidden';

      // Cleanup function to restore original overflow
      return () => {
        htmlElement.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [isFullSize]);

  const focusHighlightStyles = useFilterFocusHighlightStyles(chartId);
  const dashboardState = useSelector(
    (state: RootState) => state.dashboardState,
  );
  const charts = useSelector((state: RootState) => state.charts);
  const dashboardInfo = useSelector((state: RootState) => state.dashboardInfo);
  const dataMask = useSelector((state: RootState) => state.dataMask);
  const nativeFilters = useSelector((state: RootState) => state.nativeFilters);
  const [extraControls, setExtraControls] = useState<Record<string, unknown>>(
    {},
  );
  const [outlinedComponentId, setOutlinedComponentId] = useState<string>();
  const [outlinedColumnName, setOutlinedColumnName] = useState<string>();
  const [currentDirectPathLastUpdated, setCurrentDirectPathLastUpdated] =
    useState(0);

  const directPathToChild = useMemo(
    () => dashboardState?.directPathToChild ?? [],
    [dashboardState],
  );

  const directPathLastUpdated = useMemo(
    () => dashboardState?.directPathLastUpdated ?? 0,
    [dashboardState],
  );

  const infoFromPath = useMemo(
    () => getChartAndLabelComponentIdFromPath(directPathToChild) as any,
    [directPathToChild],
  );

  // Calculate if the chart should be outlined
  useEffect(() => {
    const { label: columnName, chart: chartComponentId } = infoFromPath;

    if (
      directPathLastUpdated !== currentDirectPathLastUpdated &&
      component.id === chartComponentId
    ) {
      setCurrentDirectPathLastUpdated(directPathLastUpdated);
      setOutlinedComponentId(component.id);
      setOutlinedColumnName(columnName);
    }
  }, [
    component,
    currentDirectPathLastUpdated,
    directPathLastUpdated,
    infoFromPath,
  ]);

  // Remove the chart outline after a defined time
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (outlinedComponentId) {
      timerId = setTimeout(() => {
        setOutlinedComponentId(undefined);
        setOutlinedColumnName(undefined);
      }, 2000);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [outlinedComponentId]);

  const widthMultiple = useMemo(() => {
    const columnParentWidth = getComponentById(
      parentComponent.parents?.find(parent => parent.startsWith(COLUMN_TYPE)),
    )?.meta?.width;

    let widthMultiple = component.meta.width || GRID_MIN_COLUMN_COUNT;
    if (parentComponent.type === COLUMN_TYPE) {
      widthMultiple = parentComponent.meta.width || GRID_MIN_COLUMN_COUNT;
    } else if (columnParentWidth && widthMultiple > columnParentWidth) {
      widthMultiple = columnParentWidth;
    }

    return widthMultiple;
  }, [
    component,
    getComponentById,
    parentComponent.meta.width,
    parentComponent.parents,
    parentComponent.type,
  ]);

  const { chartWidth, chartHeight } = useMemo(() => {
    let chartWidth = 0;
    let chartHeight = 0;

    if (isFullSize) {
      chartWidth = window.innerWidth - CHART_MARGIN;
      chartHeight = window.innerHeight - CHART_MARGIN;
    } else {
      chartWidth = Math.floor(
        widthMultiple * columnWidth +
          (widthMultiple - 1) * GRID_GUTTER_SIZE -
          CHART_MARGIN,
      );
      chartHeight = Math.floor(
        component.meta.height * GRID_BASE_UNIT - CHART_MARGIN,
      );
    }

    return {
      chartWidth,
      chartHeight,
    };
  }, [columnWidth, component, isFullSize, widthMultiple]);

  const handleDeleteComponent = useCallback(() => {
    deleteComponent(id, parentId);
  }, [deleteComponent, id, parentId]);

  const handleUpdateSliceName = useCallback(
    (nextName: string) => {
      updateComponents({
        [component.id]: {
          ...component,
          meta: {
            ...component.meta,
            sliceNameOverride: nextName,
          },
        },
      });
    },
    [component, updateComponents],
  );

  const handleToggleFullSize = useCallback(() => {
    setFullSizeChartId(isFullSize ? null : chartId);
  }, [chartId, isFullSize, setFullSizeChartId]);

  const handleExtraControl = useCallback((name: string, value: unknown) => {
    setExtraControls(current => ({
      ...current,
      [name]: value,
    }));
  }, []);

  // Clickable card support for BigNumber charts
  const clickableCardConfig = useMemo(() => {
    const chart = charts[chartId];
    if (!chart) return { redirectUrl: undefined };
    
    const vizType = chart.form_data?.viz_type;
    if (!['big_number', 'big_number_total', 'big_number_with_trendline', 'big_number_period_over_period'].includes(vizType)) {
      return { redirectUrl: undefined };
    }

    // Get formData with extraControls merged
    const chartPayload = chart as any;
    const formData = getFormDataWithExtraFilters({
      chart: chartPayload,
      chartConfiguration: dashboardInfo?.metadata?.chart_configuration || {},
      filters: getAppliedFilterValues(chartId.toString()),
      colorNamespace: (dashboardState as any)?.colorNamespace,
      colorScheme: dashboardState?.colorScheme,
      ownColorScheme: chart.form_data?.color_scheme,
      sliceId: chartId,
      nativeFilters: nativeFilters?.filters || {},
      allSliceIds: dashboardState?.sliceIds || [],
      dataMask,
      extraControls: extraControls as Record<string, string | boolean | null>,
      labelsColor: dashboardInfo?.metadata?.label_colors || {},
      labelsColorMap: dashboardInfo?.metadata?.map_label_colors || {},
      sharedLabelsColors: [],
    });

    if (!formData?.enable_clickable_card || !chart.queriesResponse) {
      return { redirectUrl: undefined };
    }

    // Extract redirectUrl
    const queriesData = Array.isArray(chart.queriesResponse) ? chart.queriesResponse : [chart.queriesResponse];
    const clickableCardUrl = formData.clickable_card_url as string | undefined;
    const urlColumn = formData.url_column as string | undefined;
    
    let redirectUrl: string | undefined = clickableCardUrl;
    if (!redirectUrl && urlColumn && queriesData[1]?.data?.[0]) {
      redirectUrl = queriesData[1].data[0][urlColumn] || Object.values(queriesData[1].data[0])[0] as string;
    }
    if (!redirectUrl && urlColumn && queriesData[0]?.data?.[0]) {
      const row = queriesData[0].data[0];
      redirectUrl = row[urlColumn] || ['MAX', 'MIN', 'ANY_VALUE', 'FIRST', 'LAST']
        .map(agg => row[`${agg}(${urlColumn})`])
        .find(Boolean) as string | undefined;
    }

    return { redirectUrl: typeof redirectUrl === 'string' ? redirectUrl : undefined };
  }, [charts, chartId, dashboardInfo, dashboardState, dataMask, nativeFilters, extraControls]);

  const handleCardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    
    if (editMode || !clickableCardConfig.redirectUrl || e.button === 2 || e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }
    
    // Allow clicks directly on the chart holder
    if (target === currentTarget) {
      if (clickableCardConfig.redirectUrl.match(/^https?:\/\//)) {
        window.open(clickableCardConfig.redirectUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    
    // Check for interactive elements within the chart holder (but not the chart holder itself)
    let element: HTMLElement | null = target;
    while (element && element !== currentTarget && currentTarget.contains(element)) {
      if (element.matches('a, button, input, select, textarea, [role="button"], [role="link"], [role="menuitem"], .slice-header-controls, .hover-menu, canvas, svg, .echarts-for-react, [class*="echarts"]')) {
        return;
      }
      element = element.parentElement;
    }
    
    if (e.defaultPrevented || (e.nativeEvent as any).dataTransfer?.effectAllowed) {
      return;
    }
    
    if (clickableCardConfig.redirectUrl.match(/^https?:\/\//)) {
      window.open(clickableCardConfig.redirectUrl, '_blank', 'noopener,noreferrer');
    }
  }, [clickableCardConfig, editMode]);

  return (
    <Draggable
      component={component}
      parentComponent={parentComponent}
      orientation={parentComponent.type === ROW_TYPE ? 'column' : 'row'}
      index={index}
      depth={depth}
      onDrop={handleComponentDrop}
      disableDragDrop={false}
      editMode={editMode}
    >
      {({ dragSourceRef }) => (
        <ResizableContainer
          id={component.id}
          adjustableWidth={parentComponent.type === ROW_TYPE}
          adjustableHeight
          widthStep={columnWidth}
          widthMultiple={widthMultiple}
          heightStep={GRID_BASE_UNIT}
          heightMultiple={component.meta.height}
          minWidthMultiple={GRID_MIN_COLUMN_COUNT}
          minHeightMultiple={GRID_MIN_ROW_UNITS}
          maxWidthMultiple={availableColumnCount + widthMultiple}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeStop={onResizeStop}
          editMode={editMode}
        >
          <div
            ref={dragSourceRef}
            data-test="dashboard-component-chart-holder"
            style={{
              ...focusHighlightStyles,
              cursor: clickableCardConfig.redirectUrl ? 'pointer' : 'default',
            }}
            css={isFullSize ? fullSizeStyle : undefined}
            className={cx(
              'dashboard-component',
              'dashboard-component-chart-holder',
              // The following class is added to support custom dashboard styling via the CSS editor
              `dashboard-chart-id-${chartId}`,
              outlinedComponentId ? 'fade-in' : 'fade-out',
              clickableCardConfig.redirectUrl ? 'clickable-card' : '',
            )}
            onClick={clickableCardConfig.redirectUrl && !editMode ? handleCardClick : undefined}
            role={clickableCardConfig.redirectUrl ? 'button' : undefined}
            tabIndex={clickableCardConfig.redirectUrl ? 0 : undefined}
            onKeyDown={clickableCardConfig.redirectUrl && !editMode ? (e) => {
              if ((e.key === 'Enter' || e.key === ' ') && clickableCardConfig.redirectUrl?.match(/^https?:\/\//)) {
                e.preventDefault();
                window.open(clickableCardConfig.redirectUrl, '_blank', 'noopener,noreferrer');
              }
            } : undefined}
          >
            {!editMode && (
              <AnchorLink
                id={component.id}
                scrollIntoView={outlinedComponentId === component.id}
              />
            )}
            {!!outlinedComponentId && (
              <style>
                {`label[for=${outlinedColumnName}] + .Select .Select__control {
                    border-color: #00736a;
                    transition: border-color 1s ease-in-out;
                  }`}
              </style>
            )}
            <Chart
              componentId={component.id}
              id={component.meta.chartId}
              dashboardId={dashboardId}
              width={chartWidth}
              height={chartHeight}
              sliceName={
                component.meta.sliceNameOverride ||
                component.meta.sliceName ||
                ''
              }
              updateSliceName={handleUpdateSliceName}
              isComponentVisible={isComponentVisible}
              handleToggleFullSize={handleToggleFullSize}
              isFullSize={isFullSize}
              setControlValue={handleExtraControl}
              extraControls={extraControls}
              isInView={isInView}
            />
            {editMode && (
              <HoverMenu position="top">
                <div data-test="dashboard-delete-component-button">
                  <DeleteComponentButton onDelete={handleDeleteComponent} />
                </div>
              </HoverMenu>
            )}
          </div>
        </ResizableContainer>
      )}
    </Draggable>
  );
};

export default ChartHolder;
