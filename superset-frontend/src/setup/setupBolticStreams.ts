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
 * Initialize Boltic Streams Analytics for tracking user interactions and BigNumber chart views
 * This function sets up the Stelios analytics tracking system early in the application lifecycle
 */
export default function setupBolticStreams() {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  const stelios = ((window as any).stelios = (window as any).stelios || []);

  if (!stelios.initialize) {
    if (stelios.invoked) {
      // eslint-disable-next-line no-console
      console.error('Stelios snippet included twice.');
    } else {
      stelios.invoked = true;
      stelios.methods = [
        'trackSubmit',
        'trackClick',
        'trackLink',
        'trackForm',
        'pageview',
        'identify',
        'reset',
        'group',
        'track',
        'ready',
        'alias',
        'debug',
        // 'page',
        'once',
        'off',
        'on',
        'addSourceMiddleware',
        'addIntegrationMiddleware',
        'setAnonymousId',
        'addDestinationMiddleware',
      ];

      // eslint-disable-next-line func-names
      stelios.factory = function (method: string) {
        // eslint-disable-next-line func-names
        return function (...args: any[]) {
          const allArgs = [method, ...args];
          stelios.push(allArgs);
          return stelios;
        };
      };

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < stelios.methods.length; i++) {
        const method = stelios.methods[i];
        stelios[method] = stelios.factory(method);
      }

      // eslint-disable-next-line func-names
      stelios.load = function (writeKey: string, callback?: () => void) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        if (callback) {
          script.onload = callback;
        }
        script.src =
          'https://cdn.pixelbin.io/v2/fyndcloud/fyndpd/original/m1/stelios/v1.54.8/prod/stelios.min.index.js';
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript?.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        }
        // eslint-disable-next-line no-underscore-dangle
        stelios._loadOptions = writeKey;
      };

      // eslint-disable-next-line no-underscore-dangle
      stelios._writeKey =
        'Zc7Og8DXevJG85xZyjKPJBAgkOITWUdtpDB8EsyQWxyx8JgqZIsGz-smhWqpsCcLJ0_wPw-3_NMkljT0x1SLsQ';
      // eslint-disable-next-line no-underscore-dangle
      stelios._cdn = 'https://apiv2-streams.boltic.io';
      stelios.SNIPPET_VERSION = '4.15.3';

      // eslint-disable-next-line no-underscore-dangle, func-names
      stelios.load(stelios._writeKey, function () {
        (window as any).stelios = (window as any).stelios.AnalyticsBrowser.load(
          {
            // eslint-disable-next-line no-underscore-dangle
            writeKey: stelios._writeKey,
          },
        );
        (window as any).stelios.page();
      });
    }
  }
}
