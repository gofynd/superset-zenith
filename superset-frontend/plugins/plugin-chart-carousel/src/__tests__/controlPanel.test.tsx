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
import controlPanel from '../controlPanel';
import { ControlPanelConfig } from '@superset-ui/chart-controls';

describe('controlPanel', () => {
  it('has correct structure', () => {
    expect(controlPanel).toBeDefined();
    expect(controlPanel.controlPanelSections).toBeDefined();
    expect(Array.isArray(controlPanel.controlPanelSections)).toBe(true);
    expect(controlPanel.formDataOverrides).toBeDefined();
    expect(typeof controlPanel.formDataOverrides).toBe('function');
  });

  it('has carousel settings section', () => {
    const carouselSection = controlPanel.controlPanelSections.find(
      section => section.label === 'Carousel Settings'
    );
    
    expect(carouselSection).toBeDefined();
    expect(carouselSection?.expanded).toBe(true);
    expect(carouselSection?.controlSetRows).toBeDefined();
    expect(Array.isArray(carouselSection?.controlSetRows)).toBe(true);
  });

  it('has column mapping section', () => {
    const columnMappingSection = controlPanel.controlPanelSections.find(
      section => section.label === 'Column Mapping'
    );
    
    expect(columnMappingSection).toBeDefined();
    expect(columnMappingSection?.expanded).toBe(true);
    expect(columnMappingSection?.controlSetRows).toBeDefined();
    expect(Array.isArray(columnMappingSection?.controlSetRows)).toBe(true);
  });

  it('has query section', () => {
    const querySection = controlPanel.controlPanelSections.find(
      section => section.label === 'Query'
    );
    
    expect(querySection).toBeDefined();
    expect(querySection?.expanded).toBe(true);
    expect(querySection?.controlSetRows).toBeDefined();
    expect(Array.isArray(querySection?.controlSetRows)).toBe(true);
  });

  describe('View Mode Control', () => {
    it('has view mode control in carousel settings', () => {
      const carouselSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Carousel Settings'
      );
      
      const viewModeControl = carouselSection?.controlSetRows?.[0]?.[0];
      expect(viewModeControl).toBeDefined();
      expect(viewModeControl?.name).toBe('view_mode');
      expect(viewModeControl?.config?.type).toBe('RadioButtonControl');
      expect(viewModeControl?.config?.label).toBe('View Mode');
      expect(viewModeControl?.config?.default).toBe('table');
      expect(viewModeControl?.config?.options).toEqual([
        ['table', 'Table View'],
        ['carousel', 'Carousel View'],
      ]);
    });
  });

  describe('Gallery Size Control', () => {
    it('has gallery size control in carousel settings', () => {
      const carouselSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Carousel Settings'
      );
      
      const gallerySizeControl = carouselSection?.controlSetRows?.[1]?.[0];
      expect(gallerySizeControl).toBeDefined();
      expect(gallerySizeControl?.name).toBe('gallery_size');
      expect(gallerySizeControl?.config?.type).toBe('SelectControl');
      expect(gallerySizeControl?.config?.label).toBe('Gallery Size');
      expect(gallerySizeControl?.config?.default).toBe(6);
      expect(gallerySizeControl?.config?.choices).toEqual([
        [3, '3'],
        [6, '6'],
        [9, '9'],
        [12, '12'],
      ]);
    });

    it('has visibility function for gallery size control', () => {
      const carouselSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Carousel Settings'
      );
      
      const gallerySizeControl = carouselSection?.controlSetRows?.[1]?.[0];
      expect(gallerySizeControl?.config?.visibility).toBeDefined();
      expect(typeof gallerySizeControl?.config?.visibility).toBe('function');
    });
  });

  describe('Column Mapping Controls', () => {
    it('has image URL column control', () => {
      const columnMappingSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Column Mapping'
      );
      
      const imageUrlControl = columnMappingSection?.controlSetRows?.[0]?.[0];
      expect(imageUrlControl).toBeDefined();
      expect(imageUrlControl?.name).toBe('image_url_column');
      expect(imageUrlControl?.config?.type).toBe('SelectControl');
      expect(imageUrlControl?.config?.label).toBe('Image URL Column');
    });

    it('has name column control', () => {
      const columnMappingSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Column Mapping'
      );
      
      const nameControl = columnMappingSection?.controlSetRows?.[1]?.[0];
      expect(nameControl).toBeDefined();
      expect(nameControl?.name).toBe('name_column');
      expect(nameControl?.config?.type).toBe('SelectControl');
      expect(nameControl?.config?.label).toBe('Name Column');
    });

    it('has description column control', () => {
      const columnMappingSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Column Mapping'
      );
      
      const descriptionControl = columnMappingSection?.controlSetRows?.[2]?.[0];
      expect(descriptionControl).toBeDefined();
      expect(descriptionControl?.name).toBe('description_column');
      expect(descriptionControl?.config?.type).toBe('SelectControl');
      expect(descriptionControl?.config?.label).toBe('Description Column');
    });

    it('has CTA label column control', () => {
      const columnMappingSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Column Mapping'
      );
      
      const ctaLabelControl = columnMappingSection?.controlSetRows?.[3]?.[0];
      expect(ctaLabelControl).toBeDefined();
      expect(ctaLabelControl?.name).toBe('cta_label_column');
      expect(ctaLabelControl?.config?.type).toBe('SelectControl');
      expect(ctaLabelControl?.config?.label).toBe('CTA Label Column');
    });

    it('has CTA link column control', () => {
      const columnMappingSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Column Mapping'
      );
      
      const ctaLinkControl = columnMappingSection?.controlSetRows?.[4]?.[0];
      expect(ctaLinkControl).toBeDefined();
      expect(ctaLinkControl?.name).toBe('cta_link_column');
      expect(ctaLinkControl?.config?.type).toBe('SelectControl');
      expect(ctaLinkControl?.config?.label).toBe('CTA Link Column');
    });

    it('all column mapping controls have visibility functions', () => {
      const columnMappingSection = controlPanel.controlPanelSections.find(
        section => section.label === 'Column Mapping'
      );
      
      columnMappingSection?.controlSetRows?.forEach(row => {
        const control = row[0];
        if (control?.config?.visibility) {
          expect(typeof control.config.visibility).toBe('function');
        }
      });
    });
  });

  describe('Query Controls', () => {
    it('has groupby control', () => {
      const querySection = controlPanel.controlPanelSections.find(
        section => section.label === 'Query'
      );
      
      const groupbyControl = querySection?.controlSetRows?.[0]?.[0];
      expect(groupbyControl).toBeDefined();
      expect(groupbyControl?.name).toBe('groupby');
      expect(groupbyControl?.config?.type).toBe('DndColumnSelect');
      expect(groupbyControl?.config?.label).toBe('Columns');
    });

    it('has adhoc filters control', () => {
      const querySection = controlPanel.controlPanelSections.find(
        section => section.label === 'Query'
      );
      
      const adhocFiltersControl = querySection?.controlSetRows?.[1]?.[0];
      expect(adhocFiltersControl).toBe('adhoc_filters');
    });

    it('has row limit control', () => {
      const querySection = controlPanel.controlPanelSections.find(
        section => section.label === 'Query'
      );
      
      const rowLimitControl = querySection?.controlSetRows?.[2]?.[0];
      expect(rowLimitControl).toBeDefined();
      expect(rowLimitControl?.name).toBe('row_limit');
      expect(rowLimitControl?.config?.default).toBe(1000);
    });
  });

  describe('Form Data Overrides', () => {
    it('provides default values for required fields', () => {
      const mockFormData = {};
      const result = controlPanel.formDataOverrides(mockFormData);

      expect(result.image_url_column).toBeNull();
      expect(result.name_column).toBeNull();
      expect(result.description_column).toBeNull();
      expect(result.cta_label_column).toBeNull();
      expect(result.cta_link_column).toBeNull();
      expect(result.view_mode).toBe('table');
      expect(result.gallery_size).toBe(6);
    });

    it('preserves existing form data values', () => {
      const mockFormData = {
        image_url_column: 'custom_image_url',
        name_column: 'custom_name',
        view_mode: 'carousel',
        gallery_size: 9,
        other_field: 'other_value',
      };
      
      const result = controlPanel.formDataOverrides(mockFormData);

      expect(result.image_url_column).toBe('custom_image_url');
      expect(result.name_column).toBe('custom_name');
      expect(result.view_mode).toBe('carousel');
      expect(result.gallery_size).toBe(9);
      expect(result.other_field).toBe('other_value');
    });
  });
});
