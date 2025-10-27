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

// These are control configurations that are shared ONLY within the BigNumberWithTrendline viz plugin repo.
import { t } from '@superset-ui/core';
import { CustomControlItem } from '@superset-ui/chart-controls';

export const headerFontSize: CustomControlItem = {
  name: 'header_font_size',
  config: {
    type: 'SelectControl',
    label: t('Big Number Font Size'),
    renderTrigger: true,
    clearable: false,
    default: 0.4,
    // Values represent the percentage of space a header should take
    options: [
      {
        label: t('Tiny'),
        value: 0.2,
      },
      {
        label: t('Small'),
        value: 0.3,
      },
      {
        label: t('Normal'),
        value: 0.4,
      },
      {
        label: t('Large'),
        value: 0.5,
      },
      {
        label: t('Huge'),
        value: 0.6,
      },
    ],
  },
};

export const subheaderFontSize: CustomControlItem = {
  name: 'subheader_font_size',
  config: {
    type: 'SelectControl',
    label: t('Subheader Font Size'),
    renderTrigger: true,
    clearable: false,
    default: 0.15,
    // Values represent the percentage of space a subheader should take
    options: [
      {
        label: t('Tiny'),
        value: 0.125,
      },
      {
        label: t('Small'),
        value: 0.15,
      },
      {
        label: t('Normal'),
        value: 0.2,
      },
      {
        label: t('Large'),
        value: 0.3,
      },
      {
        label: t('Huge'),
        value: 0.4,
      },
    ],
  },
};

export const enableDetailOnHover: CustomControlItem = {
  name: 'enable_detail_on_hover',
  config: {
    type: 'CheckboxControl',
    label: t('Enable detail on hover'),
    renderTrigger: true,
    default: true,
    description: t(
      'Show exact number in tooltip when hovering over rounded values',
    ),
  },
};

export const showIcon: CustomControlItem = {
  name: 'show_icon',
  config: {
    type: 'CheckboxControl',
    label: t('Show Icon'),
    renderTrigger: true,
    default: false,
    description: t('Display an icon on the right side of the scorecard'),
  },
};

export const iconType: CustomControlItem = {
  name: 'icon_type',
  config: {
    type: 'SelectControl',
    label: t('Icon Source'),
    renderTrigger: true,
    default: 'url',
    choices: [
      ['url', t('URL')],
      ['upload', t('Upload')],
    ],
    visibility: ({ controls }) => controls?.show_icon?.value === true,
    description: t('Choose how to provide the icon'),
  },
};

export const iconUrl: CustomControlItem = {
  name: 'icon_url',
  config: {
    type: 'TextControl',
    label: t('Icon URL'),
    renderTrigger: true,
    default: '',
    visibility: ({ controls }) => 
      controls?.show_icon?.value === true && controls?.icon_type?.value === 'url',
    description: t('Enter the URL of the icon image'),
    validators: [
      (value: string) => {
        if (!value || value.trim() === '') return undefined;
        
        // Basic URL validation
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return t('Please enter a valid HTTP or HTTPS URL.');
          }
        } catch {
          return t('Please enter a valid URL.');
        }
        
        // Check if URL ends with common image extensions
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
        const hasImageExtension = imageExtensions.some(ext => 
          value.toLowerCase().includes(ext)
        );
        
        if (!hasImageExtension) {
          return t('URL should point to an image file (PNG, JPG, SVG, GIF, WebP).');
        }
        
        return undefined;
      }
    ],
  },
};

export const iconUpload: CustomControlItem = {
  name: 'icon_upload',
  config: {
    type: 'FileControl',
    label: t('Upload Icon'),
    renderTrigger: true,
    default: null,
    visibility: ({ controls }) => 
      controls?.show_icon?.value === true && controls?.icon_type?.value === 'upload',
    description: t('Upload an icon image file (PNG, JPG, SVG, GIF). Max size: 2MB'),
    accept: '.png,.jpg,.jpeg,.svg,.gif',
    validators: [
      (value: File | null) => {
        if (!value) return undefined;
        
        // File type validation
        const allowedTypes = [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/svg+xml',
          'image/gif'
        ];
        
        if (!allowedTypes.includes(value.type)) {
          return t('Invalid file type. Please upload a PNG, JPG, SVG, or GIF image.');
        }
        
        // File size validation (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (value.size > maxSize) {
          return t('File size too large. Please upload an image smaller than 2MB.');
        }
        
        // Additional validation for minimum size (prevent tiny images)
        const minSize = 1024; // 1KB minimum
        if (value.size < minSize) {
          return t('File size too small. Please upload a valid image file.');
        }
        
        return undefined;
      }
    ],
  },
};

export const iconSize: CustomControlItem = {
  name: 'icon_size',
  config: {
    type: 'SelectControl',
    label: t('Icon Size'),
    renderTrigger: true,
    default: 'medium',
    choices: [
      ['small', t('Small')],
      ['medium', t('Medium')],
      ['large', t('Large')],
      ['xlarge', t('Extra Large')],
    ],
    visibility: ({ controls }) => controls?.show_icon?.value === true,
    description: t('Choose the size of the icon'),
  },
};

export const iconBackgroundColor: CustomControlItem = {
  name: 'icon_background_color',
  config: {
    type: 'ColorPickerControl',
    label: t('Icon Background Color'),
    renderTrigger: true,
    default: '#e8eaf6',
    visibility: ({ controls }) => controls?.show_icon?.value === true,
    description: t('Choose the background color for the icon container'),
  },
};
