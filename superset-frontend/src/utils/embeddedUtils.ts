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

/**
 * Comprehensive embedded mode detection utility
 * Uses multiple methods to reliably detect if Superset is running in embedded context
 */
export interface EmbeddedDetectionResult {
  isEmbedded: boolean;
  methods: {
    iframe: boolean;
    standalone: boolean;
    embedded: boolean;
    uiConfig: boolean;
    guestToken: boolean;
    referrer: boolean;
    embeddedRoute: boolean;
  };
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detects if the current Superset instance is running in embedded mode
 * Uses multiple detection methods for reliability
 */
export function detectEmbeddedMode(): EmbeddedDetectionResult {
  // Method 1: Check if we're in an iframe (most reliable)
  const inIframe = typeof window !== 'undefined' && window.parent !== window;

  // Method 2: Check URL parameters for embedded indicators
  const urlParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const hasStandalone =
    urlParams.get('standalone') === '0' ||
    urlParams.get('standalone') === 'false';
  const hasEmbedded = urlParams.get('embedded') === 'true';
  const hasUiConfig = urlParams.get('uiConfig') !== null;

  // Method 3: Check if we're on the embedded route
  const isEmbeddedRoute =
    typeof window !== 'undefined' &&
    window.location.pathname.includes('/superset/dashboard/');

  // Method 4: Check for guest token (embedded context indicator)
  const hasGuestToken = urlParams.get('guest_token') !== null;

  // Method 5: Check document referrer for iframe context
  const hasReferrer =
    typeof document !== 'undefined' &&
    document.referrer &&
    document.referrer !== window.location.href;

  const methods = {
    iframe: inIframe,
    standalone: hasStandalone,
    embedded: hasEmbedded,
    uiConfig: hasUiConfig,
    guestToken: hasGuestToken,
    referrer: hasReferrer,
    embeddedRoute: isEmbeddedRoute,
  };

  // Calculate confidence based on detection methods
  const trueMethods = Object.values(methods).filter(Boolean).length;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (inIframe || hasStandalone || hasEmbedded) {
    confidence = 'high';
  } else if (isEmbeddedRoute && (hasUiConfig || hasGuestToken || hasReferrer)) {
    confidence = 'medium';
  }

  const isEmbedded =
    inIframe ||
    hasStandalone ||
    hasEmbedded ||
    (isEmbeddedRoute && (hasUiConfig || hasGuestToken || hasReferrer));

  return {
    isEmbedded,
    methods,
    confidence,
  };
}

/**
 * Simple boolean check for embedded mode
 * Uses the comprehensive detection but returns only the boolean result
 */
export function isEmbeddedMode(): boolean {
  return detectEmbeddedMode().isEmbedded;
}

/**
 * Get embedded context information for debugging
 */
export function getEmbeddedContext() {
  if (typeof window === 'undefined') {
    return { error: 'Not in browser environment' };
  }

  const urlParams = new URLSearchParams(window.location.search);

  return {
    url: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    inIframe: window.parent !== window,
    urlParams: {
      standalone: urlParams.get('standalone'),
      embedded: urlParams.get('embedded'),
      uiConfig: urlParams.get('uiConfig'),
      guest_token: urlParams.get('guest_token'),
    },
    detection: detectEmbeddedMode(),
  };
}
