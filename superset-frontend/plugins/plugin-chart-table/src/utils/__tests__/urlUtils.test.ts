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

import { validateAndFormatUrl, getHyperlinkDisplayText, isValidUrl } from '../urlUtils';

describe('urlUtils', () => {
  describe('validateAndFormatUrl', () => {
    it('should add https:// prefix to URLs without protocol', () => {
      expect(validateAndFormatUrl('example.com')).toBe('https://example.com');
      expect(validateAndFormatUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('should preserve existing protocols', () => {
      expect(validateAndFormatUrl('https://example.com')).toBe('https://example.com');
      expect(validateAndFormatUrl('http://example.com')).toBe('http://example.com');
    });

    it('should return null for invalid values', () => {
      expect(validateAndFormatUrl(null)).toBeNull();
      expect(validateAndFormatUrl(undefined)).toBeNull();
      expect(validateAndFormatUrl('')).toBeNull();
      expect(validateAndFormatUrl(123)).toBeNull();
    });

    it('should return null for invalid URLs', () => {
      expect(validateAndFormatUrl('not-a-url')).toBeNull();
      expect(validateAndFormatUrl('://invalid')).toBeNull();
    });

    it('should handle URLs with special characters', () => {
      expect(validateAndFormatUrl('example.com/path?query=value')).toBe('https://example.com/path?query=value');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('example.com')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });

  describe('getHyperlinkDisplayText', () => {
    it('should return string representation of values', () => {
      expect(getHyperlinkDisplayText('Hello')).toBe('Hello');
      expect(getHyperlinkDisplayText(123)).toBe('123');
      expect(getHyperlinkDisplayText(true)).toBe('true');
    });

    it('should return empty string for null/undefined', () => {
      expect(getHyperlinkDisplayText(null)).toBe('');
      expect(getHyperlinkDisplayText(undefined)).toBe('');
    });
  });
});
