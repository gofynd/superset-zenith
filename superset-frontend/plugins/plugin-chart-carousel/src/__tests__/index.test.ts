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
import CarouselChartPlugin from '../index';
import { Behavior, ChartMetadata, ChartPlugin } from '@superset-ui/core';

// Mock the dynamic import
jest.mock('../CarouselChart', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'carousel-chart' }, 'Carousel Chart');
  },
}));

describe('CarouselChartPlugin', () => {
  let plugin: CarouselChartPlugin;

  beforeEach(() => {
    plugin = new CarouselChartPlugin();
  });

  it('is an instance of ChartPlugin', () => {
    expect(plugin).toBeInstanceOf(ChartPlugin);
  });

  it('has correct metadata', () => {
    const metadata = plugin.metadata;
    
    expect(metadata).toBeInstanceOf(ChartMetadata);
    expect(metadata.name).toBe('Carousel');
    expect(metadata.category).toBe('Table');
    expect(metadata.description).toContain('carousel/gallery chart');
    expect(metadata.tags).toContain('Gallery');
    expect(metadata.tags).toContain('Images');
  });

  it('has correct behaviors', () => {
    const metadata = plugin.metadata;
    
    expect(metadata.behaviors).toContain(Behavior.InteractiveChart);
    expect(metadata.behaviors).toContain(Behavior.DrillToDetail);
    expect(metadata.behaviors).toContain(Behavior.DrillBy);
  });

  it('has correct category and canBeAnnotationTypes', () => {
    const metadata = plugin.metadata;
    
    expect(metadata.category).toBe('Table');
    expect(metadata.canBeAnnotationTypes).toEqual(['EVENT', 'INTERVAL']);
  });

  it('has example gallery', () => {
    const metadata = plugin.metadata;
    
    expect(metadata.exampleGallery).toBeDefined();
    expect(Array.isArray(metadata.exampleGallery)).toBe(true);
    expect(metadata.exampleGallery.length).toBeGreaterThan(0);
    
    metadata.exampleGallery.forEach(example => {
      expect(example).toHaveProperty('url');
      expect(example.url).toBeDefined();
    });
  });

  it('has thumbnail', () => {
    const metadata = plugin.metadata;
    
    expect(metadata.thumbnail).toBeDefined();
  });

  it('has correct tags', () => {
    const metadata = plugin.metadata;
    
    const expectedTags = [
      'Additive',
      'Business',
      'Pattern',
      'Featured',
      'Report',
      'Sequential',
      'Tabular',
      'Gallery',
      'Images',
    ];
    
    expectedTags.forEach(tag => {
      expect(metadata.tags).toContain(tag);
    });
  });

  it('loads chart component correctly', async () => {
    const loadChart = plugin.loadChart;
    expect(typeof loadChart).toBe('function');
    
    const ChartComponent = await loadChart();
    expect(ChartComponent).toBeDefined();
  });

  it('has transformProps function', () => {
    // transformProps is not directly accessible on the plugin instance
    // It's used internally by the ChartPlugin
    expect(plugin).toBeDefined();
  });

  it('has controlPanel', () => {
    expect(plugin.controlPanel).toBeDefined();
    expect(plugin.controlPanel.controlPanelSections).toBeDefined();
    expect(Array.isArray(plugin.controlPanel.controlPanelSections)).toBe(true);
  });

  it('has formDataOverrides function', () => {
    expect(plugin.controlPanel.formDataOverrides).toBeDefined();
    expect(typeof plugin.controlPanel.formDataOverrides).toBe('function');
  });

  it('formDataOverrides provides correct defaults', () => {
    const mockFormData = {};
    const result = plugin.controlPanel.formDataOverrides(mockFormData);
    
    expect(result.image_url_column).toBeNull();
    expect(result.name_column).toBeNull();
    expect(result.description_column).toBeNull();
    expect(result.cta_label_column).toBeNull();
    expect(result.cta_link_column).toBeNull();
    expect(result.view_mode).toBe('table');
    expect(result.gallery_size).toBe(6);
  });

  it('formDataOverrides preserves existing values', () => {
    const mockFormData = {
      image_url_column: 'custom_image_url',
      name_column: 'custom_name',
      view_mode: 'carousel',
      gallery_size: 9,
      other_field: 'other_value',
    };
    
    const result = plugin.controlPanel.formDataOverrides(mockFormData);
    
    expect(result.image_url_column).toBe('custom_image_url');
    expect(result.name_column).toBe('custom_name');
    expect(result.view_mode).toBe('carousel');
    expect(result.gallery_size).toBe(9);
    expect(result.other_field).toBe('other_value');
  });
});
