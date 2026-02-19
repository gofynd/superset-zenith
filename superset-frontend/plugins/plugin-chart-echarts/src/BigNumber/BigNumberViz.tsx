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
import { PureComponent, MouseEvent } from 'react';
import {
  t,
  getNumberFormatter,
  getTimeFormatter,
  SMART_DATE_VERBOSE_ID,
  computeMaxFontSize,
  BRAND_COLOR,
  styled,
  BinaryQueryObjectFilterClause,
  NumberFormats,
} from '@superset-ui/core';
import { Tooltip } from '@superset-ui/chart-controls';
import React from 'react';
import Echart from '../components/Echart';
import { BigNumberVizProps } from './types';
import { EventHandlers } from '../types';

const defaultNumberFormatter = getNumberFormatter();

// Styled components for comparison indicator (middle position) - exact copy from SliceHeader
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
      position: static !important;
      border-radius: ${borderRadius} !important;
      margin: 0 !important;
      border: 0 !important;
      background-color: ${bgColor ? bgColor : 'rgba(0, 0, 0, 0)'} !important;
      padding: ${padding} !important;
      box-shadow: none !important;
      outline: none !important;
      line-height: 1 !important;
      vertical-align: baseline !important;
      flex-shrink: 0 !important;
      font-size: ${fontSize} !important;
      
      /* Prevent tooltip-induced layout shifts */
      &.ant-tooltip-open {
        display: inline-flex !important;
        position: static !important;
      }
    `;
  }}
`;

// TrendIconContainer - exact copy from SliceHeader
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
      ${bgColor !== 'transparent' ? `background-color: ${bgColor} !important;` : ''}
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

// Function to detect if a metric is using percentage formatting
const isPercentageFormat = (yAxisFormat?: string): boolean => {
  if (!yAxisFormat) return false;

  // Check if the format contains percentage symbols or matches percentage format constants
  return (
    yAxisFormat.includes('%') ||
    yAxisFormat === NumberFormats.PERCENT ||
    yAxisFormat === NumberFormats.PERCENT_1_POINT ||
    yAxisFormat === NumberFormats.PERCENT_2_POINT ||
    yAxisFormat === NumberFormats.PERCENT_3_POINT ||
    yAxisFormat === NumberFormats.PERCENT_SIGNED ||
    yAxisFormat === NumberFormats.PERCENT_SIGNED_1_POINT ||
    yAxisFormat === NumberFormats.PERCENT_SIGNED_2_POINT ||
    yAxisFormat === NumberFormats.PERCENT_SIGNED_3_POINT
  );
};

const PROPORTION = {
  // text size: proportion of the chart container sans trendline
  KICKER: 0.1,
  HEADER: 0.3,
  SUBHEADER: 0.125,
  // trendline size: proportion of the whole chart container
  TRENDLINE: 0.3,
};

class BigNumberVis extends PureComponent<BigNumberVizProps> {
  static defaultProps = {
    className: '',
    headerFormatter: defaultNumberFormatter,
    formatTime: getTimeFormatter(SMART_DATE_VERBOSE_ID),
    headerFontSize: PROPORTION.HEADER,
    kickerFontSize: PROPORTION.KICKER,
    mainColor: BRAND_COLOR,
    showTimestamp: false,
    showTrendLine: false,
    startYAxisAtZero: true,
    subheader: '',
    subheaderFontSize: PROPORTION.SUBHEADER,
    timeRangeFixed: false,
    enableClickableCard: false,
  };

  getClassName() {
    const { className, showTrendLine, bigNumberFallback, enableClickableCard, hoverBorderEnabled } = this.props;
    const hoverBorderClass = enableClickableCard && hoverBorderEnabled ? 'hover-border-enabled' : '';
    const names = `superset-legacy-chart-big-number ${className} ${
      bigNumberFallback ? 'is-fallback-value' : ''
    } ${enableClickableCard ? 'clickable-card' : ''} ${hoverBorderClass}`;
    if (showTrendLine) return names;
    return `${names} no-trendline`;
  }
  
