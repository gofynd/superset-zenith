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
import {
  ControlConfig,
  ControlPanelConfig,
  ControlPanelsContainerProps,
  ControlStateMapping,
  sharedControls,
  ColumnOption,
} from '@superset-ui/chart-controls';
import { t } from '@superset-ui/core';
import { isEmpty } from 'lodash';
// import tableControlPanel from '../plugin-chart-table/src/controlPanel';

const config: ControlPanelConfig = {
  controlPanelSections: [
    // Carousel-specific controls section
    {
      label: t('Carousel Settings'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'view_mode',
            config: {
              type: 'RadioButtonControl',
              label: t('View Mode'),
              description: t('Choose between table view and carousel view'),
              default: 'table',
              options: [
                ['table', t('Table View')],
                ['carousel', t('Carousel View')],
              ],
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'gallery_size',
            config: {
              type: 'SelectControl',
              label: t('Gallery Size'),
              description: t('Number of images to display in gallery view'),
              default: 6,
              choices: [
                [3, '3'],
                [6, '6'],
                [9, '9'],
                [12, '12'],
              ],
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.view_mode?.value === 'carousel',
            },
          },
        ],
      ],
    },
    // Column mapping section
    {
      label: t('Column Mapping'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'image_url_column',
            config: {
              type: 'SelectControl',
              label: t('Image URL Column'),
              description: t('Column containing image URLs'),
              default: null,
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.columns || [],
              }),
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.view_mode?.value === 'carousel',
            },
          },
        ],
        [
          {
            name: 'name_column',
            config: {
              type: 'SelectControl',
              label: t('Name Column'),
              description: t('Column containing image names/titles'),
              default: null,
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.columns || [],
              }),
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.view_mode?.value === 'carousel',
            },
          },
        ],
        [
          {
            name: 'description_column',
            config: {
              type: 'SelectControl',
              label: t('Description Column'),
              description: t('Column containing image descriptions (optional)'),
              default: null,
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.columns || [],
              }),
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.view_mode?.value === 'carousel',
            },
          },
        ],
        [
          {
            name: 'cta_label_column',
            config: {
              type: 'SelectControl',
              label: t('CTA Label Column'),
              description: t('Column containing CTA button labels (optional)'),
              default: null,
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.columns || [],
              }),
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.view_mode?.value === 'carousel',
            },
          },
        ],
        [
          {
            name: 'cta_link_column',
            config: {
              type: 'SelectControl',
              label: t('CTA Link Column'),
              description: t('Column containing CTA button links (optional)'),
              default: null,
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.columns || [],
              }),
              renderTrigger: true,
              visibility: ({ controls }: ControlPanelsContainerProps) =>
                controls?.view_mode?.value === 'carousel',
            },
          },
        ],
      ],
    },
    // Basic query controls for carousel
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'groupby',
            config: {
              ...sharedControls.groupby,
              label: t('Columns'),
              description: t('Columns to display'),
              multi: true,
              freeForm: true,
              allowAll: true,
              commaChoosesOption: false,
              optionRenderer: c => <ColumnOption showType column={c} />,
              valueRenderer: c => <ColumnOption column={c} />,
              valueKey: 'column_name',
              mapStateToProps: ({ datasource }) => ({
                options: datasource?.columns || [],
              }),
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            config: {
              ...sharedControls.row_limit,
              default: 1000,
            },
          },
        ],
      ],
    },
  ],
  formDataOverrides: formData => ({
    ...formData,
    // Ensure required columns are set
    image_url_column: formData.image_url_column || null,
    name_column: formData.name_column || null,
    description_column: formData.description_column || null,
    cta_label_column: formData.cta_label_column || null,
    cta_link_column: formData.cta_link_column || null,
    view_mode: formData.view_mode || 'table',
    gallery_size: formData.gallery_size || 6,
  }),
};

export default config;
