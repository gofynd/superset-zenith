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
import { useEffect, useMemo, useState } from 'react';
import {
  css,
  ensureIsArray,
  fetchTimeRange,
  getTimeOffset,
  styled,
  t,
  useTheme,
  NumberFormats,
  getNumberFormatter,
} from '@superset-ui/core';
import { Tooltip } from '@superset-ui/chart-controls';
import { isEmpty } from 'lodash';
import {
  ColorSchemeEnum,
  PopKPIComparisonSymbolStyleProps,
  PopKPIComparisonValueStyleProps,
  PopKPIProps,
} from './types';
import { useOverflowDetection } from './useOverflowDetection';

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

const NumbersContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  overflow: auto;
`;

const ComparisonValue = styled.div<PopKPIComparisonValueStyleProps>`
  ${({ theme, subheaderFontSize }) => `
    font-weight: ${theme.typography.weights.light};
    display: flex;
    justify-content: center;
    font-size: ${subheaderFontSize || 20}px;
    flex: 1 1 0px;
  `}
`;

const SymbolWrapper = styled.span<PopKPIComparisonSymbolStyleProps>`
  ${({ theme, backgroundColor, textColor }) => `
    background-color: ${backgroundColor};
    color: ${textColor};
    padding: ${theme.gridUnit}px ${theme.gridUnit * 2}px;
    border-radius: ${theme.gridUnit * 2}px;
    margin-right: ${theme.gridUnit}px;
  `}
`;

// Trend icon container styled component (similar to ChartIconContainer)
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
    
    return css`
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: ${iconSize}px !important;
      height: ${iconSize}px !important;
      min-width: ${iconSize}px !important;
      min-height: ${iconSize}px !important;
      background-color: ${bgColor} !important;
      border-radius: ${borderRadius} !important;
      padding: ${iconSize * 0.2}px !important;
      margin-left: ${iconSize * 0.25}px !important;
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