  componentDidMount() {
    this.injectDashboardHolderStyles();
  }
  
  componentDidUpdate() {
    this.injectDashboardHolderStyles();
  }
  
  injectDashboardHolderStyles() {
    const { enableClickableCard, redirectUrl, hoverBorderEnabled, hoverBorderThickness = 2, hoverBorderColor = '#1890ff' } = this.props;
    
    const styleId = 'bignumber-dashboard-holder-hover-style';
    
    // Remove existing style if present to allow updates
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    if (!enableClickableCard || !redirectUrl || !hoverBorderEnabled) {
      return;
    }
    
    // Inject global CSS to style the parent dashboard-component-chart-holder
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .dashboard-component-chart-holder:has(.hover-border-enabled) {
        border: ${hoverBorderThickness}px solid transparent !important;
        border-radius: 4px;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }
      
      .dashboard-component-chart-holder:has(.hover-border-enabled):hover {
        border-color: ${hoverBorderColor} !important;
      }
    `;
    document.head.appendChild(style);
  }

  handleCardClick = () => {
    const { enableClickableCard, redirectUrl } = this.props;
    
    if (enableClickableCard && redirectUrl) {
      // Validate URL is http/https only (security check)
      if (!redirectUrl.match(/^https?:\/\//)) {
        return;
      }
      
      // Open URL in new tab
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  createTemporaryContainer() {
    const container = document.createElement('div');
    container.className = this.getClassName();
    container.style.position = 'absolute'; // so it won't disrupt page layout
    container.style.opacity = '0'; // and not visible
    return container;
  }

  renderFallbackWarning() {
    const { bigNumberFallback, formatTime, showTimestamp } = this.props;
    if (!formatTime || !bigNumberFallback || showTimestamp) return null;
    return (
      <span
        className="alert alert-warning"
        role="alert"
        title={t(
          `Last available value seen on %s`,
          formatTime(bigNumberFallback[0]),
        )}
      >
        {t('Not up to date')}
      </span>
    );
  }

  renderKicker(maxHeight: number) {
    const { timestamp, showTimestamp, formatTime, width } = this.props;
    if (
      !formatTime ||
      !showTimestamp ||
      typeof timestamp === 'string' ||
      typeof timestamp === 'boolean'
    )
      return null;

    const text = timestamp === null ? '' : formatTime(timestamp);

    const container = this.createTemporaryContainer();
    document.body.append(container);
    const fontSize = computeMaxFontSize({
      text,
      maxWidth: width,
      maxHeight,
      className: 'kicker',
      container,
    });
    container.remove();

    return (
      <div
        className="kicker"
        style={{
          fontSize,
          height: 'auto',
        }}
      >
        {text}
      </div>
    );
  }

  renderComparisonIndicator(fontSize?: number) {
    const {
      percentageChange,
      comparisonIndicator,
      trendComparisonPosition = 'top',
      trendComparisonShape = 'pill',
      trendComparisonSize = 'large',
      uptrendIconType,
      uptrendIconUrl,
      uptrendIconBackgroundColor,
      uptrendIconTextColor,
      uptrendIconShape = 'circle',
      downtrendIconType,
      downtrendIconUrl,
      downtrendIconBackgroundColor,
      downtrendIconTextColor,
      downtrendIconShape = 'circle',
      showNeutralTrendChip = true,
      neutralIconType,
      neutralIconUrl,
      neutralIconBackgroundColor = '#FEF0E7',
      neutralIconTextColor = '#F06D0F',
      neutralIconShape = 'circle',
    } = this.props;

    // Only render if position is 'middle'
    if (trendComparisonPosition !== 'middle') {
      return null;
    }

    // Check if we have comparison data
    if (
      percentageChange === undefined ||
      percentageChange === null ||
      comparisonIndicator === undefined
    ) {
      return null;
    }

    if (comparisonIndicator === 'neutral' && !showNeutralTrendChip) {
      return null;
    }

    const formatPercentChange = getNumberFormatter(
      NumberFormats.PERCENT_SIGNED_1_POINT,
    );

    // Convert color object to CSS string if needed
    const convertColorToString = (color: any): string | null => {
      if (!color) return null;
      if (typeof color === 'string') {
        return color;
      }
      if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
        const { r, g, b, a = 0 } = color;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
      return null;
    };

    const isUptrend = comparisonIndicator === 'positive';
    const isNeutral = comparisonIndicator === 'neutral';
    const uptrendIconBackgroundColorConverted = convertColorToString(uptrendIconBackgroundColor);
    const downtrendIconBackgroundColorConverted = convertColorToString(downtrendIconBackgroundColor);
    const neutralIconBackgroundColorConverted = convertColorToString(neutralIconBackgroundColor);
    const uptrendIconTextColorConverted = convertColorToString(uptrendIconTextColor);
    const downtrendIconTextColorConverted = convertColorToString(downtrendIconTextColor);
    const neutralIconTextColorConverted = convertColorToString(neutralIconTextColor);

    // Check if custom icon is provided
    const hasCustomIcon = isUptrend
      ? (uptrendIconUrl && uptrendIconType)
      : isNeutral
        ? (neutralIconType !== 'never' && neutralIconUrl && neutralIconType)
        : (downtrendIconUrl && downtrendIconType);
    const hideNeutralIcon = isNeutral && neutralIconType === 'never';

    // Get background color for the trend component
    const trendBgColor = isUptrend
      ? uptrendIconBackgroundColorConverted
      : isNeutral
        ? neutralIconBackgroundColorConverted
        : downtrendIconBackgroundColorConverted;
    const hasTrendBgColor =
      trendBgColor !== null &&
      trendBgColor !== undefined &&
      (typeof trendBgColor === 'string' ? trendBgColor.trim() !== '' : true);

    // Get text color for the trend component - use custom if provided, otherwise use default
    let indicatorColor: string;
    let arrowIcon: string | React.ReactNode;

    switch (comparisonIndicator) {
      case 'positive':
        indicatorColor = uptrendIconTextColorConverted || '#28a745'; // Use custom text color or green (default)
        if (hasCustomIcon) {
          arrowIcon = null;
        } else {
          arrowIcon = '↗';
        }
        break;
      case 'negative':
        indicatorColor = downtrendIconTextColorConverted || '#dc3545'; // Use custom text color or red (default)
        if (hasCustomIcon) {
          arrowIcon = null;
        } else {
          arrowIcon = '↘';
        }
        break;
      case 'neutral':
        indicatorColor = neutralIconTextColorConverted || '#F06D0F';
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
      formattedPercentage = '0%';
    } else {
      formattedPercentage = formatPercentChange(percentageChange);
    }

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
              bgColor="transparent"
              iconShape={isUptrend ? uptrendIconShape : isNeutral ? neutralIconShape : downtrendIconShape}
              iconSize={iconSize}
            >
              <img
                src={isUptrend ? uptrendIconUrl : isNeutral ? neutralIconUrl : downtrendIconUrl}
                alt={isUptrend ? 'Uptrend' : isNeutral ? 'Neutral' : 'Downtrend'}
                onError={(e) => {
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
  }

  renderHeader(maxHeight: number) {
    const {
      bigNumber,
      headerFormatter,
      width,
      colorThresholdFormatters,
      enableDetailOnHover,
      metric,
      yAxisFormat,
    } = this.props;
    // @ts-ignore
    const text = bigNumber === null ? '0' : headerFormatter(bigNumber);

    const hasThresholdColorFormatter =
      Array.isArray(colorThresholdFormatters) &&
      colorThresholdFormatters.length > 0;

    let numberColor;
    if (hasThresholdColorFormatter) {
      colorThresholdFormatters!.forEach(formatter => {
        const formatterResult = bigNumber
          ? formatter.getColorFromValue(bigNumber as number)
          : false;
        if (formatterResult) {
          numberColor = formatterResult;
        }
      });
    } else {
      numberColor = 'black';
    }

    const container = this.createTemporaryContainer();
    document.body.append(container);
    const fontSize = computeMaxFontSize({
      text,
      maxWidth: width * 0.9, // reduced it's max width
      maxHeight,
      className: 'header-line',
      container,
    });
    container.remove();

    const onContextMenu = (e: MouseEvent<HTMLDivElement>) => {
      if (this.props.onContextMenu) {
        e.preventDefault();
        this.props.onContextMenu(e.nativeEvent.clientX, e.nativeEvent.clientY);
      }
    };

    // Show the exact number with comma formatting for better readability
    // Use a formatter that preserves decimal places but removes trailing zeros
    const exactFormatter = getNumberFormatter(',.6f');
    const exactValue = bigNumber === null ? '0' : exactFormatter(bigNumber as number).replace(/\.?0+$/, '');

    const headerContent = (
      <div
        className="header-line"
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize,
          height: 'auto',
          color: numberColor,
          gap: '8px', // Add gap between number and comparison indicator
          flexWrap: 'nowrap',
        }}
        onContextMenu={onContextMenu}
      >
        <span style={{ fontSize, lineHeight: 1, flexShrink: 0 }}>{text}</span>
        {this.renderComparisonIndicator(fontSize)}
      </div>
    );

    // Show tooltip with exact value if enabled, not a percentage format, and the formatted text is different from exact value
    if (
      enableDetailOnHover &&
      bigNumber !== null &&
      text !== exactValue &&
      !isPercentageFormat(yAxisFormat)
    ) {
      return (
        <Tooltip title={`${metric}: ${exactValue}`} placement="top">
          {headerContent}
        </Tooltip>
      );
    }

    return headerContent;
  }

  renderSubheader(maxHeight: number) {
    const { bigNumber, subheader, width, bigNumberFallback } = this.props;
    let fontSize = 0;

    const NO_DATA_OR_HASNT_LANDED = t('NO_DATA_OR_HASNT_LANDED');
    const NO_DATA = t(
      'Try applying different filters or ensuring your datasource has data',
    );
    let text = subheader;
    if (bigNumber === null) {
      text = bigNumberFallback ? NO_DATA : NO_DATA_OR_HASNT_LANDED;
    }
    if (text) {
      const container = this.createTemporaryContainer();
      document.body.append(container);
      fontSize = computeMaxFontSize({
        text,
        maxWidth: width * 0.9, // max width reduced
        maxHeight,
        className: 'subheader-line',
        container,
      });
      container.remove();

      return text === 'NO_DATA_OR_HASNT_LANDED' ? null : (
        <div
          className="subheader-line"
          style={{
            fontSize,
            height: maxHeight,
          }}
        >
          {text}
        </div>
      );
    }
    return null;
  }

  renderTrendline(maxHeight: number) {
    const { width, trendLineData, echartOptions, refs } = this.props;

    // if can't find any non-null values, no point rendering the trendline
    if (!trendLineData?.some(d => d[1] !== null)) {
      return null;
    }

    const eventHandlers: EventHandlers = {
      contextmenu: eventParams => {
        if (this.props.onContextMenu) {
          eventParams.event.stop();
          const { data } = eventParams;
          if (data) {
            const pointerEvent = eventParams.event.event;
            const drillToDetailFilters: BinaryQueryObjectFilterClause[] = [];
            drillToDetailFilters.push({
              col: this.props.formData?.granularitySqla,
              grain: this.props.formData?.timeGrainSqla,
              op: '==',
              val: data[0],
              formattedVal: this.props.xValueFormatter?.(data[0]),
            });
            this.props.onContextMenu(
              pointerEvent.clientX,
              pointerEvent.clientY,
              { drillToDetail: drillToDetailFilters },
            );
          }
        }
      },
    };

    return (
      echartOptions && (
        <Echart
          refs={refs}
          width={Math.floor(width)}
          height={maxHeight}
          echartOptions={echartOptions}
          eventHandlers={eventHandlers}
        />
      )
    );
  }


  render() {
    const {
      showTrendLine,
      height,
      kickerFontSize,
      headerFontSize,
      subheaderFontSize,
      enableClickableCard,
      redirectUrl,
    } = this.props;
    const className = this.getClassName();
    
    const containerStyle: React.CSSProperties = {
      position: 'relative' as const,
      cursor: enableClickableCard && redirectUrl ? 'pointer' : 'default',
    };

    if (showTrendLine) {
      const chartHeight = Math.floor(PROPORTION.TRENDLINE * height);
      const allTextHeight = height - chartHeight;

      return (
        <div 
          className={className} 
          style={containerStyle}
          onClick={enableClickableCard ? this.handleCardClick : undefined}
          role={enableClickableCard ? 'button' : undefined}
          tabIndex={enableClickableCard ? 0 : undefined}
          onKeyDown={enableClickableCard ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.handleCardClick();
            }
          } : undefined}
        >
          <div className="text-container" style={{ height: allTextHeight }}>
            {this.renderFallbackWarning()}
            {this.renderKicker(
              Math.ceil(
                (kickerFontSize || 0) * (1 - PROPORTION.TRENDLINE) * height,
              ),
            )}
            {this.renderHeader(
              Math.ceil(headerFontSize * (1 - PROPORTION.TRENDLINE) * height),
            )}
            {this.renderSubheader(
              Math.ceil(
                subheaderFontSize * (1 - PROPORTION.TRENDLINE) * height,
              ),
            )}
          </div>
          {this.renderTrendline(chartHeight)}
        </div>
      );
    }

    return (
      <div 
        className={className} 
        style={{ ...containerStyle, height }}
        onClick={enableClickableCard ? this.handleCardClick : undefined}
        role={enableClickableCard ? 'button' : undefined}
        tabIndex={enableClickableCard ? 0 : undefined}
        onKeyDown={enableClickableCard ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleCardClick();
          }
        } : undefined}
      >
        {this.renderFallbackWarning()}
        {this.renderKicker((kickerFontSize || 0) * height)}
        {this.renderHeader(Math.ceil(headerFontSize * height))}
        {this.renderSubheader(Math.ceil(subheaderFontSize * height))}
      </div>
    );
  }
}

export default styled(BigNumberVis)`
  ${({ theme, hoverBorderEnabled, hoverBorderThickness = 2, hoverBorderColor = '#1890ff', enableClickableCard, redirectUrl }) => `
    font-family: ${theme.typography.families.sansSerif};
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;

    &.no-trendline .subheader-line {
      padding-bottom: 0.3em;
    }

    .text-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      .alert {
        font-size: ${theme.typography.sizes.s};
        margin: -0.5em 0 0.4em;
        line-height: 1;
        padding: ${theme.gridUnit}px;
        border-radius: ${theme.gridUnit}px;
      }
    }

    .kicker {
      line-height: 1em;
      padding-bottom: 2em;
    }

    .header-line {
      position: relative;
      line-height: 1em;
      white-space: nowrap;
      margin-bottom:${theme.gridUnit * 2}px;
      span {
        position: static;
        bottom: auto;
      }
    }

    .subheader-line {
      line-height: 1em;
      padding-bottom: 0;
    }

    &.is-fallback-value {
      .kicker,
      .header-line,
      .subheader-line {
        opacity: ${theme.opacity.mediumHeavy};
      }
    }

    &.clickable-card {
      &:focus {
        outline: 2px solid ${theme.colors.primary.base};
        outline-offset: 2px;
      }
    }

    .comparison-indicator {
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      &:hover {
        transform: scale(1.05);
        transition: transform 0.2s ease;
      }
    }
  `}
`;
