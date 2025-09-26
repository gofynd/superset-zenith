/*
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

import { JsonObject } from '../types';

export interface ErrorContext {
  dashboardName?: string;
  dashboardId?: string | number;
  chartName?: string;
  sliceId?: string | number;
  error: Error | string;
  filters?: JsonObject;
  url?: string;
  method?: string;
  timestamp?: string;
}

/**
 * Extracts dashboard and chart context from various sources
 */
function extractContextFromUrl(url: string): Partial<ErrorContext> {
  const urlObj = new URL(url, window.location.href);
  const searchParams = urlObj.searchParams;
  
  return {
    dashboardId: searchParams.get('dashboard_id') || undefined,
    sliceId: searchParams.get('slice_id') || undefined,
  };
}

/**
 * Extracts context from request body/payload
 */
function extractContextFromPayload(payload: any): Partial<ErrorContext> {
  if (!payload) return {};
  
  let context: Partial<ErrorContext> = {};
  
  // Handle different payload types
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      context = extractContextFromPayload(parsed);
    } catch {
      // If parsing fails, return empty context
    }
  } else if (typeof payload === 'object') {
    // Extract dashboard and chart info from form data or JSON payload
    if (payload.dashboardId) {
      context.dashboardId = payload.dashboardId;
    }
    if (payload.sliceId) {
      context.sliceId = payload.sliceId;
    }
    if (payload.dashboard_id) {
      context.dashboardId = payload.dashboard_id;
    }
    if (payload.slice_id) {
      context.sliceId = payload.slice_id;
    }
    if (payload.form_data) {
      const formData = payload.form_data;
      if (formData.dashboardId) {
        context.dashboardId = formData.dashboardId;
      }
      if (formData.sliceId) {
        context.sliceId = formData.sliceId;
      }
      if (formData.dashboard_id) {
        context.dashboardId = formData.dashboard_id;
      }
      if (formData.slice_id) {
        context.sliceId = formData.slice_id;
      }
    }
    // Extract filters
    if (payload.filters) {
      context.filters = payload.filters;
    } else if (payload.form_data?.filters) {
      context.filters = payload.form_data.filters;
    }
  }
  
  return context;
}

/**
 * Extracts context from localStorage (dashboard context)
 */
function extractContextFromLocalStorage(): Partial<ErrorContext> {
  try {
    // Check if we're in a dashboard context
    const dashboardContexts = localStorage.getItem('superset.dashboard.explore.context');
    if (dashboardContexts) {
      const contexts = JSON.parse(dashboardContexts);
      const currentPageId = new URLSearchParams(window.location.search).get('dashboard_page_id');
      
      if (currentPageId && contexts[currentPageId]) {
        const context = contexts[currentPageId];
        return {
          dashboardId: context.dashboardId,
          // Note: We can't easily get dashboard name and chart name from here
          // without additional API calls, so we'll leave them undefined
        };
      }
    }
  } catch (error) {
    // Silently fail if localStorage access fails
  }
  
  return {};
}

/**
 * Extracts context from URL parameters
 */
function extractContextFromUrlParams(): Partial<ErrorContext> {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    dashboardId: urlParams.get('dashboard_id') || undefined,
    sliceId: urlParams.get('slice_id') || undefined,
  };
}

/**
 * Gets chart name from slice ID if possible
 */
