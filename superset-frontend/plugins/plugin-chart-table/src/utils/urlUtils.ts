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

import { DataRecordValue } from '@superset-ui/core';

/**
 * Validates and formats a URL string
 * @param url - The URL string to validate and format
 * @returns A properly formatted URL or null if invalid
 */
export function validateAndFormatUrl(url: DataRecordValue): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let formattedUrl = url.trim();
  
  // If URL is empty, return null
  if (!formattedUrl) {
    return null;
  }

  // If URL doesn't have a protocol, add https://
  if (!formattedUrl.match(/^https?:\/\//i)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Basic URL validation
  try {
    new URL(formattedUrl);
    return formattedUrl;
  } catch {
    // If URL is still invalid, return null
    return null;
  }
}

/**
 * Checks if a URL is valid
 * @param url - The URL string to check
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: DataRecordValue): boolean {
  return validateAndFormatUrl(url) !== null;
}

/**
 * Gets the display text for a hyperlink
 * @param displayValue - The value to display as link text
 * @returns The display text or a fallback
 */
export function getHyperlinkDisplayText(displayValue: DataRecordValue): string {
  if (displayValue === null || displayValue === undefined) {
    return '';
  }
  return String(displayValue);
}
