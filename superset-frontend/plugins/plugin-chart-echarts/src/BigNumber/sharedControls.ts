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

export const iconShape: CustomControlItem = {
  name: 'icon_shape',
  config: {
    type: 'SelectControl',
    label: t('Icon Shape'),
    renderTrigger: true,
    clearable: false,
    default: 'circle',
    options: [
      { label: t('Circle'), value: 'circle' },
      { label: t('Square'), value: 'square' },
      { label: t('Rounded Square'), value: 'rounded' },
    ],
    visibility: ({ controls }) => controls?.show_icon?.value === true,
    description: t('Choose the shape of the icon background container'),
  },
};

export const iconPosition: CustomControlItem = {
  name: 'icon_position',
  config: {
    type: 'SelectControl',
    label: t('Icon position'),
    renderTrigger: true,
    clearable: false,
    default: 'top-left',
    choices: [
      ['top-left', t('Top Left')],
      ['middle-right', t('Middle Right')],
    ],
    visibility: ({ controls }) => controls?.show_icon?.value === true,
    description: t('Choose the position of the icon'),
  },
};

// Uptrend icon controls
export const uptrendIconType: CustomControlItem = {
  name: 'uptrend_icon_type',
  config: {
    type: 'SelectControl',
    label: t('Uptrend Icon Type'),
    renderTrigger: true,
    clearable: false,
    default: 'url',
    options: [
      { value: 'url', label: t('URL') },
      { value: 'upload', label: t('Upload'), disabled: true },
    ],
    description: t('Choose how to provide the uptrend icon'),
  },
};

export const uptrendIconUrl: CustomControlItem = {
  name: 'uptrend_icon_url',
  config: {
    type: 'TextControl',
    label: t('Uptrend Icon URL'),
    renderTrigger: true,
    default: '',
    visibility: ({ controls }) => controls?.uptrend_icon_type?.value === 'url',
    description: t('Enter the URL for the uptrend icon image'),
  },
};

