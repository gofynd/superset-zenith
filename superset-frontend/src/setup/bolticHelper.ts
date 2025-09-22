/* eslint-disable no-restricted-globals */
/**
 * Boltic Helper class for managing analytics and threshold-based tracking
 */

interface ThresholdConfig {
  chartId: number;
  title: string;
  threshold: number;
}

interface BigNumberAnalyticsPayload {
  dashboard: {
    id: string | number;
    title: string;
  };
  chart: {
    id: string | number;
    type: string;
    name: string;
    description?: string | null;
    currentValue: number | string | null;
    previousValue?: number | string | null;
    percentageChange?: number | null;
    comparisonType?: string | null;
    headerFontSize?: number | null;
    subheaderFontSize?: number | null;
    yAxisFormat?: string | null;
    timeFormat?: string | null;
    enableDetailOnHover?: boolean | null;
    conditionalFormatting?: any[];
    dashboards?: number[];
    chartId: string | number;
  };
  metric: {
    label: string;
    aggregate?: string | null;
    expressionType?: string | null;
    hasCustomLabel?: boolean;
    optionName?: string | null;
    sqlExpression?: string | null;
    datasourceWarning?: boolean;
    column?: {
      id: number;
      columnName: string;
      type: string;
      typeGeneric: number;
      isCertified: boolean;
      certifiedBy?: string | null;
      certificationDetails?: string | null;
      description?: string | null;
      expression?: string | null;
      filterable: boolean;
      groupby: boolean;
      isDttm: boolean;
      pythonDateFormat?: string | null;
      verboseName?: string | null;
      warningMarkdown?: string | null;
      advancedDataType?: string | null;
    } | null;
  };
  datasource: {
    id: string | number;
    name: string;
    type: string;
    database?: string | null;
    schema?: string | null;
    table?: string | null;
  };
  filters: {
    adhocFilters: any[];
    extraFilters: any[];
    dataMask: any;
    extraFormData: any;
    urlParams: any;
  };
  styling: {
    colorScheme?: string | null;
    labelColors: any;
    sharedLabelColors: string[];
    mapLabelColors: any;
  };
  exportOptions: {
    showFullscreenMenu: boolean;
    showDataMenu: boolean;
    enableExportCsv: boolean;
    enableExportExcel: boolean;
    enableExportFullCsv: boolean;
    enableExportFullExcel: boolean;
    enableDownloadImage: boolean;
  };
  context: {
    timestamp: string;
    isEmbedded: boolean;
    extraControls: any;
  };
}

class BolticHelper {
  private thresholds: ThresholdConfig[] = [];

  private triggeredCharts: Set<number> = new Set();

  constructor() {
    this.loadThresholds();
  }

  /**
   * Load threshold configuration from environment variables
   */
  private loadThresholds() {
    try {
      const thresholdsEnv = process.env.BOLTIC_STREAMS_CHART_TRIGGER_THRESHOLDS;
      // const thresholdsEnv = '[{"chartId": 152, "title": "Total Orders", "threshold": 330000}]'
      console.log({ thresholdsEnv, 'process.env': process.env });
      if (thresholdsEnv) {
        this.thresholds = JSON.parse(thresholdsEnv);
        // eslint-disable-next-line no-console
        console.log('📊 Loaded BigNumber thresholds:', this.thresholds);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse BIG_NUMBER_THRESHOLDS:', error);
    }
  }

  /**
   * Check if chart value crosses threshold and trigger analytics
   */
  checkThresholdAndTrack(payload: BigNumberAnalyticsPayload) {
    const chartId = Number(payload.chart.id);
    const currentValue = Number(payload.chart.currentValue);

    if (isNaN(chartId) || isNaN(currentValue)) {
      return;
    }
    const thresholdConfig = this.thresholds.find(t => t.chartId === chartId);

    if (!thresholdConfig) return;

    // Check if threshold is crossed
    if (currentValue >= thresholdConfig.threshold) {
      if (!this.triggeredCharts.has(chartId)) {
        this.triggeredCharts.add(chartId);
        this.trackThresholdCrossed(payload, thresholdConfig);
      }
    }
  }

  /**
   * Track threshold crossed event using stelios.once
   */
  private trackThresholdCrossed(
    payload: BigNumberAnalyticsPayload,
    thresholdConfig: ThresholdConfig,
  ) {
    if (typeof window !== 'undefined' && (window as any).stelios) {
      const { stelios } = window as any;

      const analyticsData = {
        event: 'big_number_threshold_crossed',
        timestamp: new Date().toISOString(),
        dashboard: payload.dashboard,
        chart: {
          id: payload.chart.id,
          name: payload.chart.name,
          type: payload.chart.type,
          description: payload.chart.description,
          currentValue: payload.chart.currentValue,
          previousValue: payload.chart.previousValue,
          percentageChange: payload.chart.percentageChange,
          comparisonType: payload.chart.comparisonType,
          headerFontSize: payload.chart.headerFontSize,
          subheaderFontSize: payload.chart.subheaderFontSize,
          yAxisFormat: payload.chart.yAxisFormat,
          timeFormat: payload.chart.timeFormat,
          enableDetailOnHover: payload.chart.enableDetailOnHover,
          conditionalFormatting: payload.chart.conditionalFormatting,
          dashboards: payload.chart.dashboards,
        },
        metric: payload.metric,
        datasource: payload.datasource,
        filters: payload.filters,
        threshold: {
          configTitle: thresholdConfig.title,
          thresholdValue: thresholdConfig.threshold,
          currentValue: payload.chart.currentValue,
          crossedBy:
            Number(payload.chart.currentValue) - thresholdConfig.threshold,
        },
      };

      // eslint-disable-next-line no-console
      console.group('🎯 BigNumber Threshold Crossed!');
      // eslint-disable-next-line no-console
      console.log('📊 Analytics Data:', analyticsData);
      // eslint-disable-next-line no-console
      console.groupEnd();
      stelios.track('BigNumber Threshold Crossed', analyticsData);
    }
  }

  /**
   * Reset triggered charts (useful for testing)
   */
  resetTriggeredCharts() {
    this.triggeredCharts.clear();
  }

  /**
   * Get current thresholds
   */
  getThresholds() {
    return this.thresholds;
  }

  /**
   * Get triggered charts
   */
  getTriggeredCharts() {
    return Array.from(this.triggeredCharts);
  }
}

export default BolticHelper;
