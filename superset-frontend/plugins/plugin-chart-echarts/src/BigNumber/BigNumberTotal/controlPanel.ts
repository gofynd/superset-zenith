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
import { GenericDataType, SMART_DATE_ID, t } from '@superset-ui/core';
import {
  ControlPanelConfig,
  D3_FORMAT_DOCS,
  D3_TIME_FORMAT_OPTIONS,
  Dataset,
  getStandardizedControls,
  sections,
} from '@superset-ui/chart-controls';

import {
  headerFontSize,
  subheaderFontSize,
  enableDetailOnHover,
  showIcon,
  iconType,
  iconUrl,
  iconUpload,
  iconSize,
  iconBackgroundColor,
} from '../sharedControls';

export default {
  sectionOverrides: {
    datasourceAndVizType: {
      controlSetRows: [
        ['datasource'],
        ['viz_type'],
        ['enable_ai_insights'],
        ['show_fullscreen_menu', 'show_data_menu'],
        ['enable_export_csv', 'enable_export_excel'],
        ['enable_export_full_csv', 'enable_export_full_excel'],
        ['enable_download_image'],
        [
          {
            name: 'slice_id',
            config: {
              type: 'HiddenControl',
              label: t('Chart ID'),
              hidden: true,
              description: t('The id of the active chart'),
            },
          },
          {
            name: 'cache_timeout',
            config: {
              type: 'HiddenControl',
              label: t('Cache Timeout (seconds)'),
              hidden: true,
              description: t('The number of seconds before expiring the cache'),
            },
          },
          {
            name: 'url_params',
            config: {
              type: 'HiddenControl',
              label: t('URL parameters'),
              hidden: true,
              description: t(
                'Extra parameters for use in jinja templated queries',
              ),
            },
          },
        ],
      ],
    },
  },
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [['metric'], ['adhoc_filters']],
    },
    sections.timeComparisonControls({ multi: false }),
    {
      label: t('Display settings'),
      expanded: true,
      tabOverride: 'data',
      controlSetRows: [
        [
          {
            name: 'subheader',
            config: {
              type: 'TextControl',
              label: t('Subheader'),
              renderTrigger: true,
              description: t(
                'Description text that shows up below your Big Number',
              ),
            },
          },
        ],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        [headerFontSize],
        [subheaderFontSize],
        [enableDetailOnHover],
        [
          {
            name: 'enable_clickable_card',
            config: {
              type: 'CheckboxControl',
              label: t('Enable clickable card'),
              renderTrigger: true,
              default: false,
              description: t(
                'Make the entire card clickable to redirect to a URL',
              ),
            },
          },
        ],
        [
          {
            name: 'url_column',
            config: {
              type: 'SelectControl',
              label: t('URL Column'),
              renderTrigger: true,
              clearable: true,
              description: t('Select the column containing the redirect URL (or use Manual URL below)'),
              visibility: ({ controls }) =>
                controls?.enable_clickable_card?.value === true,
              shouldMapStateToProps() {
                return true;
              },
              mapStateToProps(explore, _, chart) {
                // Get columns from both query response and datasource
                const responseColumns = chart?.queriesResponse?.[0]?.colnames || [];
                const datasourceColumns = explore?.datasource?.columns?.map(
                  (col: any) => col.column_name
                ) || [];
                
                // Combine and deduplicate columns
                const allColumns = [
                  ...new Set([...responseColumns, ...datasourceColumns])
                ];
                
                const columnOptions = allColumns.map((colname: string) => [colname, colname]);
                return {
                  choices: columnOptions,
                };
              },
            },
          },
        ],
        [
          {
            name: 'clickable_card_url',
            config: {
              type: 'TextControl',
              label: t('Manual URL (Optional)'),
              renderTrigger: true,
              description: t('Manually specify the redirect URL. This overrides the URL Column if set. Example: https://dashboard.com/details'),
              visibility: ({ controls }) =>
                controls?.enable_clickable_card?.value === true,
              placeholder: 'https://your-dashboard.com/page',
            },
          },
        ],
        [
          {
            name: 'hover_border_enabled',
            config: {
              type: 'CheckboxControl',
              label: t('Show border on hover'),
              renderTrigger: true,
              default: false,
              description: t('Show a colored border when hovering over clickable card'),
              visibility: ({ controls }) =>
                controls?.enable_clickable_card?.value === true,
            },
          },
        ],
        [
          {
            name: 'hover_border_thickness',
            config: {
              type: 'TextControl',
              label: t('Border thickness (px)'),
              renderTrigger: true,
              default: '2',
              description: t('Border thickness in pixels'),
              visibility: ({ controls }) =>
                controls?.enable_clickable_card?.value === true &&
                controls?.hover_border_enabled?.value === true,
            },
          },
        ],
        [
          {
            name: 'hover_border_color',
            config: {
              type: 'TextControl',
              label: t('Border color'),
              renderTrigger: true,
              default: '#1890ff',
              description: t('Border color (hex code, e.g. #1890ff)'),
              visibility: ({ controls }) =>
                controls?.enable_clickable_card?.value === true &&
                controls?.hover_border_enabled?.value === true,
              placeholder: '#1890ff',
            },
          },
        ],
        [showIcon],
        [iconType],
        [iconUrl],
        [iconUpload],
        [iconSize],
        [iconBackgroundColor],
        ['y_axis_format'],
        ['currency_format'],
        [
          {
            name: 'time_format',
            config: {
              type: 'SelectControl',
              freeForm: true,
              label: t('Date format'),
              renderTrigger: true,
              choices: D3_TIME_FORMAT_OPTIONS,
              description: D3_FORMAT_DOCS,
              default: SMART_DATE_ID,
            },
          },
        ],
        [
          {
            name: 'force_timestamp_formatting',
            config: {
              type: 'CheckboxControl',
              label: t('Force date format'),
              renderTrigger: true,
              default: false,
              description: t(
                'Use date formatting even when metric value is not a timestamp',
              ),
            },
          },
        ],
        [
          {
            name: 'conditional_formatting',
            config: {
              type: 'ConditionalFormattingControl',
              renderTrigger: true,
              label: t('Conditional Formatting'),
              description: t('Apply conditional color formatting to metric'),
              shouldMapStateToProps() {
                return true;
              },
              mapStateToProps(explore, _, chart) {
                const verboseMap = explore?.datasource?.hasOwnProperty(
                  'verbose_map',
                )
                  ? (explore?.datasource as Dataset)?.verbose_map
                  : explore?.datasource?.columns ?? {};
                const { colnames, coltypes } =
                  chart?.queriesResponse?.[0] ?? {};
                const numericColumns =
                  Array.isArray(colnames) && Array.isArray(coltypes)
                    ? colnames
                        .filter(
                          (colname: string, index: number) =>
                            coltypes[index] === GenericDataType.Numeric,
                        )
                        .map((colname: string) => ({
                          value: colname,
                          label:
                            (verboseMap as Record<string, string>)[colname] ??
                            colname,
                        }))
                    : [];
                return {
                  columnOptions: numericColumns,
                  verboseMap,
                };
              },
            },
          },
        ],
      ],
    },
  ],
  controlOverrides: {
    y_axis_format: {
      label: t('Number format'),
    },
  },
  formDataOverrides: formData => ({
    ...formData,
    metric: getStandardizedControls().shiftMetric(),
  }),
} as ControlPanelConfig;
