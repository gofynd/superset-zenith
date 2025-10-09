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
import { DataRecord, ChartProps } from '@superset-ui/core';
import {
  CarouselChartProps,
  CarouselChartTransformedProps,
  CarouselItem,
} from './types';

export default function transformProps(
  chartProps: CarouselChartProps,
): CarouselChartTransformedProps {
  const {
    formData,
    rawFormData,
    queriesData,
    width,
    height,
    hooks,
    onContextMenu,
    ...rest
  } = chartProps;

  // Extract carousel-specific form data
  const {
    view_mode = 'carousel',
    gallery_size = 6,
    image_url_column,
    name_column,
    description_column,
    cta_label_column,
    cta_link_column,
  } = rawFormData;

  // Get data from queries
  const data = queriesData?.[0]?.data || [];

  // Transform data into carousel items
  const carouselItems: CarouselItem[] = data
    .filter((record: DataRecord) => {
      // Filter out records without required image URL
      return image_url_column && record[image_url_column];
    })
    .map((record: DataRecord) => ({
      imageUrl: String(record[image_url_column] || ''),
      name: name_column ? String(record[name_column] || '') : '',
      description: description_column && record[description_column] ? String(record[description_column]) : undefined,
      ctaLabel: cta_label_column && record[cta_label_column] ? String(record[cta_label_column]) : undefined,
      ctaLink: cta_link_column && record[cta_link_column] ? String(record[cta_link_column]) : undefined,
    }));

  return {
    width,
    height,
    viewMode: view_mode as 'table' | 'carousel',
    gallerySize: gallery_size,
    imageUrlColumn: image_url_column,
    nameColumn: name_column,
    descriptionColumn: description_column,
    ctaLabelColumn: cta_label_column,
    ctaLinkColumn: cta_link_column,
    carouselItems,
    // Add other required props for compatibility
    data: data as DataRecord[],
    columns: [],
    metrics: [],
    percentMetrics: [],
    pageSize: 0,
    showCellBars: false,
    sortDesc: false,
    includeSearch: false,
    alignPositiveNegative: false,
    colorPositiveNegative: false,
    tableTimestampFormat: '',
    filters: {},
    emitCrossFilters: false,
    onChangeFilter: undefined,
    columnColorFormatters: [],
    allowRearrangeColumns: false,
    allowRenderHtml: true,
    onContextMenu: undefined,
    isUsingTimeComparison: false,
    basicColorFormatters: [],
    basicColorColumnFormatters: [],
    startDateOffset: '',
    hyperlinkConfigs: { enabled: false, configs: [] },
    serverPagination: false,
    serverPaginationData: { pageSize: 0, currentPage: 0 },
    setDataMask: () => {},
    isRawRecords: false,
    rowCount: data.length,
    totals: {},
    timeGrain: undefined as any,
  };
}
