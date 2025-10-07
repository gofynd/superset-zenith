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

import React, { useState, useCallback } from 'react';
import { styled, t } from '@superset-ui/core';
import { Checkbox, Select, Space, Collapse } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { HyperlinkConfig, HyperlinkConfigs } from '../types';

const { Panel } = Collapse;

const ControlContainer = styled.div`
  .hyperlink-config-section {
    margin-bottom: 16px;
  }

  .hyperlink-config-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background-color: #f9f9f9;
  }

  .hyperlink-config-fields {
    display: flex;
    gap: 8px;
    flex: 1;
  }

  .hyperlink-config-field {
    flex: 1;
  }

  .hyperlink-config-field select {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .hyperlink-styling-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e8e8e8;
  }

  .styling-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 12px;
  }

  .styling-group {
    h4 {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: #262626;
    }
  }

  .style-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    label {
      font-size: 12px;
      color: #595959;
      font-weight: 500;
    }
  }

  .icon-position {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    label {
      font-size: 12px;
      color: #595959;
      font-weight: 500;
    }
  }

  .hyperlink-config-actions {
    display: flex;
    gap: 4px;
    margin-top: 12px;
  }

  .hyperlink-config-button {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    font-size: 12px;
  }

  .hyperlink-config-button:hover {
    background-color: #f0f0f0;
  }

  .hyperlink-config-button.danger {
    color: #d32f2f;
    border-color: #d32f2f;
  }

  .hyperlink-config-button.danger:hover {
    background-color: #ffebee;
  }

  .add-button {
    padding: 8px 16px;
    background-color: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .add-button:hover {
    background-color: #1565c0;
  }

  .add-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .error-message {
    color: #d32f2f;
    font-size: 12px;
    margin-top: 4px;
  }
`;

interface HyperlinkConfigControlProps {
  value?: HyperlinkConfigs;
  onChange?: (value: HyperlinkConfigs) => void;
  columns: Array<{ column_name: string; verbose_name?: string }>;
  queryResponse?: any;
}

