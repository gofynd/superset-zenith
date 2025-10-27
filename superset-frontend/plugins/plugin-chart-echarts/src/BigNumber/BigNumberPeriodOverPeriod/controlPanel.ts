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
import {
  ControlPanelConfig,
  getStandardizedControls,
  sharedControls,
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
import { ColorSchemeEnum } from './types';

const config: ControlPanelConfig = {
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
      controlSetRows: [
        ['metric'],
        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            config: sharedControls.row_limit,
          },
        ],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        ['y_axis_format'],
        [
          {
            name: 'percentDifferenceFormat',
            config: {
              ...sharedControls.y_axis_format,
              label: t('Percent Difference format'),
            },
          },
        ],
        ['currency_format'],
        [
          {
            name: 'enable_clickable_card',
            config: {
              type: 'CheckboxControl',
              label: t('Enable clickable card'),
              renderTrigger: true,
              default: false,
              description: t('Make the entire card clickable to redirect to a URL'),
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
        [
          {
            ...headerFontSize,
            config: { ...headerFontSize.config, default: 0.2 },
          },
        ],
        [
          {
            ...subheaderFontSize,
            config: {
              ...subheaderFontSize.config,
              default: 0.125,
              label: t('Comparison font size'),
            },
          },
        ],
        [showIcon],
        [iconType],
        [iconUrl],
        [iconUpload],
        [iconSize],
        [iconBackgroundColor],
        [enableDetailOnHover],
        [
          {
            name: 'comparison_color_enabled',
            config: {
              type: 'CheckboxControl',
              label: t('Add color for positive/negative change'),
              renderTrigger: true,
              default: false,
              description: t('Add color for positive/negative change'),
            },
          },
        ],
        [
          {
            name: 'comparison_color_scheme',
            config: {
              type: 'SelectControl',
              label: t('color scheme for comparison'),
              default: ColorSchemeEnum.Green,
              renderTrigger: true,
              choices: [
                [ColorSchemeEnum.Green, 'Green for increase, red for decrease'],
                [ColorSchemeEnum.Red, 'Red for increase, green for decrease'],
              ],
              visibility: ({ controls }) =>
                controls?.comparison_color_enabled?.value === true,
              description: t(
                'Adds color to the chart symbols based on the positive or ' +
                  'negative change from the comparison value.',
              ),
            },
          },
        ],
      ],
    },
    sections.timeComparisonControls({
      multi: false,
      showCalculationType: false,
      showFullChoices: false,
    }),
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
};

export default config;