export const uptrendIconUpload: CustomControlItem = {
  name: 'uptrend_icon_upload',
  config: {
    type: 'FileControl',
    label: t('Upload Uptrend Icon'),
    renderTrigger: true,
    accept: 'image/*',
    visibility: ({ controls }) => controls?.uptrend_icon_type?.value === 'upload',
    description: t('Upload an image file for the uptrend icon'),
    validators: [
      (value: File | null) => {
        if (!value) return undefined;
        
        // File type validation
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
        if (!allowedTypes.includes(value.type)) {
          return t('Invalid file type. Please upload a PNG, JPEG, SVG, or GIF image.');
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

export const uptrendIconBackgroundColor: CustomControlItem = {
  name: 'uptrend_icon_background_color',
  config: {
    type: 'ColorPickerControl',
    label: t('Uptrend Icon Background Color'),
    renderTrigger: true,
    default: { r: 0, g: 0, b: 0, a: 0 }, // Transparent (black transparent)
    description: t('Choose the background color for the uptrend trend component'),
  },
};

export const uptrendIconTextColor: CustomControlItem = {
  name: 'uptrend_icon_text_color',
  config: {
    type: 'ColorPickerControl',
    label: t('Uptrend Icon Text Color'),
    renderTrigger: true,
    default: '#28a745', // Green (default for positive)
    description: t('Choose the text color for the uptrend trend component'),
  },
};

export const uptrendIconShape: CustomControlItem = {
  name: 'uptrend_icon_shape',
  config: {
    type: 'SelectControl',
    label: t('Uptrend Icon Shape'),
    renderTrigger: true,
    clearable: false,
    default: 'circle',
    options: [
      { label: t('Circle'), value: 'circle' },
      { label: t('Square'), value: 'square' },
      { label: t('Rounded Square'), value: 'rounded' },
    ],
    description: t('Choose the shape of the uptrend icon background container'),
  },
};

// Downtrend icon controls
export const downtrendIconType: CustomControlItem = {
  name: 'downtrend_icon_type',
  config: {
    type: 'SelectControl',
    label: t('Downtrend Icon Type'),
    renderTrigger: true,
    clearable: false,
    default: 'url',
    options: [
      { value: 'url', label: t('URL') },
      { value: 'upload', label: t('Upload'), disabled: true },
    ],
    description: t('Choose how to provide the downtrend icon'),
  },
};

export const downtrendIconUrl: CustomControlItem = {
  name: 'downtrend_icon_url',
  config: {
    type: 'TextControl',
    label: t('Downtrend Icon URL'),
    renderTrigger: true,
    default: '',
    visibility: ({ controls }) => controls?.downtrend_icon_type?.value === 'url',
    description: t('Enter the URL for the downtrend icon image'),
  },
};

export const downtrendIconUpload: CustomControlItem = {
  name: 'downtrend_icon_upload',
  config: {
    type: 'FileControl',
    label: t('Upload Downtrend Icon'),
    renderTrigger: true,
    accept: 'image/*',
    visibility: ({ controls }) => controls?.downtrend_icon_type?.value === 'upload',
    description: t('Upload an image file for the downtrend icon'),
    validators: [
      (value: File | null) => {
        if (!value) return undefined;
        
        // File type validation
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
        if (!allowedTypes.includes(value.type)) {
          return t('Invalid file type. Please upload a PNG, JPEG, SVG, or GIF image.');
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

export const downtrendIconBackgroundColor: CustomControlItem = {
  name: 'downtrend_icon_background_color',
  config: {
    type: 'ColorPickerControl',
    label: t('Downtrend Icon Background Color'),
    renderTrigger: true,
    default: { r: 0, g: 0, b: 0, a: 0 }, // Transparent (black transparent)
    description: t('Choose the background color for the downtrend trend component'),
  },
};

export const downtrendIconTextColor: CustomControlItem = {
  name: 'downtrend_icon_text_color',
  config: {
    type: 'ColorPickerControl',
    label: t('Downtrend Icon Text Color'),
    renderTrigger: true,
    default: '#dc3545', // Red (default for negative)
    description: t('Choose the text color for the downtrend trend component'),
  },
};

export const downtrendIconShape: CustomControlItem = {
  name: 'downtrend_icon_shape',
  config: {
    type: 'SelectControl',
    label: t('Downtrend Icon Shape'),
    renderTrigger: true,
    clearable: false,
    default: 'circle',
    options: [
      { label: t('Circle'), value: 'circle' },
      { label: t('Square'), value: 'square' },
      { label: t('Rounded Square'), value: 'rounded' },
    ],
    description: t('Choose the shape of the downtrend icon background container'),
  },
};

// Neutral trend controls
export const showNeutralTrendChip: CustomControlItem = {
  name: 'show_neutral_trend_chip',
  config: {
    type: 'CheckboxControl',
    label: t('Show Neutral Trend Chip'),
    renderTrigger: true,
    default: true,
    description: t('Toggle visibility of the neutral trend comparison chip'),
  },
};

export const neutralIconType: CustomControlItem = {
  name: 'neutral_icon_type',
  config: {
    type: 'SelectControl',
    label: t('Neutral Icon Type'),
    renderTrigger: true,
    clearable: false,
    default: 'url',
    options: [
      { value: 'url', label: t('URL') },
      { value: 'upload', label: t('Upload'), disabled: true },
      { value: 'never', label: t('None') },
    ],
    description: t('Choose how to provide the neutral icon'),
  },
};

export const neutralIconUrl: CustomControlItem = {
  name: 'neutral_icon_url',
  config: {
    type: 'TextControl',
    label: t('Neutral Icon URL'),
    renderTrigger: true,
    default: '',
    visibility: ({ controls }) => controls?.neutral_icon_type?.value === 'url',
    description: t('Enter the URL for the neutral icon image'),
  },
};

export const neutralIconUpload: CustomControlItem = {
  name: 'neutral_icon_upload',
  config: {
    type: 'FileControl',
    label: t('Upload Neutral Icon'),
    renderTrigger: true,
    accept: 'image/*',
    visibility: ({ controls }) => controls?.neutral_icon_type?.value === 'upload',
    description: t('Upload an image file for the neutral icon'),
    validators: [
      (value: File | null) => {
        if (!value) return undefined;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
        if (!allowedTypes.includes(value.type)) {
          return t('Invalid file type. Please upload a PNG, JPEG, SVG, or GIF image.');
        }

        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (value.size > maxSize) {
          return t('File size too large. Please upload an image smaller than 2MB.');
        }

        const minSize = 1024; // 1KB minimum
        if (value.size < minSize) {
          return t('File size too small. Please upload a valid image file.');
        }

        return undefined;
      },
    ],
  },
};

export const neutralIconBackgroundColor: CustomControlItem = {
  name: 'neutral_icon_background_color',
  config: {
    type: 'ColorPickerControl',
    label: t('Neutral Icon Background Color'),
    renderTrigger: true,
    default: '#FEF0E7',
    description: t('Choose the background color for the neutral trend component'),
  },
};

export const neutralIconTextColor: CustomControlItem = {
  name: 'neutral_icon_text_color',
  config: {
    type: 'ColorPickerControl',
    label: t('Neutral Icon Text Color'),
    renderTrigger: true,
    default: '#F06D0F',
    description: t('Choose the text color for the neutral trend component'),
  },
};

export const neutralIconShape: CustomControlItem = {
  name: 'neutral_icon_shape',
  config: {
    type: 'SelectControl',
    label: t('Neutral Icon Shape'),
    renderTrigger: true,
    clearable: false,
    default: 'circle',
    options: [
      { label: t('Circle'), value: 'circle' },
      { label: t('Square'), value: 'square' },
      { label: t('Rounded Square'), value: 'rounded' },
    ],
    description: t('Choose the shape of the neutral icon background container'),
  },
};

export const trendComparisonPosition: CustomControlItem = {
  name: 'trend_comparison_position',
  config: {
    type: 'SelectControl',
    label: t('Trend comparison position'),
    renderTrigger: true,
    clearable: false,
    default: 'top',
    choices: [
      ['top', t('Top')],
      ['middle', t('Middle')],
    ],
    description: t('Choose where to display the trend comparison indicator'),
  },
};

export const trendComparisonShape: CustomControlItem = {
  name: 'trend_comparison_shape',
  config: {
    type: 'SelectControl',
    label: t('Trend comparison shape'),
    renderTrigger: true,
    clearable: false,
    default: 'pill',
    choices: [
      ['pill', t('Pill')],
      ['square', t('Square')],
    ],
    description: t('Choose the shape of the trend comparison indicator'),
  },
};

export const trendComparisonSize: CustomControlItem = {
  name: 'trend_comparison_size',
  config: {
    type: 'SelectControl',
    label: t('Trend comparison size'),
    renderTrigger: true,
    clearable: false,
    default: 'large',
    choices: [
      ['large', t('Large')],
      ['small', t('Small')],
    ],
    description: t('Choose the size of the trend comparison indicator'),
  },
};
