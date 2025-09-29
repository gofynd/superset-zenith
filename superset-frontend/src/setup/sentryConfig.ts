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
 * KIND, either express or implied.  See the specific language
 * governing permissions and limitations under the License.
 */

import * as Sentry from '@sentry/react';
import { ErrorContext } from 'packages/superset-ui-core/src/connection/callApi/errorLogger';

/**
 * Sentry configuration for Superset
 */
export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  debug?: boolean;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

/**
 * Default Sentry configuration
 */
const DEFAULT_CONFIG: SentryConfig = {
  dsn: '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || 'superset@4.1.3',
  debug: process.env.NODE_ENV === 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
  replaysOnErrorSampleRate: 1.0,
};

/**
 * Initialize Sentry with configuration
 */
export function initializeSentry(config?: Partial<SentryConfig>): void {
  try {
    // Check if required environment variables are available
    const sentryDsn = process.env.SENTRY_DSN;
    const sentryEnvironment = process.env.SENTRY_ENVIRONMENT;

    if (!sentryDsn) {
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️ SENTRY_DSN not found in environment variables. Sentry will not be initialized.',
      );
      return;
    }

    if (!sentryEnvironment) {
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️ SENTRY_ENVIRONMENT not found in environment variables. Sentry will not be initialized.',);
      return;
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    finalConfig.dsn = sentryDsn;
    finalConfig.environment = sentryEnvironment;

    if (process.env.SENTRY_RELEASE) {
      finalConfig.release = process.env.SENTRY_RELEASE;
    }
    Sentry.init({
      dsn: finalConfig.dsn,
      sendDefaultPii: true,
      debug: finalConfig.debug,
      environment: finalConfig.environment,
      release: finalConfig.release,
      transportOptions: {
        beacon: true,
        fetch: {
          keepalive: true,
        },
      },
    });

    if (typeof window !== 'undefined' && window.location) {
      Sentry.setContext('page', {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
      });
    }

    // eslint-disable-next-line no-console
    console.log(
      '🔍 Sentry initialized successfully with environment variables',
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Enhanced error reporting with Superset context
 */
export function reportErrorWithContext(
  error: Error | string,
  context: ErrorContext,
  level: 'error' | 'warning' | 'info' | 'debug' = 'error',
): void {
  try {
    if (!Sentry.getCurrentScope()) {
      return;
    }

    const errorObj = error instanceof Error ? error : new Error(error);

    Sentry.setUser({
      id: context.dashboardId?.toString(),
      username: context.dashboardName,
    });

    Sentry.setContext('dashboard', {
      id: context.dashboardId,
      name: context.dashboardName,
    });

    Sentry.setContext('chart', {
      id: context.sliceId,
      name: context.chartName,
    });

    Sentry.setContext('request', {
      url: context.url,
      method: context.method,
      filters: context.filters,
    });

    Sentry.captureException(errorObj, {
      level,
      tags: {
        component: 'superset-api',
        dashboardId: context.dashboardId?.toString(),
        sliceId: context.sliceId?.toString(),
      },
      extra: {
        timestamp: context.timestamp,
        url: context.url,
        method: context.method,
        filters: context.filters,
      },
    });
  } catch (reportError) {
    try {
      Sentry.captureException(
        error instanceof Error ? error : new Error(error),
      );
    } catch (fallbackError) {
      // eslint-disable-next-line no-console
      console.error('Failed to report error with context:', reportError);
      // eslint-disable-next-line no-console
      console.error('Sentry fallback also failed:', fallbackError);
    }
  }
}

/**
 * Report performance metrics
 */
export function reportPerformance(
  operation: string,
  duration: number,
  context?: Partial<ErrorContext>,
): void {
  try {
    Sentry.addBreadcrumb({
      message: `Performance: ${operation}`,
      category: 'performance',
      level: 'info',
      data: {
        duration,
        operation,
        ...context,
      },
    });

    if (duration > 1000) {
      Sentry.startSpan(
        {
          name: `superset.${operation}`,
          op: 'performance',
          attributes: {
            component: 'superset-frontend',
            operation,
            duration,
          },
        },
        span => {
          span?.setAttributes({
            duration,
            context: JSON.stringify(context),
          });
        },
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to report performance:', error);
  }
}

/**
 * Set user context for better error tracking
 */
export function setUserContext(user: {
  id?: string | number;
  username?: string;
  email?: string;
  role?: string;
  company?: string;
}): void {
  try {
    Sentry.setUser(user);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to set user context:', error);
  }
}

/**
 * Add breadcrumb for user actions
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: any,
): void {
  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to add breadcrumb:', error);
  }
}

export default Sentry;
