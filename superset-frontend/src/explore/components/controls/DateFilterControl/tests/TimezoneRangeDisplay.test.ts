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
import { formatDateTimeForDisplay } from '../DateFilterLabel';

test('formats UTC API ranges in the selected timezone', () => {
  expect(
    formatDateTimeForDisplay(
      '2026-05-17T16:00:00 to 2026-05-18T15:59:59',
      'Asia/Kuala_Lumpur',
      false,
      'utc',
    ),
  ).toBe('May 18, 2026, 12:00 AM to May 18, 2026, 11:59 PM');
});

test('formats timezone-resolved ranges without applying a second UTC shift', () => {
  expect(
    formatDateTimeForDisplay(
      '2026-05-18T00:00:00 to 2026-05-18T23:59:59',
      'Asia/Kuala_Lumpur',
      false,
      'target',
    ),
  ).toBe('May 18, 2026, 12:00 AM to May 18, 2026, 11:59 PM');
});

test('preserves timezone offsets generated for display ranges', () => {
  expect(
    formatDateTimeForDisplay(
      '2026-05-18T00:00:00+0800 to 2026-05-18T23:59:59+0800',
      'Asia/Kuala_Lumpur',
    ),
  ).toBe('May 18, 2026, 12:00 AM to May 18, 2026, 11:59 PM');
});
