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
import { HyperlinkConfig, HyperlinkConfigs } from '../types';

const ControlContainer = styled.div`
  .hyperlink-config-section {
    margin-bottom: 16px;
  }

  .hyperlink-config-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
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

  .hyperlink-config-actions {
    display: flex;
    gap: 4px;
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
  
  console.log('🎛️ HyperlinkConfigControl rendered with:', {
    enabled: hyperlinkConfigs.enabled,
    configs: hyperlinkConfigs.configs,
    columns: columns.length,
    queryResponse: !!queryResponse
  });

  // Get available columns from query response if available
  const availableColumns = React.useMemo(() => {
    console.log('📊 Getting available columns from:', {
      queryResponseData: queryResponse?.data?.length,
      columnsLength: columns.length,
      queryResponseKeys: queryResponse?.data?.length > 0 ? Object.keys(queryResponse.data[0]) : null
    });
    
    if (queryResponse?.data?.length > 0) {
      const keys = Object.keys(queryResponse.data[0]);
      console.log('📊 Using query response columns:', keys);
      return keys;
    }
    const columnNames = columns.map(col => col.column_name);
    console.log('📊 Using datasource columns:', columnNames);
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
    console.log(`⚙️ Config change: ${field} = "${newValue}" for index ${index}`);
    
    const newConfigs = [...hyperlinkConfigs.configs];
    newConfigs[index] = { ...newConfigs[index], [field]: newValue };
    
    const updatedValue = { ...hyperlinkConfigs, configs: newConfigs };
    console.log('⚙️ Updated configs:', updatedValue);
    
    onChange?.(updatedValue);

    // Validate the changed config
    const error = validateConfig(newConfigs[index], index);
    console.log(`⚙️ Validation result for ${field}:`, error || 'Valid');
    
    setErrors(prev => ({
      ...prev,
      [`${index}-${field}`]: error || '',
    }));
  }, [hyperlinkConfigs, onChange, validateConfig]);

  const addConfig = useCallback(() => {
    console.log('➕ Adding new hyperlink config');
    const newConfig: HyperlinkConfig = {
      displayColumn: '',
      urlColumn: '',
    };
    
    const newConfigs = [...hyperlinkConfigs.configs, newConfig];
    const updatedValue = { ...hyperlinkConfigs, configs: newConfigs };
    console.log('➕ New configs after add:', updatedValue);
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
    console.log('🔄 Toggling hyperlink enabled:', !hyperlinkConfigs.enabled);
    const updatedValue = { ...hyperlinkConfigs, enabled: !hyperlinkConfigs.enabled };
    console.log('🔄 Updated value after toggle:', updatedValue);
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