export default function HyperlinkConfigControl({
  value = { enabled: false, configs: [] },
  onChange,
  columns = [],
  queryResponse,
}: HyperlinkConfigControlProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hyperlinkConfigs: HyperlinkConfigs = value as HyperlinkConfigs;
  

  // Get available columns from query response if available
  const availableColumns = React.useMemo(() => {
    if (queryResponse?.data?.length > 0) {
      const keys = Object.keys(queryResponse.data[0]);
      return keys;
    }
    const columnNames = columns.map(col => col.column_name);
    return columnNames;
  }, [queryResponse, columns]);

  const validateConfig = useCallback((config: HyperlinkConfig, index: number): string | null => {
    if (!config.displayColumn || !config.urlColumn) {
      return t('Both display column and URL column are required');
    }
    
    if (config.displayColumn === config.urlColumn) {
      return t('Display column and URL column must be different');
    }

    if (!availableColumns.includes(config.displayColumn)) {
      return t('Display column does not exist in the dataset');
    }

    if (!availableColumns.includes(config.urlColumn)) {
      return t('URL column does not exist in the dataset');
    }

    // Check for duplicate display columns
    const duplicateIndex = hyperlinkConfigs.configs.findIndex(
      (c, i) => i !== index && c.displayColumn === config.displayColumn
    );
    if (duplicateIndex !== -1) {
      return t('Display column is already used in another hyperlink configuration');
    }

    return null;
  }, [availableColumns, hyperlinkConfigs.configs]);

  const handleConfigChange = useCallback((index: number, field: keyof HyperlinkConfig, newValue: string) => {
    const newConfigs = [...hyperlinkConfigs.configs];
    newConfigs[index] = { ...newConfigs[index], [field]: newValue };
    
    const updatedValue = { ...hyperlinkConfigs, configs: newConfigs };
    onChange?.(updatedValue);

    // Validate the changed config
    const error = validateConfig(newConfigs[index], index);
    
    setErrors(prev => ({
      ...prev,
      [`${index}-${field}`]: error || '',
    }));
  }, [hyperlinkConfigs, onChange, validateConfig]);

  const handleStyleChange = useCallback((index: number, styleField: keyof HyperlinkConfig['styles'], newValue: any) => {
    const newConfigs = [...hyperlinkConfigs.configs];
    newConfigs[index] = { 
      ...newConfigs[index], 
      styles: { 
        ...newConfigs[index].styles, 
        [styleField]: newValue 
      } 
    };
    
    const updatedValue = { ...hyperlinkConfigs, configs: newConfigs };
    onChange?.(updatedValue);
  }, [hyperlinkConfigs, onChange]);

  const addConfig = useCallback(() => {
    const newConfig: HyperlinkConfig = {
      displayColumn: '',
      urlColumn: '',
      styles: {
        hyperlinkColor: true,
        underline: true,
        redirectIcon: false,
        iconPosition: 'right',
        fontWeight: 'normal',
        fontStyle: 'normal',
        hoverEffect: true,
        backgroundColor: false,
        borderRadius: false,
        padding: false,
      },
    };
    
    const newConfigs = [...hyperlinkConfigs.configs, newConfig];
    const updatedValue = { ...hyperlinkConfigs, configs: newConfigs };
    onChange?.(updatedValue);
  }, [hyperlinkConfigs, onChange]);

  const removeConfig = useCallback((index: number) => {
    const newConfigs = hyperlinkConfigs.configs.filter((_, i) => i !== index);
    const updatedValue = { ...hyperlinkConfigs, configs: newConfigs };
    onChange?.(updatedValue);
    
    // Clear errors for removed config
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${index}-`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, [hyperlinkConfigs, onChange]);

  const toggleEnabled = useCallback(() => {
    const updatedValue = { ...hyperlinkConfigs, enabled: !hyperlinkConfigs.enabled };
    onChange?.(updatedValue);
  }, [hyperlinkConfigs, onChange]);

  return (
    <ControlContainer>
      <div className="hyperlink-config-section">
        <label>
          <input
            type="checkbox"
            checked={hyperlinkConfigs.enabled}
            onChange={toggleEnabled}
          />
          {t('Enable hyperlink columns')}
        </label>
      </div>

      {hyperlinkConfigs.enabled && (
        <div>
          {hyperlinkConfigs.configs.map((config, index) => (
            <div key={index} className="hyperlink-config-item">
              <div className="hyperlink-config-fields">
                <div className="hyperlink-config-field">
                  <label>{t('Display Column')}</label>
                  <select
                    value={config.displayColumn}
                    onChange={(e) => handleConfigChange(index, 'displayColumn', e.target.value)}
                  >
                    <option value="">{t('Select column...')}</option>
                    {availableColumns.map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  {errors[`${index}-displayColumn`] && (
                    <div className="error-message">{errors[`${index}-displayColumn`]}</div>
                  )}
                </div>
                
                <div className="hyperlink-config-field">
                  <label>{t('URL Column')}</label>
                  <select
                    value={config.urlColumn}
                    onChange={(e) => handleConfigChange(index, 'urlColumn', e.target.value)}
                  >
                    <option value="">{t('Select column...')}</option>
                    {availableColumns.map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  {errors[`${index}-urlColumn`] && (
                    <div className="error-message">{errors[`${index}-urlColumn`]}</div>
                  )}
                </div>
              </div>

              {/* Styling Options */}
              <div className="hyperlink-styling-section">
                <Collapse>
                  <Panel header={<><LinkOutlined /> {t('Styling Options')}</>} key="styling">
                    <div className="styling-grid">
                      {/* Basic Styles */}
                      <div className="styling-group">
                        <h4>{t('Basic Styles')}</h4>
                        <Space direction="vertical" size="small">
                          <Checkbox
                            checked={config.styles.hyperlinkColor}
                            onChange={(e) => handleStyleChange(index, 'hyperlinkColor', e.target.checked)}
                          >
                            {t('Hyperlink Color (Blue)')}
                          </Checkbox>
                          <Checkbox
                            checked={config.styles.underline}
                            onChange={(e) => handleStyleChange(index, 'underline', e.target.checked)}
                          >
                            {t('Underline')}
                          </Checkbox>
                          <Checkbox
                            checked={config.styles.hoverEffect}
                            onChange={(e) => handleStyleChange(index, 'hoverEffect', e.target.checked)}
                          >
                            {t('Hover Effects')}
                          </Checkbox>
                        </Space>
                      </div>

                      {/* Icon Options */}
                      <div className="styling-group">
                        <h4>{t('Icon Options')}</h4>
                        <Space direction="vertical" size="small">
                          <Checkbox
                            checked={config.styles.redirectIcon}
                            onChange={(e) => handleStyleChange(index, 'redirectIcon', e.target.checked)}
                          >
                            {t('Show Redirect Icon')}
                          </Checkbox>
                          {config.styles.redirectIcon && (
                            <div className="icon-position">
                              <label>{t('Icon Position')}</label>
                              <Select
                                value={config.styles.iconPosition}
                                onChange={(value) => handleStyleChange(index, 'iconPosition', value)}
                                style={{ width: 120 }}
                              >
                                <Select.Option value="left">{t('Left')}</Select.Option>
                                <Select.Option value="right">{t('Right')}</Select.Option>
                              </Select>
                            </div>
                          )}
                        </Space>
                      </div>

                      {/* Typography */}
                      <div className="styling-group">
                        <h4>{t('Typography')}</h4>
                        <Space direction="vertical" size="small">
                          <div className="style-field">
                            <label>{t('Font Weight')}</label>
                            <Select
                              value={config.styles.fontWeight}
                              onChange={(value) => handleStyleChange(index, 'fontWeight', value)}
                              style={{ width: 120 }}
                            >
                              <Select.Option value="normal">{t('Normal')}</Select.Option>
                              <Select.Option value="bold">{t('Bold')}</Select.Option>
                              <Select.Option value="light">{t('Light')}</Select.Option>
                            </Select>
                          </div>
                          <div className="style-field">
                            <label>{t('Font Style')}</label>
                            <Select
                              value={config.styles.fontStyle}
                              onChange={(value) => handleStyleChange(index, 'fontStyle', value)}
                              style={{ width: 120 }}
                            >
                              <Select.Option value="normal">{t('Normal')}</Select.Option>
                              <Select.Option value="italic">{t('Italic')}</Select.Option>
                            </Select>
                          </div>
                        </Space>
                      </div>

                      {/* Advanced Styles */}
                      <div className="styling-group">
                        <h4>{t('Advanced Styles')}</h4>
                        <Space direction="vertical" size="small">
                          <Checkbox
                            checked={config.styles.backgroundColor}
                            onChange={(e) => handleStyleChange(index, 'backgroundColor', e.target.checked)}
                          >
                            {t('Background Color')}
                          </Checkbox>
                          <Checkbox
                            checked={config.styles.borderRadius}
                            onChange={(e) => handleStyleChange(index, 'borderRadius', e.target.checked)}
                          >
                            {t('Rounded Corners')}
                          </Checkbox>
                          <Checkbox
                            checked={config.styles.padding}
                            onChange={(e) => handleStyleChange(index, 'padding', e.target.checked)}
                          >
                            {t('Extra Padding')}
                          </Checkbox>
                        </Space>
                      </div>
                    </div>
                  </Panel>
                </Collapse>
              </div>
              
              <div className="hyperlink-config-actions">
                {hyperlinkConfigs.configs.length > 1 && (
                  <button
                    type="button"
                    className="hyperlink-config-button danger"
                    onClick={() => removeConfig(index)}
                    title={t('Remove this hyperlink configuration')}
                  >
                    {t('Remove')}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className="add-button"
            onClick={addConfig}
            title={t('Add a new hyperlink configuration')}
          >
            {t('Add Hyperlink Pair')}
          </button>
        </div>
      )}
    </ControlContainer>
  );
}