export default function PopKPI(props: PopKPIProps) {
  const {
    height,
    width,
    bigNumber,
    exactBigNumber,
    prevNumber,
    valueDifference,
    percentDifferenceFormattedString,
    headerFontSize,
    subheaderFontSize,
    comparisonColorEnabled,
    comparisonColorScheme,
    percentDifferenceNumber,
    currentTimeRangeFilter,
    startDateOffset,
    shift,
    dashboardTimeRange,
    enableDetailOnHover = true,
    metricName,
    yAxisFormat,
    enableClickableCard = false,
    redirectUrl,
    uptrendIconType,
    uptrendIconUrl,
    uptrendIconBackgroundColor,
    uptrendIconShape = 'circle',
    downtrendIconType,
    downtrendIconUrl,
    downtrendIconBackgroundColor,
    downtrendIconShape = 'circle',
  } = props;

  const [comparisonRange, setComparisonRange] = useState<string>('');

  useEffect(() => {
    if (!currentTimeRangeFilter || (!shift && !startDateOffset)) {
      setComparisonRange('');
    } else if (!isEmpty(shift) || startDateOffset) {
      const newShift = getTimeOffset({
        timeRangeFilter: {
          ...currentTimeRangeFilter,
          comparator:
            dashboardTimeRange ?? (currentTimeRangeFilter as any).comparator,
        },
        shifts: ensureIsArray(shift),
        startDate: startDateOffset || '',
      });
      const promise: any = fetchTimeRange(
        dashboardTimeRange ?? (currentTimeRangeFilter as any).comparator,
        currentTimeRangeFilter.subject,
        newShift || [],
      );
      Promise.resolve(promise).then((res: any) => {
        const response: string[] = ensureIsArray(res.value);
        const firstRange: string = response.flat()[0];
        const rangeText = firstRange.split('vs\n');
        setComparisonRange(
          rangeText.length > 1 ? rangeText[1].trim() : rangeText[0],
        );
      });
    }
  }, [currentTimeRangeFilter, shift, startDateOffset, dashboardTimeRange]);

  const theme = useTheme();
  const flexGap = theme.gridUnit * 5;
  const wrapperDivStyles = css`
    font-family: ${theme.typography.families.sansSerif};
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${height}px;
    width: ${width}px;
    overflow: auto;
  `;

  const bigValueContainerStyles = css`
    font-size: ${headerFontSize || 60}px;
    font-weight: ${theme.typography.weights.normal};
    text-align: center;
    margin-bottom: ${theme.gridUnit * 4}px;
  `;

  const getArrowIndicatorColor = () => {
    if (!comparisonColorEnabled || percentDifferenceNumber === 0) {
      return theme.colors.grayscale.base;
    }

    if (percentDifferenceNumber > 0) {
      // Positive difference
      return comparisonColorScheme === ColorSchemeEnum.Green
        ? theme.colors.success.base
        : theme.colors.error.base;
    }
    // Negative difference
    return comparisonColorScheme === ColorSchemeEnum.Red
      ? theme.colors.success.base
      : theme.colors.error.base;
  };

  const arrowIndicatorStyle = css`
    color: ${getArrowIndicatorColor()};
    margin-left: ${theme.gridUnit}px;
  `;

  const defaultBackgroundColor = theme.colors.grayscale.light4;
  const defaultTextColor = theme.colors.grayscale.base;
  const { backgroundColor, textColor } = useMemo(() => {
    let bgColor = defaultBackgroundColor;
    let txtColor = defaultTextColor;
    if (comparisonColorEnabled && percentDifferenceNumber !== 0) {
      const useSuccess =
        (percentDifferenceNumber > 0 &&
          comparisonColorScheme === ColorSchemeEnum.Green) ||
        (percentDifferenceNumber < 0 &&
          comparisonColorScheme === ColorSchemeEnum.Red);

      // Set background and text colors based on the conditions
      bgColor = useSuccess
        ? theme.colors.success.light2
        : theme.colors.error.light2;
      txtColor = useSuccess
        ? theme.colors.success.base
        : theme.colors.error.base;
    }

    return {
      backgroundColor: bgColor,
      textColor: txtColor,
    };
  }, [
    theme,
    comparisonColorScheme,
    comparisonColorEnabled,
    percentDifferenceNumber,
  ]);

  const SYMBOLS_WITH_VALUES = useMemo(
    () => [
      {
        symbol: '#',
        value: prevNumber,
        tooltipText: t('Data for %s', comparisonRange || 'previous range'),
      },
      {
        symbol: '△',
        value: valueDifference,
        tooltipText: t('Value difference between the time periods'),
      },
      {
        symbol: '%',
        value: percentDifferenceFormattedString,
        tooltipText: t('Percentage difference between the time periods'),
      },
    ],
    [
      comparisonRange,
      prevNumber,
      valueDifference,
      percentDifferenceFormattedString,
    ],
  );

  const { isOverflowing, symbolContainerRef, wrapperRef } =
    useOverflowDetection(flexGap);

  const handleCardClick = () => {
    if (enableClickableCard && redirectUrl) {
      // Open URL in new tab
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const containerStyle = {
    ...wrapperDivStyles,
    cursor: enableClickableCard && redirectUrl ? 'pointer' : 'default',
  };

  return (
    <div 
      css={containerStyle} 
      ref={wrapperRef}
      onClick={enableClickableCard ? handleCardClick : undefined}
      role={enableClickableCard ? 'button' : undefined}
      tabIndex={enableClickableCard ? 0 : undefined}
      onKeyDown={enableClickableCard ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      } : undefined}
    >
      <NumbersContainer
        css={
          isOverflowing &&
          css`
            width: fit-content;
            margin: auto;
            align-items: flex-start;
          `
        }
      >
        <div css={bigValueContainerStyles}>
          {enableDetailOnHover &&
          exactBigNumber !== null &&
          !isPercentageFormat(yAxisFormat) ? (
            <Tooltip
              title={`${metricName}: ${getNumberFormatter(',.6f')(
                exactBigNumber,
              ).replace(/\.?0+$/, '')}`}
              placement="top"
            >
              <span>{bigNumber}</span>
            </Tooltip>
          ) : (
            bigNumber
          )}
          {percentDifferenceNumber !== 0 && (() => {
            const isUptrend = percentDifferenceNumber > 0;
            const hasCustomIcon = isUptrend 
              ? (uptrendIconUrl && uptrendIconType)
              : (downtrendIconUrl && downtrendIconType);
            
            // Use custom icon if provided, otherwise use default arrow
            if (hasCustomIcon) {
              const iconUrl = isUptrend ? uptrendIconUrl : downtrendIconUrl;
              const bgColor = isUptrend ? (uptrendIconBackgroundColor || 'transparent') : (downtrendIconBackgroundColor || 'transparent');
              const iconShape = isUptrend ? uptrendIconShape : downtrendIconShape;
              const iconSize = 24; // Small size for trend icons
              
              return (
                <TrendIconContainer
                  bgColor={bgColor}
                  iconShape={iconShape}
                  iconSize={iconSize}
                >
                  <img
                    src={iconUrl}
                    alt={isUptrend ? 'Uptrend' : 'Downtrend'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const container = target.parentElement;
                      if (container) {
                        container.style.display = 'none';
                      }
                    }}
                  />
                </TrendIconContainer>
              );
            }
            
            // Default arrow indicator
            return (
              <span css={arrowIndicatorStyle}>
                {isUptrend ? '↑' : '↓'}
              </span>
            );
          })()}
        </div>

        <div
          css={[
            css`
              display: flex;
              justify-content: space-around;
              gap: ${flexGap}px;
              min-width: 0;
              flex-shrink: 1;
            `,
            isOverflowing
              ? css`
                  flex-direction: column;
                  align-items: flex-start;
                  width: fit-content;
                `
              : css`
                  align-items: center;
                  width: 100%;
                `,
          ]}
          ref={symbolContainerRef}
        >
          {SYMBOLS_WITH_VALUES.map((symbol_with_value, index) => (
            <ComparisonValue
              key={`comparison-symbol-${symbol_with_value.symbol}`}
              subheaderFontSize={subheaderFontSize}
            >
              <Tooltip
                id="tooltip"
                placement="top"
                title={symbol_with_value.tooltipText}
              >
                <SymbolWrapper
                  backgroundColor={
                    index > 0 ? backgroundColor : defaultBackgroundColor
                  }
                  textColor={index > 0 ? textColor : defaultTextColor}
                >
                  {symbol_with_value.symbol}
                </SymbolWrapper>
                {symbol_with_value.value}
              </Tooltip>
            </ComparisonValue>
          ))}
        </div>
      </NumbersContainer>
    </div>
  );
}
