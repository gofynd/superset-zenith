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
import Echart from '../components/Echart';
import { BigNumberVizProps } from './types';
import { EventHandlers } from '../types';

const defaultNumberFormatter = getNumberFormatter();

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
    
    if (!enableClickableCard || !redirectUrl || !hoverBorderEnabled) {
      return;
    }
    
    // Check if style already exists
    const styleId = 'bignumber-dashboard-holder-hover-style';
    if (document.getElementById(styleId)) {
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
    console.group('🖱️ BigNumber Card Click Handler');
    const { enableClickableCard, redirectUrl } = this.props;
    
    console.log('Props received:');
    console.log('   - enableClickableCard:', enableClickableCard);
    console.log('   - redirectUrl:', redirectUrl);
    console.log('   - All props:', this.props);
    
    if (enableClickableCard && redirectUrl) {
      // Validate URL is http/https only (security check)
      if (!redirectUrl.match(/^https?:\/\//)) {
        console.error('❌ Invalid URL protocol - only http:// and https:// are allowed');
        console.error('   - Attempted URL:', redirectUrl);
        console.groupEnd();
        return;
      }
      
      console.log('✅ URL validation passed');
      console.log('✅ Opening URL:', redirectUrl);
      // Open URL in new tab
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      console.log('✅ window.open() called');
    } else {
      console.warn('❌ Click ignored because:');
      if (!enableClickableCard) console.warn('   - enableClickableCard is false');
      if (!redirectUrl) console.warn('   - redirectUrl is missing/undefined');
    }
    
    console.groupEnd();
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
        }}
        onContextMenu={onContextMenu}
      >
        {text}
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

  renderIcon() {
    const { showIcon, iconUrl, iconSize = 'medium' } = this.props;
    
    if (!showIcon || !iconUrl) {
      return null;
    }

    const sizeMap = {
      small: '24px',
      medium: '32px',
      large: '40px',
      xlarge: '48px',
    };

    const iconSizePx = sizeMap[iconSize] || sizeMap.medium;

    return (
      <div className="big-number-icon" style={{ 
        position: 'absolute',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: iconSizePx,
        height: iconSizePx,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        padding: '4px',
      }}>
        <img
          src={iconUrl}
          alt="Metric Icon"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => {
            // Show error state instead of hiding
            const target = e.target as HTMLImageElement;
            const container = target.parentElement;
            if (container) {
              container.innerHTML = `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 100%;
                  height: 100%;
                  background-color: #ffebee;
                  border: 1px solid #f44336;
                  border-radius: 4px;
                  color: #d32f2f;
                  font-size: 10px;
                  text-align: center;
                  line-height: 1.2;
                ">
                  <div>⚠️<br/>Invalid<br/>Image</div>
                </div>
              `;
            }
          }}
          onLoad={(e) => {
            // Validate image dimensions when loaded
            const target = e.target as HTMLImageElement;
            const minDimension = 16; // Minimum 16x16 pixels
            const maxDimension = 512; // Maximum 512x512 pixels
            
            if (target.naturalWidth < minDimension || target.naturalHeight < minDimension) {
              const container = target.parentElement;
              if (container) {
                container.innerHTML = `
                  <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    background-color: #fff3e0;
                    border: 1px solid #ff9800;
                    border-radius: 4px;
                    color: #f57c00;
                    font-size: 10px;
                    text-align: center;
                    line-height: 1.2;
                  ">
                    <div>⚠️<br/>Too<br/>Small</div>
                  </div>
                `;
              }
            } else if (target.naturalWidth > maxDimension || target.naturalHeight > maxDimension) {
              const container = target.parentElement;
              if (container) {
                container.innerHTML = `
                  <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    background-color: #fff3e0;
                    border: 1px solid #ff9800;
                    border-radius: 4px;
                    color: #f57c00;
                    font-size: 10px;
                    text-align: center;
                    line-height: 1.2;
                  ">
                    <div>⚠️<br/>Too<br/>Large</div>
                  </div>
                `;
              }
            }
          }}
        />
      </div>
    );
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
      hoverBorderEnabled = false,
      hoverBorderThickness = 2,
      hoverBorderColor = '#1890ff',
    } = this.props;
    const className = this.getClassName();

    console.group('🎨 BigNumber Render');
    console.log('Render props:');
    console.log('   - enableClickableCard:', enableClickableCard);
    console.log('   - redirectUrl:', redirectUrl);
    console.log('   - hoverBorderEnabled:', hoverBorderEnabled);
    console.log('   - hoverBorderThickness:', hoverBorderThickness);
    console.log('   - hoverBorderColor:', hoverBorderColor);
    console.log('   - className:', className);
    
    const containerStyle: React.CSSProperties = {
      position: 'relative' as const,
      cursor: enableClickableCard && redirectUrl ? 'pointer' : 'default',
    };
    
    console.log('Container style:');
    console.log('   - cursor:', containerStyle.cursor);
    console.log('   - Will attach click handler?:', !!enableClickableCard);
    console.groupEnd();

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
          {this.renderIcon()}
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
        {this.renderIcon()}
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
        position: absolute;
        bottom: 0;
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

    .big-number-icon {
      z-index: 10;
      transition: all 0.2s ease;
      
      &:hover {
        transform: translateY(-50%) scale(1.05);
      }
      
      img {
        transition: all 0.2s ease;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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
