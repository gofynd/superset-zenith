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
import { FC, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import {
  css,
  getExtensionsRegistry,
  styled,
  t,
  keyframes,
  getNumberFormatter,
  NumberFormats,
} from '@superset-ui/core';
import { useUiConfig } from 'src/components/UiConfigContext';
import { Tooltip } from 'src/components/Tooltip';
import { useSelector } from 'react-redux';
import EditableTitle from 'src/components/EditableTitle';
import SliceHeaderControls, {
  SliceHeaderControlsProps,
} from 'src/dashboard/components/SliceHeaderControls';
import FiltersBadge from 'src/dashboard/components/FiltersBadge';
import Icons from 'src/components/Icons';
import { RootState } from 'src/dashboard/types';
import type { Datasource } from 'src/dashboard/types';
import { getSliceHeaderTooltip } from 'src/dashboard/util/getSliceHeaderTooltip';
import { DashboardPageIdContext } from 'src/dashboard/containers/DashboardPage';
import OptionalMetricSelector from 'src/dashboard/components/OptionalMetricSelector';
import ReplaceAttributeSelector from 'src/dashboard/components/ReplaceAttributeSelector';
import { hasReplaceAttributes } from 'src/dashboard/util/replaceAttributes';
import type { QueryFormColumn, QueryFormMetric } from '@superset-ui/core';

// Inline type definition to avoid import issues
interface BigNumberComparisonData {
  percentageChange: number;
  comparisonIndicator: 'positive' | 'negative' | 'neutral';
  previousPeriodValue: number;
  currentValue: number;
}

const extensionsRegistry = getExtensionsRegistry();

type SliceHeaderProps = SliceHeaderControlsProps & {
  innerRef?: string;
  updateSliceName?: (arg0: string) => void;
  editMode?: boolean;
  annotationQuery?: object;
  annotationError?: object;
  sliceName?: string;
  filters: object;
  handleToggleFullSize: () => void;
  formData: Record<string, any>;
  datasource?: Datasource;
  activeMetrics?: QueryFormMetric[];
  onActiveMetricsChange?: (metrics: QueryFormMetric[]) => void;
  onActiveMetricsReset?: () => void;
  isOptionalMetricSelectorOpen?: boolean;
  onOptionalMetricSelectorVisibilityChange?: (visible: boolean) => void;
  activeAttribute?: QueryFormColumn | null;
  onActiveAttributeChange?: (attribute: QueryFormColumn) => void;
  onActiveAttributeReset?: () => void;
  isReplaceAttributeSelectorOpen?: boolean;
  onReplaceAttributeSelectorVisibilityChange?: (visible: boolean) => void;
  width: number;
  height: number;
  bigNumberComparisonData?: BigNumberComparisonData | null;
};

const annotationsLoading = t('Annotation layers are still loading.');
const annotationsError = t('One ore more annotation layers failed loading.');
const CrossFilterIcon = styled(Icons.ApartmentOutlined)`
  ${({ theme }) => `
    cursor: default;
    color: ${theme.colors.primary.base};
    line-height: 1.8;
  `}
`;

const DescriptionInfoIcon = styled(Icons.InfoCircleOutlined)`
  ${({ theme }) => css`
    color: ${theme.colors.grayscale.base};
    cursor: pointer;
    flex-shrink: 0;
    font-size: ${theme.typography.sizes.s}px;
    line-height: 0 !important;
  `}
`;

const ComparisonIndicator = styled.div<{
  indicatorColor: string;
  bgColor?: string;
  shape?: 'pill' | 'square';
  size?: 'large' | 'small';
}>`
  ${({ indicatorColor, bgColor, shape = 'pill', size = 'large' }) => {
    // Determine border radius based on shape
    let borderRadius = '9999px'; // pill (fully rounded)
    if (shape === 'square') {
      borderRadius = '4px'; // square (slightly rounded corners)
    }

    const isSmall = size === 'small';
    const padding = isSmall ? '3px 6px' : '4px 8px';
    const fontSize = isSmall ? '10px' : '14px';
    const gap = isSmall ? '2px' : '2px';

    return `
      display: inline-flex !important;
      align-items: center;
      gap: ${gap};
      font-weight: 500;
      color: ${indicatorColor} !important;
      cursor: default;
      white-space: nowrap;
      position: relative;
      border-radius: ${borderRadius} !important;
      margin: 0 !important;
      border: 0 !important;
      background-color: ${bgColor || 'rgba(0, 0, 0, 0)'} !important;
      padding: ${padding} !important;
      box-shadow: none !important;
      outline: none !important;
      font-size: ${fontSize} !important;
      
      /* Prevent tooltip-induced layout shifts */
      &.ant-tooltip-open {
        display: inline-flex !important;
        position: relative !important;
      }
    `;
  }}
`;

const TrendIconContainer = styled.span<{
  bgColor: string;
  iconShape: 'circle' | 'square' | 'rounded';
  iconSize: number;
}>`
  ${({ bgColor, iconShape, iconSize }) => {
    // Determine border radius based on shape
    let borderRadius = '50%'; // circle (default)
    if (iconShape === 'square') {
      borderRadius = '0';
    } else if (iconShape === 'rounded') {
      borderRadius = '8px';
    }

    return `
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: ${iconSize}px !important;
      min-height: ${iconSize}px !important;
      max-height: ${iconSize}px !important;
      width: auto !important;
      min-width: ${iconSize}px !important;
      ${
        bgColor !== 'transparent'
          ? `background-color: ${bgColor} !important;`
          : ''
      }
      border-radius: ${borderRadius} !important;
      padding: 0 !important;
      margin-right: ${iconSize * 0.25}px !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;

      img {
        height: 100% !important;
        width: auto !important;
        max-width: none !important;
        object-fit: contain !important;
        display: block !important;
      }
    `;
  }}
`;

const ChartIconContainer = styled.div<{
  iconSize: number;
  bgColor: string;
  iconShape: 'circle' | 'square' | 'rounded';
}>`
  ${({ iconSize, bgColor, iconShape }) => {
    // Determine border radius based on shape
    let borderRadius = '50%'; // circle (default)
    if (iconShape === 'square') {
      borderRadius = '0';
    } else if (iconShape === 'rounded') {
      borderRadius = '8px';
    }

    return `
      width: ${iconSize}px !important;
      height: ${iconSize}px !important;
      min-width: ${iconSize}px !important;
      min-height: ${iconSize}px !important;
      background-color: ${bgColor} !important;
      border-radius: ${borderRadius} !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-right: 8px !important;
      padding: ${iconSize * 0.2}px !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      
      img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        display: block !important;
      }
    `;
  }}
`;

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const HeaderBar = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius}px;
  height: 16px;
  width: 32%;
  margin-bottom: ${({ theme }) => theme.gridUnit * 2}px;
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.colors.grayscale.light3}, ${theme.colors.grayscale.light2}, ${theme.colors.grayscale.light3})`};
  background-size: 200% 200%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 6px;
`;

