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

import { logApiError, logApiErrorWithStore } from '../errorLogger';

// Mock console methods
const mockConsoleGroup = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleGroupEnd = jest.fn();
const mockConsoleError = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

// Mock window.location
const mockLocation = {
  href: 'https://localhost:8088/superset/dashboard/123/',
  search: '?dashboard_id=123&slice_id=456',
};

// Mock URLSearchParams
const mockURLSearchParams = jest.fn();

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Mock console methods
  global.console = {
    ...console,
    group: mockConsoleGroup,
    log: mockConsoleLog,
    groupEnd: mockConsoleGroupEnd,
    error: mockConsoleError,
  };
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
  
  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  });
  
  // Mock URLSearchParams
  global.URLSearchParams = mockURLSearchParams as any;
  mockURLSearchParams.mockImplementation((search) => ({
    get: (key: string) => {
      const params = new URLSearchParams(search);
      return params.get(key);
    },
  }));
});

describe('errorLogger', () => {
  describe('logApiError', () => {
    it('should log basic error information', () => {
      const error = new Error('Test error');
      const url = 'https://localhost:8088/api/v1/chart/data';
      const method = 'POST';
      const payload = { dashboardId: 123, sliceId: 456 };

      logApiError(error, url, method, payload);

      expect(mockConsoleGroup).toHaveBeenCalledWith('🚨 Superset API Error');
      expect(mockConsoleLog).toHaveBeenCalledWith('Dashboard Name:', 'N/A');
      expect(mockConsoleLog).toHaveBeenCalledWith('Dashboard ID:', 123);
      expect(mockConsoleLog).toHaveBeenCalledWith('Chart/Slice Name:', 'N/A');
      expect(mockConsoleLog).toHaveBeenCalledWith('Slice ID:', 456);
      expect(mockConsoleLog).toHaveBeenCalledWith('Error:', error);
      expect(mockConsoleLog).toHaveBeenCalledWith('Filters:', 'N/A');
      expect(mockConsoleLog).toHaveBeenCalledWith('URL:', url);
      expect(mockConsoleLog).toHaveBeenCalledWith('Method:', method);
      expect(mockConsoleLog).toHaveBeenCalledWith('Timestamp:', expect.any(String));
      expect(mockConsoleGroupEnd).toHaveBeenCalled();
    });

    it('should extract context from URL parameters', () => {
      const error = new Error('Test error');
      const url = 'https://localhost:8088/api/v1/chart/data?dashboard_id=789&slice_id=101';

      logApiError(error, url);

      expect(mockConsoleLog).toHaveBeenCalledWith('Dashboard ID:', '789');
      expect(mockConsoleLog).toHaveBeenCalledWith('Slice ID:', '101');
    });

    it('should extract context from form data payload', () => {
      const error = new Error('Test error');
      const formData = new FormData();
      formData.append('dashboardId', '123');
      formData.append('sliceId', '456');
      formData.append('filters', JSON.stringify({ status: 'active' }));

      logApiError(error, undefined, 'POST', formData);

      expect(mockConsoleLog).toHaveBeenCalledWith('Dashboard ID:', '123');
      expect(mockConsoleLog).toHaveBeenCalledWith('Slice ID:', '456');
    });

    it('should extract context from JSON payload', () => {
      const error = new Error('Test error');
      const payload = {
        form_data: {
          dashboardId: 123,
          sliceId: 456,
          filters: { status: 'active' },
        },
      };

      logApiError(error, undefined, 'POST', payload);

      expect(mockConsoleLog).toHaveBeenCalledWith('Dashboard ID:', 123);
      expect(mockConsoleLog).toHaveBeenCalledWith('Slice ID:', 456);
      expect(mockConsoleLog).toHaveBeenCalledWith('Filters:', { status: 'active' });
    });

    it('should handle string error', () => {
      const error = 'String error message';

      logApiError(error);

      expect(mockConsoleLog).toHaveBeenCalledWith('Error:', expect.any(Error));
    });

    it('should fallback to basic error logging if enhanced logging fails', () => {
      // Mock console.group to throw an error
      mockConsoleGroup.mockImplementation(() => {
        throw new Error('Console group failed');
      });

      const error = new Error('Test error');

      logApiError(error);

      expect(mockConsoleError).toHaveBeenCalledWith('API Error (enhanced logging failed):', error);
      expect(mockConsoleError).toHaveBeenCalledWith('Logging error:', expect.any(Error));
    });
  });

  describe('logApiErrorWithStore', () => {
    it('should extract dashboard and chart names from store', () => {
      const mockStore = {
        getState: jest.fn(() => ({
          dashboardInfo: {
            dashboard_title: 'Test Dashboard',
            id: 123,
          },
          sliceEntities: {
            slices: {
              456: {
                slice_name: 'Test Chart',
              },
            },
          },
        })),
      };

      const error = new Error('Test error');
      const payload = { dashboardId: 123, sliceId: 456 };

      logApiErrorWithStore(error, undefined, 'POST', payload, mockStore);

      expect(mockConsoleLog).toHaveBeenCalledWith('Dashboard Name:', 'Test Dashboard');
      expect(mockConsoleLog).toHaveBeenCalledWith('Chart/Slice Name:', 'Test Chart');
    });

    it('should handle store access errors gracefully', () => {
      const mockStore = {
        getState: jest.fn(() => {
          throw new Error('Store access failed');
        }),
      };

      const error = new Error('Test error');

      logApiErrorWithStore(error, undefined, 'POST', undefined, mockStore);

      // Should still log the error without crashing
      expect(mockConsoleGroup).toHaveBeenCalledWith('🚨 Superset API Error');
    });
  });
});
