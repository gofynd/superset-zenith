/* eslint-disable no-restricted-globals */
/**
 * Boltic Helper class for managing analytics and threshold-based tracking
 */

interface ThresholdConfig {
  chartId: number;
  title: string;
  threshold: number;
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
      // const thresholdsEnv = process.env.BOLTIC_STREAMS_CHART_TRIGGER_THRESHOLDS;
      const thresholdsEnv: any = [{"chartId":152,"threshold":330000}, {"chartId":248,"threshold":10000}, {"chartId":570,"threshold":10000}];
      if (thresholdsEnv) {
        this.thresholds = JSON.parse(thresholdsEnv);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse BIG_NUMBER_THRESHOLDS:', error);
    }
  }

  /**
   * Check if chart value crosses threshold and trigger analytics
   */
  checkThresholdAndTrack(payload: any) {
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
    payload: any,
    thresholdConfig: ThresholdConfig,
  ) {
    if (typeof window !== 'undefined' && (window as any).stelios) {
      const { stelios } = window as any;

      const analyticsData = {
        event: 'big_number_threshold_crossed',
        timestamp: new Date().toISOString(),
        user: payload.user,
        dashboard: payload.dashboard,
        chart: payload.chart,
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
