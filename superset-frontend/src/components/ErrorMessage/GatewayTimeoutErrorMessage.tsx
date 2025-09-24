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
import { t } from '@superset-ui/core';
import { ErrorAlert } from './ErrorAlert';
import type { ErrorMessageComponentProps } from './types';

interface GatewayTimeoutErrorExtra {
  status?: number;
  statusText?: string;
}

export function GatewayTimeoutErrorMessage({
  error,
  source,
}: ErrorMessageComponentProps<GatewayTimeoutErrorExtra>) {
  const isVisualization = (
    ['dashboard', 'explore'] as (string | undefined)[]
  ).includes(source);

  const subtitle = isVisualization
    ? t("We're trying to load a large amount of data, and it's taking longer than expected. Please refresh the page to try again.")
    : t("We're trying to load a large amount of data, and it's taking longer than expected. Please refresh the page to try again.");

  return (
    <ErrorAlert
      errorType={t('Oops! That took too long.')}
      message={subtitle}
      type="error"
    />
  );
}