const ChartHeaderStyles = styled.div`
  ${({ theme }) => css`
    font-size: ${theme.typography.sizes.l}px;
    font-weight: ${theme.typography.weights.bold};
    margin-bottom: ${theme.gridUnit}px;
    display: flex;
    max-width: 100%;
    align-items: flex-start;
    min-height: 0;

    & > .header-title {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      flex-grow: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      display: flex;
      align-items: center;

      & > span.ant-tooltip-open {
        display: inline;
      }
    }

    & > .header-controls {
      display: flex;
      align-items: center;
      min-height: 24px;

      & > * {
        margin-left: ${theme.gridUnit * 2}px;
      }
    }

    .dropdown.btn-group {
      pointer-events: none;
      vertical-align: top;
      & > * {
        pointer-events: auto;
      }
    }

    .dropdown-toggle.btn.btn-default {
      background: none;
      border: none;
      box-shadow: none;
    }

    .dropdown-menu.dropdown-menu-right {
      top: ${theme.gridUnit * 5}px;
    }

    .divider {
      margin: ${theme.gridUnit}px 0;
    }

    .refresh-tooltip {
      display: block;
      height: ${theme.gridUnit * 4}px;
      margin: ${theme.gridUnit}px 0;
      color: ${theme.colors.text.label};
    }
  `}
`;

