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
  ChartProps,
  DataRecord,
  QueryFormData,
  SetDataMaskHook,
  ChartDataResponseResult,
} from '@superset-ui/core';
import { TableChartFormData, TableChartTransformedProps } from '@superset-ui/plugin-chart-table';

export type CarouselViewMode = 'table' | 'carousel';

export interface CarouselItem {
  imageUrl: string;
  name: string;
  description?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export type CarouselChartFormData = TableChartFormData & {
  view_mode?: CarouselViewMode;
  gallery_size?: number;
  image_url_column?: string;
  name_column?: string;
  description_column?: string;
  cta_label_column?: string;
  cta_link_column?: string;
};

export interface CarouselChartProps extends ChartProps {
  rawFormData: CarouselChartFormData;
  queriesData: ChartDataResponseResult[];
}

export interface CarouselChartTransformedProps extends TableChartTransformedProps {
  viewMode: CarouselViewMode;
  gallerySize: number;
  imageUrlColumn?: string;
  nameColumn?: string;
  descriptionColumn?: string;
  ctaLabelColumn?: string;
  ctaLinkColumn?: string;
  carouselItems: CarouselItem[];
}

export default {};
