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

import BigNumberTotalControlPanel from '../BigNumberTotal/controlPanel';
import BigNumberWithTrendlineControlPanel from '../BigNumberWithTrendline/controlPanel';
import BigNumberPeriodOverPeriodControlPanel from '../BigNumberPeriodOverPeriod/controlPanel';
import { showIcon, iconType, iconUrl, iconUpload, iconSize } from '../sharedControls';

describe('Control Panel Icon Integration', () => {
  describe('BigNumberTotal Control Panel', () => {
    it('should include icon controls in the control panel', () => {
      const controlPanel = BigNumberTotalControlPanel;
      
      // Check that the control panel has the expected structure
      expect(controlPanel.controlPanelSections).toBeDefined();
      
      // Find the Chart Options section
      const chartOptionsSection = controlPanel.controlPanelSections?.find(
        section => section.label === 'Chart Options'
      );
      expect(chartOptionsSection).toBeDefined();
      
      // Check that icon controls are included
      const controlSetRows = chartOptionsSection?.controlSetRows || [];
      const allControls = controlSetRows.flat();
      
      // Check for icon control names
      const controlNames = allControls.map(control => 
        typeof control === 'string' ? control : (control as any).name
      );
      
      expect(controlNames).toContain('show_icon');
      expect(controlNames).toContain('icon_type');
      expect(controlNames).toContain('icon_url');
      expect(controlNames).toContain('icon_upload');
      expect(controlNames).toContain('icon_size');
    });

    it('should have proper control order', () => {
      const controlPanel = BigNumberTotalControlPanel;
      const chartOptionsSection = controlPanel.controlPanelSections?.find(
        section => section.label === 'Chart Options'
      );
      
      const controlSetRows = chartOptionsSection?.controlSetRows || [];
      const allControls = controlSetRows.flat();
      
      const controlNames = allControls.map(control => 
        typeof control === 'string' ? control : (control as any).name
      );
      
      // Check that icon controls come after clickable card controls
      const clickableCardIndex = controlNames.indexOf('url_column');
      const showIconIndex = controlNames.indexOf('show_icon');
      
      expect(showIconIndex).toBeGreaterThan(clickableCardIndex);
      
      // Check that icon controls are grouped together
      const iconTypeIndex = controlNames.indexOf('icon_type');
      const iconUrlIndex = controlNames.indexOf('icon_url');
      const iconUploadIndex = controlNames.indexOf('icon_upload');
      const iconSizeIndex = controlNames.indexOf('icon_size');
      
      expect(iconTypeIndex).toBe(showIconIndex + 1);
      expect(iconUrlIndex).toBe(showIconIndex + 2);
      expect(iconUploadIndex).toBe(showIconIndex + 3);
      expect(iconSizeIndex).toBe(showIconIndex + 4);
    });
  });

  describe('BigNumberWithTrendline Control Panel', () => {
    it('should include icon controls in the control panel', () => {
      const controlPanel = BigNumberWithTrendlineControlPanel;
      
      const chartOptionsSection = controlPanel.controlPanelSections?.find(
        section => section.label === 'Chart Options'
      );
      expect(chartOptionsSection).toBeDefined();
      
      const controlSetRows = chartOptionsSection?.controlSetRows || [];
      const allControls = controlSetRows.flat();
      const controlNames = allControls.map(control => 
        typeof control === 'string' ? control : (control as any).name
      );
      
      expect(controlNames).toContain('show_icon');
      expect(controlNames).toContain('icon_type');
      expect(controlNames).toContain('icon_url');
      expect(controlNames).toContain('icon_upload');
      expect(controlNames).toContain('icon_size');
    });
  });

  describe('BigNumberPeriodOverPeriod Control Panel', () => {
    it('should include icon controls in the control panel', () => {
      const controlPanel = BigNumberPeriodOverPeriodControlPanel;
      
      const chartOptionsSection = controlPanel.controlPanelSections?.find(
        section => section.label === 'Chart Options'
      );
      expect(chartOptionsSection).toBeDefined();
      
      const controlSetRows = chartOptionsSection?.controlSetRows || [];
      const allControls = controlSetRows.flat();
      const controlNames = allControls.map(control => 
        typeof control === 'string' ? control : (control as any).name
      );
      
      expect(controlNames).toContain('show_icon');
      expect(controlNames).toContain('icon_type');
      expect(controlNames).toContain('icon_type');
      expect(controlNames).toContain('icon_url');
      expect(controlNames).toContain('icon_upload');
      expect(controlNames).toContain('icon_size');
    });
  });

  describe('Shared Controls Configuration', () => {
    it('should have correct showIcon control configuration', () => {
      expect(showIcon.name).toBe('show_icon');
      expect(showIcon.config.type).toBe('CheckboxControl');
      expect(showIcon.config.default).toBe(false);
      expect(showIcon.config.label).toBe('Show Icon');
    });

    it('should have correct iconType control configuration', () => {
      expect(iconType.name).toBe('icon_type');
      expect(iconType.config.type).toBe('SelectControl');
      expect(iconType.config.default).toBe('url');
      expect(iconType.config.choices).toEqual([
        ['url', 'URL'],
        ['upload', 'Upload'],
      ]);
    });

    it('should have correct iconUrl control configuration', () => {
      expect(iconUrl.name).toBe('icon_url');
      expect(iconUrl.config.type).toBe('TextControl');
      expect(iconUrl.config.default).toBe('');
      expect(iconUrl.config.validators).toHaveLength(1);
    });

    it('should have correct iconUpload control configuration', () => {
      expect(iconUpload.name).toBe('icon_upload');
      expect(iconUpload.config.type).toBe('FileControl');
      expect(iconUpload.config.default).toBe(null);
      expect(iconUpload.config.accept).toBe('.png,.jpg,.jpeg,.svg,.gif');
      expect(iconUpload.config.validators).toHaveLength(1);
    });

    it('should have correct iconSize control configuration', () => {
      expect(iconSize.name).toBe('icon_size');
      expect(iconSize.config.type).toBe('SelectControl');
      expect(iconSize.config.default).toBe('medium');
      expect(iconSize.config.choices).toEqual([
        ['small', 'Small'],
        ['medium', 'Medium'],
        ['large', 'Large'],
        ['xlarge', 'Extra Large'],
      ]);
    });
  });

  describe('Control Visibility Logic', () => {
    it('should show icon controls only when showIcon is true', () => {
      const mockControls = {
        show_icon: { value: false },
        icon_type: { value: 'url' }
      };

      expect(iconType.config.visibility?.(mockControls as any)).toBe(false);
      expect(iconUrl.config.visibility?.(mockControls as any)).toBe(false);
      expect(iconUpload.config.visibility?.(mockControls as any)).toBe(false);
      expect(iconSize.config.visibility?.(mockControls as any)).toBe(false);

      mockControls.show_icon.value = true;
      expect(iconType.config.visibility?.(mockControls as any)).toBe(true);
      expect(iconSize.config.visibility?.(mockControls as any)).toBe(true);
    });

    it('should show iconUrl only when iconType is url', () => {
      const mockControls = {
        show_icon: { value: true },
        icon_type: { value: 'url' }
      };

      expect(iconUrl.config.visibility?.(mockControls as any)).toBe(true);
      expect(iconUpload.config.visibility?.(mockControls as any)).toBe(false);

      mockControls.icon_type.value = 'upload';
      expect(iconUrl.config.visibility?.(mockControls as any)).toBe(false);
      expect(iconUpload.config.visibility?.(mockControls as any)).toBe(true);
    });

    it('should handle undefined controls gracefully', () => {
      const mockControls = {};

      expect(iconType.config.visibility?.(mockControls as any)).toBe(false);
      expect(iconUrl.config.visibility?.(mockControls as any)).toBe(false);
      expect(iconUpload.config.visibility?.(mockControls as any)).toBe(false);
      expect(iconSize.config.visibility?.(mockControls as any)).toBe(false);
    });
  });

  describe('Control Dependencies', () => {
    it('should have proper control dependencies', () => {
      // showIcon should be independent
      expect(showIcon.config.visibility).toBeUndefined();

      // iconType should depend on showIcon
      expect(iconType.config.visibility).toBeDefined();

      // iconUrl should depend on showIcon and iconType
      expect(iconUrl.config.visibility).toBeDefined();

      // iconUpload should depend on showIcon and iconType
      expect(iconUpload.config.visibility).toBeDefined();

      // iconSize should depend on showIcon
      expect(iconSize.config.visibility).toBeDefined();
    });
  });
});