const SliceHeader: FC<SliceHeaderProps> = ({
  innerRef = null,
  forceRefresh = () => ({}),
  updateSliceName = () => ({}),
  toggleExpandSlice = () => ({}),
  logExploreChart = () => ({}),
  logEvent,
  exportCSV = () => ({}),
  exportXLSX = () => ({}),
  editMode = false,
  annotationQuery = {},
  annotationError = {},
  cachedDttm = null,
  updatedDttm = null,
  isCached = [],
  isExpanded = false,
  sliceName = '',
  supersetCanExplore = false,
  supersetCanShare = false,
  supersetCanCSV = false,
  exportPivotCSV,
  exportFullCSV,
  exportFullXLSX,
  slice,
  componentId,
  dashboardId,
  addSuccessToast,
  addDangerToast,
  handleToggleFullSize,
  isFullSize,
  chartStatus,
  formData,
  datasource,
  activeMetrics = [],
  onActiveMetricsChange = () => ({}),
  onActiveMetricsReset = () => ({}),
  isOptionalMetricSelectorOpen = false,
  onOptionalMetricSelectorVisibilityChange = () => ({}),
  activeAttribute = null,
  onActiveAttributeChange = () => ({}),
  onActiveAttributeReset = () => ({}),
  isReplaceAttributeSelectorOpen = false,
  onReplaceAttributeSelectorVisibilityChange = () => ({}),
  width,
  height,
  bigNumberComparisonData,
}) => {
  const SliceHeaderExtension = extensionsRegistry.get('dashboard.slice.header');
  const uiConfig = useUiConfig();
  const dashboardPageId = useContext(DashboardPageIdContext);
  const [headerTooltip, setHeaderTooltip] = useState<ReactNode | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  // TODO: change to indicator field after it will be implemented
  const crossFilterValue = useSelector<RootState, any>(
    state => state.dataMask[slice?.slice_id]?.filterState?.value,
  );
  const isCrossFiltersEnabled = useSelector<RootState, boolean>(
    ({ dashboardInfo }) => dashboardInfo.crossFiltersEnabled,
  );
  const hasReplaceAttributeControls = hasReplaceAttributes(
    formData,
    datasource,
  );

  const canExplore = !editMode && supersetCanExplore;

  useEffect(() => {
    const headerElement = headerRef.current;
    if (canExplore) {
      setHeaderTooltip(getSliceHeaderTooltip(sliceName));
    } else if (
      headerElement &&
      (headerElement.scrollWidth > headerElement.offsetWidth ||
        headerElement.scrollHeight > headerElement.offsetHeight)
    ) {
      setHeaderTooltip(sliceName ?? null);
    } else {
      setHeaderTooltip(null);
    }
  }, [sliceName, width, height, canExplore]);

  const exploreUrl = `/explore/?dashboard_page_id=${dashboardPageId}&slice_id=${slice.slice_id}`;

  // Render comparison indicator for BigNumber charts
  const renderComparisonIndicator = () => {
    // console.group('🎯 SliceHeader renderComparisonIndicator - DEBUG');
    // console.log('📊 BigNumber Comparison Data:', {
    //   bigNumberComparisonData,
    //   hasBigNumberComparisonData: !!bigNumberComparisonData,
    //   sliceVizType: slice?.viz_type,
    //   chartStatus,
    //   editMode,
    // });

    if (!bigNumberComparisonData) {
      // console.log('❌ No comparison data available - not rendering indicator');
      // console.groupEnd();
      return null;
    }

    // Check trend comparison position - only render in slice header if position is 'top'
    const trendComparisonPosition =
      formData?.trend_comparison_position ??
      formData?.trendComparisonPosition ??
      'top';
    if (trendComparisonPosition !== 'top') {
      return null; // Don't render in slice header if position is 'middle'
    }

    const { percentageChange, comparisonIndicator } = bigNumberComparisonData;
    // console.log('✅ Rendering comparison indicator:', {
    //   percentageChange,
    //   comparisonIndicator,
    //   percentageChangeType: typeof percentageChange,
    //   comparisonIndicatorType: typeof comparisonIndicator,
    // });
    const formatPercentChange = getNumberFormatter(
      NumberFormats.PERCENT_SIGNED_1_POINT,
    );

    const showNeutralTrendChip =
      formData?.show_neutral_trend_chip ??
      formData?.showNeutralTrendChip ??
      true;
    if (comparisonIndicator === 'neutral' && !showNeutralTrendChip) {
      return null;
    }

    // Extract uptrend/downtrend icon properties from formData
    const isUptrend = comparisonIndicator === 'positive';
    const isNeutral = comparisonIndicator === 'neutral';
    const uptrendIconType =
      formData?.uptrend_icon_type ?? formData?.uptrendIconType;
    const uptrendIconUrl =
      formData?.uptrend_icon_url ?? formData?.uptrendIconUrl;
    const uptrendIconBackgroundColorRaw =
      formData?.uptrend_icon_background_color ??
      formData?.uptrendIconBackgroundColor;
    const uptrendIconTextColorRaw =
      formData?.uptrend_icon_text_color ?? formData?.uptrendIconTextColor;
    const uptrendIconShape =
      formData?.uptrend_icon_shape ?? formData?.uptrendIconShape ?? 'circle';
    const downtrendIconType =
      formData?.downtrend_icon_type ?? formData?.downtrendIconType;
    const downtrendIconUrl =
      formData?.downtrend_icon_url ?? formData?.downtrendIconUrl;
    const downtrendIconBackgroundColorRaw =
      formData?.downtrend_icon_background_color ??
      formData?.downtrendIconBackgroundColor;
    const downtrendIconTextColorRaw =
      formData?.downtrend_icon_text_color ?? formData?.downtrendIconTextColor;
    const downtrendIconShape =
      formData?.downtrend_icon_shape ??
      formData?.downtrendIconShape ??
      'circle';
    const neutralIconType =
      formData?.neutral_icon_type ?? formData?.neutralIconType;
    const neutralIconUrl =
      formData?.neutral_icon_url ?? formData?.neutralIconUrl;
    const neutralIconBackgroundColorRaw =
      formData?.neutral_icon_background_color ??
      formData?.neutralIconBackgroundColor ??
      '#FEF0E7';
    const neutralIconTextColorRaw =
      formData?.neutral_icon_text_color ??
      formData?.neutralIconTextColor ??
      '#F06D0F';
    const neutralIconShape =
      formData?.neutral_icon_shape ?? formData?.neutralIconShape ?? 'circle';
    const trendComparisonShape =
      formData?.trend_comparison_shape ??
      formData?.trendComparisonShape ??
      'pill';
    const trendComparisonSize =
      formData?.trend_comparison_size ??
      formData?.trendComparisonSize ??
      'large';

    // Convert color object to CSS string if needed
    const convertColorToString = (color: any): string | null => {
      if (!color) return null;
      if (typeof color === 'string') {
        return color;
      }
      if (
        color &&
        typeof color === 'object' &&
        'r' in color &&
        'g' in color &&
        'b' in color
      ) {
        const { r, g, b, a = 0 } = color; // Default to transparent (a = 0)
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
      return null;
    };

    const uptrendIconBackgroundColor = convertColorToString(
      uptrendIconBackgroundColorRaw,
    );
    const downtrendIconBackgroundColor = convertColorToString(
      downtrendIconBackgroundColorRaw,
    );
    const neutralIconBackgroundColor = convertColorToString(
      neutralIconBackgroundColorRaw,
    );
    const uptrendIconTextColor = convertColorToString(uptrendIconTextColorRaw);
    const downtrendIconTextColor = convertColorToString(
      downtrendIconTextColorRaw,
    );
    const neutralIconTextColor = convertColorToString(neutralIconTextColorRaw);

    // Check if custom icon is provided
    const hasCustomIcon = isUptrend
      ? uptrendIconUrl && uptrendIconType
      : isNeutral
        ? neutralIconType !== 'never' && neutralIconUrl && neutralIconType
        : downtrendIconUrl && downtrendIconType;
    const hideNeutralIcon = isNeutral && neutralIconType === 'never';

    // Get background color for the trend component (not just the icon)
    // Only apply if explicitly provided (not default)
    const trendBgColor = isUptrend
      ? uptrendIconBackgroundColor
      : isNeutral
        ? neutralIconBackgroundColor
        : downtrendIconBackgroundColor;
    const hasTrendBgColor =
      trendBgColor !== null &&
      trendBgColor !== undefined &&
      (typeof trendBgColor === 'string' ? trendBgColor.trim() !== '' : true);

    // Get text color for the trend component - use custom if provided, otherwise use default
    let indicatorColor: string;
    let arrowIcon: string | React.ReactNode;

    switch (comparisonIndicator) {
      case 'positive':
        indicatorColor = uptrendIconTextColor || '#28a745'; // Use custom text color or green (default)
        if (hasCustomIcon) {
          // Custom icon will be rendered separately
          arrowIcon = null;
        } else {
          arrowIcon = '↗';
        }
        break;
      case 'negative':
        indicatorColor = downtrendIconTextColor || '#dc3545'; // Use custom text color or red (default)
        if (hasCustomIcon) {
          // Custom icon will be rendered separately
          arrowIcon = null;
        } else {
          arrowIcon = '↘';
        }
        break;
      case 'neutral':
        indicatorColor = neutralIconTextColor || '#F06D0F';
        if (hideNeutralIcon || hasCustomIcon) {
          arrowIcon = null;
        } else {
          arrowIcon = '−';
        }
        break;
      default:
        return null;
    }

    const tooltipText = t('Period-over-period comparison');
    let formattedPercentage: string;
    if (Number.isNaN(percentageChange) || percentageChange === undefined) {
      formattedPercentage = '0%';
    } else if (percentageChange === 0) {
      // For zero percentage, don't show any sign
      formattedPercentage = '0%';
    } else {
      formattedPercentage = formatPercentChange(percentageChange);
    }

    // console.log('🎨 Creating comparison indicator element:', {
    //   indicatorColor,
    //   arrowIcon,
    //   formattedPercentage,
    //   tooltipText,
    // });
    // console.groupEnd();

    const iconSize = trendComparisonSize === 'small' ? 15 : 20;

    return (
      <Tooltip title={tooltipText} placement="top">
        <ComparisonIndicator
          indicatorColor={indicatorColor}
          bgColor={hasTrendBgColor ? trendBgColor : undefined}
          shape={trendComparisonShape}
          size={trendComparisonSize}
          className="superset-comparison-indicator-no-border"
        >
          {hasCustomIcon ? (
            <TrendIconContainer
              bgColor="transparent" // Icon container should be transparent since bg is on parent
              iconShape={
                isUptrend
                  ? uptrendIconShape
                  : isNeutral
                    ? neutralIconShape
                    : downtrendIconShape
              }
              iconSize={iconSize} // Adjust icon size based on trend comparison size
            >
              <img
                src={
                  isUptrend
                    ? uptrendIconUrl
                    : isNeutral
                      ? neutralIconUrl
                      : downtrendIconUrl
                }
                alt={
                  isUptrend ? 'Uptrend' : isNeutral ? 'Neutral' : 'Downtrend'
                }
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  const container = target.parentElement;
                  if (container) {
                    container.style.display = 'none';
                  }
                }}
              />
            </TrendIconContainer>
          ) : arrowIcon ? (
            <span>{arrowIcon}</span>
          ) : null}
          <span>{formattedPercentage}</span>
        </ComparisonIndicator>
      </Tooltip>
    );
  };

  if (
    chartStatus === 'loading' &&
    !isOptionalMetricSelectorOpen &&
    !isReplaceAttributeSelectorOpen &&
    !hasReplaceAttributeControls
  ) {
    return (
      <>
        <ChartHeaderStyles data-test="slice-header" ref={innerRef}>
          <div className="header-title" ref={headerRef}>
            <div
              css={css`
                width: 60%;
                min-width: 160px;
              `}
            >
              {/* <Skeleton.Input active size="small" /> */}
              <HeaderBar />
            </div>
          </div>
        </ChartHeaderStyles>
      </>
    );
  }
  // Extract icon settings from formData for BigNumber charts
  const isBigNumberChart = slice?.viz_type
    ?.toLowerCase()
    .includes('big_number');
  const showIcon = formData?.show_icon ?? formData?.showIcon;
  const iconUrl = formData?.icon_url ?? formData?.iconUrl;
  const iconSize = formData?.icon_size ?? formData?.iconSize ?? 'medium';
  const iconBackgroundColorRaw =
    formData?.icon_background_color ??
    formData?.iconBackgroundColor ??
    '#e8eaf6';
  const iconShape = formData?.icon_shape ?? formData?.iconShape ?? 'circle';
  const iconPosition =
    formData?.icon_position ?? formData?.iconPosition ?? 'top-left';

  // Convert color object to CSS string if needed
  const convertColorToString = (color: any): string => {
    if (typeof color === 'string') {
      return color;
    }
    if (
      color &&
      typeof color === 'object' &&
      'r' in color &&
      'g' in color &&
      'b' in color
    ) {
      const { r, g, b, a = 1 } = color;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return '#e8eaf6'; // fallback
  };

  const iconBackgroundColor = convertColorToString(iconBackgroundColorRaw);

  // Render icon for BigNumber charts - only render top-left in title
  const renderChartIcon = () => {
    // Only render icon in title if it's top-left position
    if (
      !isBigNumberChart ||
      !showIcon ||
      !iconUrl ||
      iconPosition !== 'top-left'
    ) {
      return null;
    }

    // Icon size mapping - matches the chart configuration
    const sizeMap = {
      small: 24,
      medium: 32,
      large: 40,
      xlarge: 48,
    };
    const iconSizePx =
      sizeMap[iconSize as keyof typeof sizeMap] ?? sizeMap.medium;

    return (
      <ChartIconContainer
        iconSize={iconSizePx}
        bgColor={iconBackgroundColor}
        iconShape={iconShape as 'circle' | 'square' | 'rounded'}
        className="chart-title-icon"
      >
        <img
          src={iconUrl}
          alt="Chart Icon"
          onError={e => {
            const target = e.target as HTMLImageElement;
            const container = target.parentElement;
            if (container) {
              container.style.display = 'none';
            }
          }}
        />
      </ChartIconContainer>
    );
  };

  return (
    <ChartHeaderStyles data-test="slice-header" ref={innerRef}>
      <div className="header-title" ref={headerRef}>
        <Tooltip title={headerTooltip}>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            {renderChartIcon()}
            <EditableTitle
              title={
                sliceName ||
                (editMode
                  ? '---' // this makes an empty title clickable
                  : '')
              }
              canEdit={editMode}
              onSaveTitle={updateSliceName}
              showTooltip={false}
              url={canExplore ? exploreUrl : undefined}
            />
          </div>
        </Tooltip>
        <div
          css={theme => css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${theme.gridUnit * 1.5}px;
            margin-top: ${theme.gridUnit / 2}px;
            margin-left: ${theme.gridUnit * 1.5}px;
            transform: scale(0.95);
          `}
        >
          <h3
            css={theme => css`
              margin: 0;
              font-size: ${theme.typography.sizes.m}px;
              display: flex;
              align-items: center;
              gap: ${theme.gridUnit}px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 0;
            `}
          >
            {slice.description?.trim() && (
              <Tooltip title={slice.description}>
                <DescriptionInfoIcon />
              </Tooltip>
            )}
          </h3>
        </div>
        {!!Object.values(annotationQuery).length && (
          <Tooltip
            id="annotations-loading-tooltip"
            placement="top"
            title={annotationsLoading}
          >
            <i
              role="img"
              aria-label={annotationsLoading}
              className="fa fa-refresh warning"
            />
          </Tooltip>
        )}
        {!!Object.values(annotationError).length && (
          <Tooltip
            id="annotation-errors-tooltip"
            placement="top"
            title={annotationsError}
          >
            <i
              role="img"
              aria-label={annotationsError}
              className="fa fa-exclamation-circle danger"
            />
          </Tooltip>
        )}
      </div>
      <div className="header-controls">
        {!editMode && (
          <>
            {SliceHeaderExtension && (
              <SliceHeaderExtension
                sliceId={slice.slice_id}
                dashboardId={dashboardId}
              />
            )}
            {renderComparisonIndicator()}
            {crossFilterValue && (
              <Tooltip
                placement="top"
                title={t(
                  'This chart applies cross-filters to charts whose datasets contain columns with the same name.',
                )}
              >
                <CrossFilterIcon iconSize="m" />
              </Tooltip>
            )}
            {!uiConfig.hideChartControls && (
              <ReplaceAttributeSelector
                activeAttribute={activeAttribute}
                chartWidth={width}
                dashboardId={dashboardId}
                datasource={datasource}
                formData={formData}
                logEvent={logEvent}
                onChange={onActiveAttributeChange}
                onReset={onActiveAttributeReset}
                onVisibleChange={onReplaceAttributeSelectorVisibilityChange}
                sliceId={slice.slice_id}
              />
            )}
            {!uiConfig.hideChartControls && (
              <OptionalMetricSelector
                activeMetrics={activeMetrics}
                addDangerToast={addDangerToast}
                dashboardId={dashboardId}
                datasource={datasource}
                formData={formData}
                logEvent={logEvent}
                onChange={onActiveMetricsChange}
                onReset={onActiveMetricsReset}
                onVisibleChange={onOptionalMetricSelectorVisibilityChange}
                sliceId={slice.slice_id}
              />
            )}
            {!uiConfig.hideChartControls && (
              <FiltersBadge chartId={slice.slice_id} />
            )}
            {!uiConfig.hideChartControls && (
              <SliceHeaderControls
                slice={slice}
                isCached={isCached}
                isExpanded={isExpanded}
                cachedDttm={cachedDttm}
                updatedDttm={updatedDttm}
                toggleExpandSlice={toggleExpandSlice}
                forceRefresh={forceRefresh}
                logExploreChart={logExploreChart}
                logEvent={logEvent}
                exportCSV={exportCSV}
                exportPivotCSV={exportPivotCSV}
                exportFullCSV={exportFullCSV}
                exportXLSX={exportXLSX}
                exportFullXLSX={exportFullXLSX}
                supersetCanExplore={supersetCanExplore}
                supersetCanShare={supersetCanShare}
                supersetCanCSV={supersetCanCSV}
                componentId={componentId}
                dashboardId={dashboardId}
                addSuccessToast={addSuccessToast}
                addDangerToast={addDangerToast}
                handleToggleFullSize={handleToggleFullSize}
                isFullSize={isFullSize}
                isDescriptionExpanded={isExpanded}
                chartStatus={chartStatus}
                formData={formData}
                exploreUrl={exploreUrl}
                crossFiltersEnabled={isCrossFiltersEnabled}
              />
            )}
          </>
        )}
      </div>
    </ChartHeaderStyles>
  );
};

export default SliceHeader;
