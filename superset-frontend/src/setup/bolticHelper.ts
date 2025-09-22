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
    console.group('🎯 BolticHelper.checkThresholdAndTrack');
    console.log('📊 Input Payload:', {
      chartId: payload.chart?.id,
      chartType: payload.chart?.type,
      chartName: payload.chart?.name,
      currentValue: payload.chart?.currentValue,
      dashboardId: payload.dashboard?.id,
      dashboardTitle: payload.dashboard?.title,
    });

    const chartId = Number(payload.chart.id);
    const currentValue = Number(payload.chart.currentValue);

    console.log('🔢 Parsed Values:', {
      chartId,
      currentValue,
      chartIdValid: !isNaN(chartId),
      currentValueValid: !isNaN(currentValue),
    });

    if (isNaN(chartId) || isNaN(currentValue)) {
      console.log('❌ Invalid values - skipping threshold check');
      console.groupEnd();
      return;
    }

    const thresholdConfig = this.thresholds.find(t => t.chartId === chartId);
    console.log('🔍 Threshold Lookup:', {
      availableThresholds: this.thresholds,
      foundConfig: thresholdConfig,
      chartId,
    });

    if (!thresholdConfig) {
      console.log('⏭️ No threshold config found for chart ID:', chartId);
      console.groupEnd();
      return;
    }

    console.log('📏 Threshold Analysis:', {
      thresholdValue: thresholdConfig.threshold,
      currentValue,
      isThresholdCrossed: currentValue >= thresholdConfig.threshold,
      difference: currentValue - thresholdConfig.threshold,
    });

    // Check if threshold is crossed
    if (currentValue >= thresholdConfig.threshold) {
      const alreadyTriggered = this.triggeredCharts.has(chartId);
      console.log('🎯 Threshold Crossed!', {
        alreadyTriggered,
        willTrack: !alreadyTriggered,
      });

      if (!alreadyTriggered) {
        this.triggeredCharts.add(chartId);
        console.log('✅ Added to triggered charts, calling trackThresholdCrossed...');
        this.trackThresholdCrossed(payload, thresholdConfig);
      } else {
        console.log('⏭️ Already triggered for this chart, skipping');
      }
    } else {
      console.log('📉 Threshold not crossed yet');
    }

    console.log('📊 Triggered Charts Status:', Array.from(this.triggeredCharts));
    console.groupEnd();
  }

  /**
   * Track threshold crossed event using stelios.once
   */
  private trackThresholdCrossed(
    payload: any,
    thresholdConfig: ThresholdConfig,
  ) {
    console.group('📤 trackThresholdCrossed');
    console.log('🎯 Threshold Crossed Event:', {
      chartId: payload.chart?.id,
      chartName: payload.chart?.name,
      thresholdValue: thresholdConfig.threshold,
      currentValue: payload.chart?.currentValue,
      crossedBy: Number(payload.chart?.currentValue) - thresholdConfig.threshold,
    });

    if (typeof window !== 'undefined' && (window as any).stelios) {
      console.log('✅ Stelios available, creating analytics data...');
      
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

      console.log('📊 Analytics Data Created:', {
        event: analyticsData.event,
        timestamp: analyticsData.timestamp,
        chartId: analyticsData.chart?.id,
        thresholdValue: analyticsData.threshold.thresholdValue,
        currentValue: analyticsData.threshold.currentValue,
        crossedBy: analyticsData.threshold.crossedBy,
      });

      console.log('📡 Sending to Stelios...');
      (window as any).stelios.track('BigNumber Threshold Crossed', analyticsData);
      console.log('✅ Stelios track event sent successfully');
    } else {
      console.log('❌ Stelios not available - cannot send analytics');
    }
    
    console.groupEnd();
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
