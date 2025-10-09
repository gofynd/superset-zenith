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
import { Collapse, Checkbox, Select, Input, ColorPicker, Space } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SettingOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { ActionButtonConfig, ActionButtonConfigs } from '../types';

const { Panel } = Collapse;

const ControlContainer = styled.div`
  .action-button-config-section {
    margin-bottom: 16px;
  }

  .action-button-config-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background-color: #f9f9f9;
  }

  .action-button-config-fields {
    display: flex;
    gap: 8px;
    flex: 1;
  }

  .action-button-config-field {
    flex: 1;
  }

  .action-button-config-field select {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .action-button-styling-section {
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

  .action-button-config-actions {
    display: flex;
    gap: 4px;
    margin-top: 12px;
  }

  .action-button-config-button {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    font-size: 12px;
  }

  .action-button-config-button:hover {
    background-color: #f0f0f0;
  }

  .action-button-config-button.danger {
    color: #d32f2f;
    border-color: #d32f2f;
  }

  .action-button-config-button.danger:hover {
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

  .color-picker-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

interface ActionButtonConfigControlProps {
  value?: ActionButtonConfigs;
  onChange: (value: ActionButtonConfigs) => void;
  columns?: Array<{ key: string; label: string }>;
  queryResponse?: any;
}

export default function ActionButtonConfigControl({
  value = { enabled: false, configs: [] },
  onChange,
  columns = [],
  queryResponse,
}: ActionButtonConfigControlProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const actionButtonConfigs = value;

  const validateConfig = useCallback((config: ActionButtonConfig, index: number) => {
    const newErrors: Record<string, string> = {};

    if (!config.displayColumn) {
      newErrors[`${index}-displayColumn`] = t('Display column is required');
    }

    if (!config.urlColumn) {
      newErrors[`${index}-urlColumn`] = t('URL column is required');
    }

    if (config.styles.buttonColor === 'custom' && !config.styles.customColor) {
      newErrors[`${index}-customColor`] = t('Custom color is required when custom color is selected');
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, []);

  const toggleEnabled = useCallback(() => {
    onChange({
      ...actionButtonConfigs,
      enabled: !actionButtonConfigs.enabled,
    });
  }, [actionButtonConfigs, onChange]);

  const addConfig = useCallback(() => {
    const newConfig: ActionButtonConfig = {
      displayColumn: '',
      urlColumn: '',
      labelColumn: '',
      conditionColumn: '',
      styles: {
        buttonColor: 'primary',
        buttonSize: 'medium',
        iconPosition: 'left',
        borderRadius: 'medium',
        fontWeight: 'normal',
        hoverEffect: true,
        tooltip: '',
      },
    };

    onChange({
      ...actionButtonConfigs,
      configs: [...actionButtonConfigs.configs, newConfig],
    });
  }, [actionButtonConfigs, onChange]);

  const removeConfig = useCallback((index: number) => {
    const newConfigs = actionButtonConfigs.configs.filter((_, i) => i !== index);
    onChange({
      ...actionButtonConfigs,
      configs: newConfigs,
    });
  }, [actionButtonConfigs, onChange]);

  const handleConfigChange = useCallback((index: number, field: keyof ActionButtonConfig, value: any) => {
    const newConfigs = [...actionButtonConfigs.configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    onChange({
      ...actionButtonConfigs,
      configs: newConfigs,
    });
    validateConfig(newConfigs[index], index);
  }, [actionButtonConfigs, onChange, validateConfig]);

  const handleStyleChange = useCallback((index: number, field: keyof ActionButtonConfig['styles'], value: any) => {
    const newConfigs = [...actionButtonConfigs.configs];
    newConfigs[index] = {
      ...newConfigs[index],
      styles: { ...newConfigs[index].styles, [field]: value },
    };
    onChange({
      ...actionButtonConfigs,
      configs: newConfigs,
    });
    validateConfig(newConfigs[index], index);
  }, [actionButtonConfigs, onChange, validateConfig]);

  return (
    <ControlContainer>
      <div className="action-button-config-section">
        <label>
          <input
            type="checkbox"
            checked={actionButtonConfigs.enabled}
            onChange={toggleEnabled}
          />
          {t('Enable Action Buttons')}
        </label>
      </div>

      {actionButtonConfigs.enabled && (
        <div>
          {actionButtonConfigs.configs.map((config, index) => (
            <div key={index} className="action-button-config-item">
              <div className="action-button-config-fields">
                <div className="action-button-config-field">
                  <label>{t('Display Column')}</label>
                  <select
                    value={config.displayColumn}
                    onChange={(e) => handleConfigChange(index, 'displayColumn', e.target.value)}
                  >
                    <option value="">{t('Select column...')}</option>
                    {columns.map(col => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                  {errors[`${index}-displayColumn`] && (
                    <div className="error-message">{errors[`${index}-displayColumn`]}</div>
                  )}
                </div>

                <div className="action-button-config-field">
                  <label>{t('URL Column')}</label>
                  <select
                    value={config.urlColumn}
                    onChange={(e) => handleConfigChange(index, 'urlColumn', e.target.value)}
                  >
                    <option value="">{t('Select column...')}</option>
                    {columns.map(col => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                  {errors[`${index}-urlColumn`] && (
                    <div className="error-message">{errors[`${index}-urlColumn`]}</div>
                  )}
                </div>
              </div>

              <div className="action-button-config-fields">
                <div className="action-button-config-field">
                  <label>{t('Label Column (Optional)')}</label>
                  <select
                    value={config.labelColumn || ''}
                    onChange={(e) => handleConfigChange(index, 'labelColumn', e.target.value || undefined)}
                  >
                    <option value="">{t('Static label')}</option>
                    {columns.map(col => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="action-button-config-field">
                  <label>{t('Condition Column (Optional)')}</label>
                  <select
                    value={config.conditionColumn || ''}
                    onChange={(e) => handleConfigChange(index, 'conditionColumn', e.target.value || undefined)}
                  >
                    <option value="">{t('Always show')}</option>
                    {columns.map(col => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Styling Options */}
              <div className="action-button-styling-section">
                <Collapse>
                  <Panel header={<><SettingOutlined /> {t('Button Styling')}</>} key="styling">
                    <div className="styling-grid">
                      {/* Basic Styles */}
                      <div className="styling-group">
                        <h4>{t('Basic Styles')}</h4>
                        <Space direction="vertical" size="small">
                          <div className="style-field">
                            <label>{t('Button Color')}</label>
                            <Select
                              value={config.styles.buttonColor}
                              onChange={(value) => handleStyleChange(index, 'buttonColor', value)}
                              style={{ width: 120 }}
                            >
                              <Select.Option value="primary">{t('Primary')}</Select.Option>
                              <Select.Option value="secondary">{t('Secondary')}</Select.Option>
                              <Select.Option value="success">{t('Success')}</Select.Option>
                              <Select.Option value="warning">{t('Warning')}</Select.Option>
                              <Select.Option value="danger">{t('Danger')}</Select.Option>
                              <Select.Option value="custom">{t('Custom')}</Select.Option>
                            </Select>
                          </div>

                          {config.styles.buttonColor === 'custom' && (
                            <div className="style-field">
                              <label>{t('Custom Color')}</label>
                              <div className="color-picker-container">
                                <Input
                                  type="color"
                                  value={config.styles.customColor || '#1976d2'}
                                  onChange={(e) => handleStyleChange(index, 'customColor', e.target.value)}
                                  style={{ width: 40, height: 32 }}
                                />
                                <Input
                                  value={config.styles.customColor || '#1976d2'}
                                  onChange={(e) => handleStyleChange(index, 'customColor', e.target.value)}
                                  placeholder="#1976d2"
                                  style={{ flex: 1 }}
                                />
                              </div>
                              {errors[`${index}-customColor`] && (
                                <div className="error-message">{errors[`${index}-customColor`]}</div>
                              )}
                            </div>
                          )}

                          <div className="style-field">
                            <label>{t('Button Size')}</label>
                            <Select
                              value={config.styles.buttonSize}
                              onChange={(value) => handleStyleChange(index, 'buttonSize', value)}
                              style={{ width: 120 }}
                            >
                              <Select.Option value="small">{t('Small')}</Select.Option>
                              <Select.Option value="medium">{t('Medium')}</Select.Option>
                              <Select.Option value="large">{t('Large')}</Select.Option>
                            </Select>
                          </div>

                          <div className="style-field">
                            <label>{t('Border Radius')}</label>
                            <Select
                              value={config.styles.borderRadius}
                              onChange={(value) => handleStyleChange(index, 'borderRadius', value)}
                              style={{ width: 120 }}
                            >
                              <Select.Option value="none">{t('None')}</Select.Option>
                              <Select.Option value="small">{t('Small')}</Select.Option>
                              <Select.Option value="medium">{t('Medium')}</Select.Option>
                              <Select.Option value="large">{t('Large')}</Select.Option>
                            </Select>
                          </div>

                          <Checkbox
                            checked={config.styles.hoverEffect}
                            onChange={(e) => handleStyleChange(index, 'hoverEffect', e.target.checked)}
                          >
                            {t('Hover Effects')}
                          </Checkbox>
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
                        </Space>
                      </div>

                      {/* Tooltip */}
                      <div className="styling-group">
                        <h4>{t('Tooltip & Accessibility')}</h4>
                        <Space direction="vertical" size="small">
                          <div className="style-field">
                            <label>{t('Tooltip Text')}</label>
                            <Input
                              value={config.styles.tooltip || ''}
                              onChange={(e) => handleStyleChange(index, 'tooltip', e.target.value)}
                              placeholder={t('Enter tooltip text...')}
                            />
                          </div>

                          <div className="style-field">
                            <label>{t('Tooltip Column (Optional)')}</label>
                            <select
                              value={config.styles.tooltipColumn || ''}
                              onChange={(e) => handleStyleChange(index, 'tooltipColumn', e.target.value || undefined)}
                            >
                              <option value="">{t('Use static tooltip')}</option>
                              {columns.map(col => (
                                <option key={col.key} value={col.key}>
                                  {col.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </Space>
                      </div>
                    </div>
                  </Panel>
                </Collapse>
              </div>

              <div className="action-button-config-actions">
                <button
                  type="button"
                  className="action-button-config-button danger"
                  onClick={() => removeConfig(index)}
                  title={t('Remove this action button configuration')}
                >
                  <DeleteOutlined /> {t('Remove')}
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="add-button"
            onClick={addConfig}
            disabled={!actionButtonConfigs.enabled}
            title={t('Add a new action button configuration')}
          >
            <PlusOutlined /> {t('Add Action Button')}
          </button>
        </div>
      )}
    </ControlContainer>
  );
}
