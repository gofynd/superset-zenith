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
import { css } from '@superset-ui/core';
import { Global } from '@emotion/react';
import { mix } from 'polished';
import 'react-js-cron/dist/styles.css';

export const GlobalStyles = () => (
  <Global
    styles={theme => css`
      :root {
        --novus-primary: ${theme.colors.primary.base};
        --novus-accent: ${theme.colors.success.base};
        --novus-secondary: ${theme.colors.secondary?.base || theme.colors.primary.dark1};
        --novus-info: ${theme.colors.info.base};
        --novus-lavender: ${theme.colors.primary.light2};
        --novus-sky: ${theme.colors.info.light1};
        --novus-text: ${theme.colors.text.label};
        --novus-bg: ${theme.colors.grayscale.light5};
        --novus-bg-alt: ${theme.colors.grayscale.light4};
        --novus-surface: ${theme.colors.grayscale.light3};
        --novus-border: ${theme.colors.grayscale.light2};
        --fds-neutrals-grey-40: ${theme.colors.grayscale.light2};
        --fds-text-subdued-1: ${theme.colors.text.help};
        --fds-navi-20: ${theme.colors.primary.light4};
        --fds-navi-50: ${theme.colors.primary.base};
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      strong,
      th {
        font-weight: ${theme.typography.weights.bold};
      }
      // CSS hack to resolve the issue caused by the invisible echart tooltip on
      // https://github.com/apache/superset/issues/30058
      .echarts-tooltip[style*='visibility: hidden'] {
        display: none !important;
      }
      // Ant Design is applying inline z-index styles causing troubles
      // TODO: Remove z-indexes when Ant Design is fully upgraded to v5
      // Prefer vanilla Ant Design z-indexes that should work out of the box
      .ant-popover,
      .antd5-dropdown,
      .ant-dropdown,
      .ant-select-dropdown,
      .antd5-modal-wrap,
      .antd5-modal-mask,
      .antd5-picker-dropdown {
        z-index: ${theme.zIndex.max} !important;
      }

      // TODO: Remove when buttons have been upgraded to Ant Design 5.
      // Check src/components/Modal for more info.
      .ant-modal-confirm {
        button {
          border: none;
          border-radius: ${theme.borderRadius}px;
          line-height: 1.5715;
          font-size: ${theme.typography.sizes.s}px;
          font-weight: ${theme.typography.weights.bold};
        }
        .ant-btn-primary:not(.btn-danger) {
          background: ${theme.colors.primary.base};
          color: ${theme.colors.grayscale.light5};
          &:hover {
            background: ${theme.colors.primary.dark1};
          }
        }
        .ant-btn-default:not(.btn-danger) {
          background: ${theme.colors.primary.light4};
          color: ${theme.colors.primary.dark1};
          &:hover {
            background: ${mix(
              0.1,
              theme.colors.primary.base,
              theme.colors.primary.light4,
            )};
          }
        }
      }
      .column-config-popover {
        & .antd5-input-number {
          width: 100%;
        }
        && .btn-group svg {
          line-height: 0;
          top: 0;
        }
        & .btn-group > .btn {
          padding: 5px 10px 6px;
        }
        && .ant-tabs {
          margin-top: ${theme.gridUnit * -3}px;
        }
        & .ant-tabs-nav {
          margin-left: ${theme.gridUnit * -4}px;
          margin-right: ${theme.gridUnit * -4}px;
          margin-bottom: ${theme.gridUnit * 2}px;
        }
        && .ant-tabs-tab {
          flex: 1;
          margin-right: 0;
        }
      }
      .ant-dropdown-menu-sub .antd5-menu.antd5-menu-vertical {
        box-shadow: none;
      }
      .ant-dropdown-menu-submenu-title,
      .ant-dropdown-menu-item {
        line-height: 1.5em !important;
      }

      // Custom styling for dropdown menus - minimal changes only
      .antd5-menu-submenu-popup,
      .antd5-menu-submenu.antd5-menu-submenu-popup {
        border-radius: 8px !important;
      }

      // Make About section smaller in dropdowns
      .about-section .css-5hj9bq {
        font-size: 12px !important;
        line-height: 1.3 !important;
        opacity: 0.8 !important;
      }

      // Custom styling for Thumbnails switch component (scoped to welcome page)
      .nav-right .switch,
      .superset-button .switch {
        display: flex !important;
        align-items: center !important;
        gap: ${theme.gridUnit * 2}px !important;
        
        .antd5-switch {
          background-color: ${theme.colors.grayscale.light2} !important;
          border: none !important;
          min-width: 40px !important;
          height: 20px !important;
          
          &.antd5-switch-checked {
            background-color: ${theme.colors.primary.base} !important;
          }
          
          .antd5-switch-handle {
            background-color: ${theme.colors.grayscale.light5} !important;
            width: 16px !important;
            height: 16px !important;
            top: 2px !important;
            left: 2px !important;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2) !important;
            
            &::before {
              border-radius: 50% !important;
            }
          }
          
          &.antd5-switch-checked .antd5-switch-handle {
            left: calc(100% - 18px) !important;
          }
          
          &:focus {
            box-shadow: 0 0 0 2px ${theme.colors.primary.light3} !important;
          }
          
          &:hover:not(.antd5-switch-disabled) {
            background-color: ${theme.colors.grayscale.light1} !important;
            
            &.antd5-switch-checked {
              background-color: ${theme.colors.primary.dark1} !important;
            }
          }
        }
        
        span {
          color: ${theme.colors.text.label} !important;
          font-size: 14px !important;
          font-weight: ${theme.typography.weights.normal} !important;
          margin: 0 !important;
          line-height: 1.4 !important;
        }
      }

      // Custom styling for card components border-radius
      .antd5-card,
      .antd5-card.antd5-card-bordered {
        border-radius: 8px !important;
        
        .antd5-card-cover {
          border-radius: 8px 8px 0 0 !important;
          
          > div:first-child {
            border-radius: 8px 8px 0 0 !important;
          }
        }
        
        .antd5-card-body {
          border-radius: 0 0 8px 8px !important;
        }
      }

      // Custom styling for error alerts to match design system
      .antd5-alert-error {
        // background-color: var(--novus-bg-alt) !important;
        // border: 1px solid var(--novus-border) !important;
        border-radius: ${theme.borderRadius}px !important
        background-color: rgb(255, 242, 236);
        border: 1px solid rgb(255, 160, 0);
        color: rgb(127, 63, 33);
        padding: 12px;
        border-radius: 8px;

        .antd5-alert-icon {
          // color: var(--novus-primary) !important;
          color: rgb(127, 63, 33) !important;

          svg {
            border: 1px solid rgb(255, 160, 0);
            color: 1px solid rgb(255, 160, 0);
            // background-color: var(--novus-primary);
            // color: var(--novus-bg) !important;
            border-radius: 50%;
            padding: 2px;
          }
        }

        .antd5-alert-message {
          color: var(--novus-text) !important;
          font-size: 14px !important;
          margin: 0 !important;

          strong {
            color: var(--novus-text) !important;
            font-weight: ${theme.typography.weights.bold} !important;
          }
        }

        .antd5-alert-description {
          color: var(--fds-text-subdued-1) !important;
          font-size: 14px !important;
        }

        .antd5-alert-close-icon {
          color: var(--fds-text-subdued-1) !important;

          &:hover {
            color: var(--novus-text) !important;
          }
        }
      }
    `}
  />
);
