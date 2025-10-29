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
  buildQueryContext,
  ensureIsArray,
  QueryMode,
  QueryObject,
} from '@superset-ui/core';
import { BuildQuery } from '@superset-ui/core/src/chart/registries/ChartBuildQueryRegistrySingleton';
import { CarouselChartFormData } from './types';

/**
 * Build query for carousel chart.
 * Automatically includes column mappings in the query to avoid "Empty query?" error.
 */
const buildQuery: BuildQuery<CarouselChartFormData> = (
  formData: CarouselChartFormData,
  options,
) => {
  const {
    image_url_column,
    name_column,
    description_column,
    cta_label_column,
    cta_link_column,
    groupby = [],
  } = formData;

  // Collect all carousel-specific columns that need to be queried
  const carouselColumns: string[] = [];
  
  if (image_url_column) {
    carouselColumns.push(image_url_column);
  }
  if (name_column) {
    carouselColumns.push(name_column);
  }
  if (description_column) {
    carouselColumns.push(description_column);
  }
  if (cta_label_column) {
    carouselColumns.push(cta_label_column);
  }
  if (cta_link_column) {
    carouselColumns.push(cta_link_column);
  }

  // Combine with any additional groupby columns (remove duplicates)
  const allColumns = Array.from(
    new Set([...carouselColumns, ...ensureIsArray(groupby)]),
  );

  // Update form data to include all necessary columns
  const formDataCopy = {
    ...formData,
    groupby: allColumns,
    // Use raw query mode since we're just displaying data
    query_mode: QueryMode.Raw,
    all_columns: allColumns,
  };

  return buildQueryContext(formDataCopy, baseQueryObject => {
    const queryObject: QueryObject = {
      ...baseQueryObject,
      columns: allColumns,
      // Set reasonable defaults
      orderby: formData.orderby || [],
      row_limit: formData.row_limit || 1000,
    };

    return [queryObject];
  });
};

export default buildQuery;