function getChartNameFromSliceId(sliceId: string | number): string | undefined {
  try {
    // This would require access to the Redux store or making an API call
    // For now, we'll return undefined as we don't have direct access to the store
    // In a real implementation, you might want to pass the store or chart data
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Gets dashboard name from dashboard ID if possible
 */
function getDashboardNameFromId(dashboardId: string | number): string | undefined {
  try {
    // This would require access to the Redux store or making an API call
    // For now, we'll return undefined as we don't have direct access to the store
    // In a real implementation, you might want to pass the store or dashboard data
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Enhanced error logger that extracts and logs dashboard/chart context
 */
export function logApiError(
  error: Error | string,
  url?: string,
  method?: string,
  payload?: any
): void {
  try {
    const context: ErrorContext = {
      error: error instanceof Error ? error : new Error(error),
      url,
      method,
      timestamp: new Date().toISOString(),
    };

    // Extract context from various sources
    const urlContext = url ? extractContextFromUrl(url) : {};
    const payloadContext = payload ? extractContextFromPayload(payload) : {};
    const localStorageContext = extractContextFromLocalStorage();
    const urlParamsContext = extractContextFromUrlParams();

    // Merge all context sources
    const mergedContext = {
      ...urlContext,
      ...payloadContext,
      ...localStorageContext,
      ...urlParamsContext,
    };

    // Add extracted context to error context
    Object.assign(context, mergedContext);

    // Try to get names from IDs
    if (context.sliceId && !context.chartName) {
      context.chartName = getChartNameFromSliceId(context.sliceId);
    }
    if (context.dashboardId && !context.dashboardName) {
      context.dashboardName = getDashboardNameFromId(context.dashboardId);
    }

    // Log the enhanced error information
    console.group('🚨 Superset API Error');
    console.log('Dashboard Name:', context.dashboardName || 'N/A');
    console.log('Dashboard ID:', context.dashboardId || 'N/A');
    console.log('Chart/Slice Name:', context.chartName || 'N/A');
    console.log('Slice ID:', context.sliceId || 'N/A');
    console.log('Error:', context.error);
    console.log('Filters:', context.filters || 'N/A');
    console.log('URL:', context.url || 'N/A');
    console.log('Method:', context.method || 'N/A');
    console.log('Timestamp:', context.timestamp);
    console.groupEnd();
  } catch (logError) {
    // Fallback to basic error logging if enhanced logging fails
    console.error('API Error (enhanced logging failed):', error);
    console.error('Logging error:', logError);
  }
}

/**
 * Enhanced error logger with store access for better context extraction
 * This version can be used when you have access to the Redux store
 */
export function logApiErrorWithStore(
  error: Error | string,
  url?: string,
  method?: string,
  payload?: any,
  store?: any
): void {
  try {
    const context: ErrorContext = {
      error: error instanceof Error ? error : new Error(error),
      url,
      method,
      timestamp: new Date().toISOString(),
    };

    // Extract context from various sources
    const urlContext = url ? extractContextFromUrl(url) : {};
    const payloadContext = payload ? extractContextFromPayload(payload) : {};
    const localStorageContext = extractContextFromLocalStorage();
    const urlParamsContext = extractContextFromUrlParams();

    // Merge all context sources
    const mergedContext = {
      ...urlContext,
      ...payloadContext,
      ...localStorageContext,
      ...urlParamsContext,
    };

    // Add extracted context to error context
    Object.assign(context, mergedContext);

    // Try to get names from store if available
    if (store && store.getState) {
      try {
        const state = store.getState();
        
        // Get dashboard info
        if (context.dashboardId && state.dashboardInfo) {
          context.dashboardName = state.dashboardInfo.dashboard_title || 
                                 state.dashboardInfo.title || 
                                 state.dashboardInfo.name;
        }
        
        // Get chart info
        if (context.sliceId && state.sliceEntities && state.sliceEntities.slices) {
          const slice = state.sliceEntities.slices[context.sliceId];
          if (slice) {
            context.chartName = slice.slice_name || slice.title || slice.name;
          }
        }
      } catch (storeError) {
        // Silently fail if store access fails
      }
    }

    // Fallback to ID-based name resolution if store is not available
    if (context.sliceId && !context.chartName) {
      context.chartName = getChartNameFromSliceId(context.sliceId);
    }
    if (context.dashboardId && !context.dashboardName) {
      context.dashboardName = getDashboardNameFromId(context.dashboardId);
    }

    // Log the enhanced error information
    console.group('🚨 Superset API Error');
    console.log('Dashboard Name:', context.dashboardName || 'N/A');
    console.log('Dashboard ID:', context.dashboardId || 'N/A');
    console.log('Chart/Slice Name:', context.chartName || 'N/A');
    console.log('Slice ID:', context.sliceId || 'N/A');
    console.log('Error:', context.error);
    console.log('Filters:', context.filters || 'N/A');
    console.log('URL:', context.url || 'N/A');
    console.log('Method:', context.method || 'N/A');
    console.log('Timestamp:', context.timestamp);
    console.groupEnd();
  } catch (logError) {
    // Fallback to basic error logging if enhanced logging fails
    console.error('API Error (enhanced logging failed):', error);
    console.error('Logging error:', logError);
  }
}
