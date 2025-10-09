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

import { css, styled } from '@superset-ui/core';

export default styled.div`
  ${({ theme }) => css`
    table {
      width: 100%;
      min-width: auto;
      max-width: none;
      margin: 0;
    }

    th,
    td {
      min-width: 4.3em;
    }

    thead > tr > th {
      padding-right: 0;
      position: relative;
      background: ${theme.colors.grayscale.light5};
      text-align: left;
    }
    th svg {
      color: ${theme.colors.grayscale.light2};
      margin: ${theme.gridUnit / 2}px;
    }
    th.is-sorted svg {
      color: ${theme.colors.grayscale.base};
    }
    .table > tbody > tr:first-of-type > td,
    .table > tbody > tr:first-of-type > th {
      border-top: 0;
    }

    .table > tbody tr td {
      font-feature-settings: 'tnum' 1;
    }

    .dt-controls {
      padding-bottom: 0.65em;
    }
    .dt-metric {
      text-align: right;
    }
    .dt-totals {
      font-weight: ${theme.typography.weights.bold};
    }
    .dt-is-null {
      color: ${theme.colors.grayscale.light1};
    }
    td.dt-is-filter {
      cursor: pointer;
    }
    td.dt-is-filter:hover {
      background-color: ${theme.colors.secondary.light4};
    }
    td.dt-is-active-filter,
    td.dt-is-active-filter:hover {
      background-color: ${theme.colors.secondary.light3};
    }

    .dt-global-filter {
      float: right;
    }

    .dt-truncate-cell {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dt-truncate-cell:hover {
      overflow: visible;
      white-space: normal;
      height: auto;
    }

    .dt-pagination {
      text-align: right;
      /* use padding instead of margin so clientHeight can capture it */
      padding-top: 0.5em;
    }
    .dt-pagination .pagination {
      margin: 0;
    }

    .pagination > li > span.dt-pagination-ellipsis:focus,
    .pagination > li > span.dt-pagination-ellipsis:hover {
      background: ${theme.colors.grayscale.light5};
    }

    .dt-no-results {
      text-align: center;
      padding: 1em 0.6em;
    }

    .right-border-only {
      border-right: 2px solid ${theme.colors.grayscale.light2};
    }
    table .right-border-only:last-child {
      border-right: none;
    }

    /* Hyperlink styling - only apply defaults when no custom styles are provided */
    .dt-hyperlink {
      cursor: pointer;
    }

    /* Default hyperlink styles - only applied when no inline styles override them */
    .dt-hyperlink:not([style*="color"]) {
      color: ${theme.colors.primary.base};
    }

    .dt-hyperlink:not([style*="text-decoration"]) {
      text-decoration: underline;
    }

    .dt-hyperlink:hover:not([style*="color"]) {
      color: ${theme.colors.primary.dark1};
    }

    .dt-hyperlink:hover:not([style*="text-decoration"]) {
      text-decoration: underline;
    }

    .dt-hyperlink:visited:not([style*="color"]) {
      color: ${theme.colors.primary.light1};
    }

    /* Action Button styling */
    .dt-action-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 12px;
      border: 1px solid transparent;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .dt-action-button:focus {
      outline: 2px solid ${theme.colors.primary.base};
      outline-offset: 2px;
    }

    .dt-action-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Button sizes */
    .dt-action-button.small {
      padding: 4px 8px;
      font-size: 12px;
    }

    .dt-action-button.medium {
      padding: 6px 12px;
      font-size: 14px;
    }

    .dt-action-button.large {
      padding: 8px 16px;
      font-size: 16px;
    }

    /* Button colors */
    .dt-action-button.primary {
      background-color: ${theme.colors.primary.base};
      color: white;
      border-color: ${theme.colors.primary.base};
    }

    .dt-action-button.primary:hover:not(:disabled) {
      background-color: ${theme.colors.primary.dark1};
      border-color: ${theme.colors.primary.dark1};
    }

    .dt-action-button.secondary {
      background-color: ${theme.colors.grayscale.light5};
      color: ${theme.colors.grayscale.dark1};
      border-color: ${theme.colors.grayscale.light2};
    }

    .dt-action-button.secondary:hover:not(:disabled) {
      background-color: ${theme.colors.grayscale.light4};
      border-color: ${theme.colors.grayscale.light1};
    }

    .dt-action-button.success {
      background-color: ${theme.colors.success?.base || '#52c41a'};
      color: white;
      border-color: ${theme.colors.success?.base || '#52c41a'};
    }

    .dt-action-button.success:hover:not(:disabled) {
      background-color: ${theme.colors.success?.dark1 || '#389e0d'};
      border-color: ${theme.colors.success?.dark1 || '#389e0d'};
    }

    .dt-action-button.warning {
      background-color: ${theme.colors.warning?.base || '#faad14'};
      color: white;
      border-color: ${theme.colors.warning?.base || '#faad14'};
    }

    .dt-action-button.warning:hover:not(:disabled) {
      background-color: ${theme.colors.warning?.dark1 || '#d48806'};
      border-color: ${theme.colors.warning?.dark1 || '#d48806'};
    }

    .dt-action-button.danger {
      background-color: ${theme.colors.error?.base || '#ff4d4f'};
      color: white;
      border-color: ${theme.colors.error?.base || '#ff4d4f'};
    }

    .dt-action-button.danger:hover:not(:disabled) {
      background-color: ${theme.colors.error?.dark1 || '#d9363e'};
      border-color: ${theme.colors.error?.dark1 || '#d9363e'};
    }

    /* Border radius variants */
    .dt-action-button.border-radius-none {
      border-radius: 0;
    }

    .dt-action-button.border-radius-small {
      border-radius: 2px;
    }

    .dt-action-button.border-radius-medium {
      border-radius: 4px;
    }

    .dt-action-button.border-radius-large {
      border-radius: 8px;
    }

    /* Font weight variants */
    .dt-action-button.font-weight-normal {
      font-weight: 400;
    }

    .dt-action-button.font-weight-bold {
      font-weight: 700;
    }

    .dt-action-button.font-weight-light {
      font-weight: 300;
    }

    /* Hover effects */
    .dt-action-button.hover-effect:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* Icon positioning */
    .dt-action-button .icon-left {
      margin-right: 4px;
    }

    .dt-action-button .icon-right {
      margin-left: 4px;
    }
  `}
`;
