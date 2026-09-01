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
import { t, validateNonEmpty } from '@superset-ui/core';
import {
  ControlPanelConfig,
  dndGroupByControl,
} from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'source',
            config: {
              ...dndGroupByControl,
              label: t('Source'),
              multi: false,
              description: t(
                'The column to be used as the source of the edge.',
              ),
              validators: [validateNonEmpty],
              freeForm: false,
            },
          },
        ],
        [
          {
            name: 'target',
            config: {
              ...dndGroupByControl,
              label: t('Target'),
              multi: false,
              description: t(
                'The column to be used as the target of the edge.',
              ),
              validators: [validateNonEmpty],
              freeForm: false,
            },
          },
        ],
        ['metric'],
        ['adhoc_filters'],
        ['row_limit'],
        ['sort_by_metric'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'info_icon_url',
            config: {
              type: 'TextControl',
              label: t('Info icon URL'),
              renderTrigger: true,
              description: t('URL for the info icon that shows chart description on hover'),
              placeholder: 'https://example.com/info-icon.svg',
            },
          },
        ],
        [
          {
            name: 'info_icon_width',
            config: {
              type: 'TextControl',
              label: t('Info icon width'),
              renderTrigger: true,
              description: t('Width of the info icon in px'),
              placeholder: '14',
              visibility: ({ controls }) => {
                const urlValue = controls?.info_icon_url?.value;
                return !!(urlValue && (typeof urlValue === 'string' ? urlValue.trim() : urlValue));
              },
            },
          },
          {
            name: 'info_icon_height',
            config: {
              type: 'TextControl',
              label: t('Info icon height'),
              renderTrigger: true,
              description: t('Height of the info icon in px'),
              placeholder: '14',
              visibility: ({ controls }) => {
                const urlValue = controls?.info_icon_url?.value;
                return !!(urlValue && (typeof urlValue === 'string' ? urlValue.trim() : urlValue));
              },
            },
          },
        ],
        ['color_scheme'],
    },
  ],
};

export default config;
