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

// Broadcasts the full dashboard status to the parent frame on every Redux update.
// No filtering, no guards — Superset is a dumb emitter; the SDK decides what to do.
export function postEmbeddedDashboardStatus(dashboardStatus: object): void {
  if (!isEmbeddedMode()) return;
  window.parent.postMessage(
    { type: '__superset_dashboard_status__', dashboardStatus },
    '*',
  );
}

export interface EmbeddedDetectionResult {
  isEmbedded: boolean;
  reason: string;
}

/**
 * Detects if the current Superset instance is running in embedded mode
 * Uses the most reliable detection methods
 */
export function detectEmbeddedMode(): EmbeddedDetectionResult {
  // Check if we're in an iframe (most reliable indicator)
  const inIframe = typeof window !== 'undefined' && window.parent !== window;
  if (inIframe) {
    return { isEmbedded: true, reason: 'iframe' };
  }

  // Check URL parameters for embedded indicators
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for explicit embedded flag
    if (urlParams.get('embedded') === 'true') {
      return { isEmbedded: true, reason: 'embedded_param' };
    }

    // Check for standalone=false (embedded context)
    if (
      urlParams.get('standalone') === '0' ||
      urlParams.get('standalone') === 'false'
    ) {
      return { isEmbedded: true, reason: 'standalone_false' };
    }

    // Check for guest token (embedded context)
    if (urlParams.get('guest_token') !== null) {
      return { isEmbedded: true, reason: 'guest_token' };
    }
  }

  return { isEmbedded: false, reason: 'none' };
}

/**
 * Simple boolean check for embedded mode
 * Uses the comprehensive detection but returns only the boolean result
 */
export function isEmbeddedMode(): boolean {
  return detectEmbeddedMode().isEmbedded;
}
