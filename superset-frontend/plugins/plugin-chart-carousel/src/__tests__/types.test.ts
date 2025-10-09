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
  CarouselViewMode,
  CarouselItem,
  CarouselChartFormData,
  CarouselChartProps,
  CarouselChartTransformedProps,
} from '../types';

describe('Types', () => {
  describe('CarouselViewMode', () => {
    it('has correct values', () => {
      const tableMode: CarouselViewMode = 'table';
      const carouselMode: CarouselViewMode = 'carousel';
      
      expect(tableMode).toBe('table');
      expect(carouselMode).toBe('carousel');
    });
  });

  describe('CarouselItem', () => {
    it('can be created with required fields only', () => {
      const item: CarouselItem = {
        imageUrl: 'https://example.com/image.jpg',
        name: 'Test Image',
      };
      
      expect(item.imageUrl).toBe('https://example.com/image.jpg');
      expect(item.name).toBe('Test Image');
      expect(item.description).toBeUndefined();
      expect(item.ctaLabel).toBeUndefined();
      expect(item.ctaLink).toBeUndefined();
    });

    it('can be created with all fields', () => {
      const item: CarouselItem = {
        imageUrl: 'https://example.com/image.jpg',
        name: 'Test Image',
        description: 'Test description',
        ctaLabel: 'Learn More',
        ctaLink: 'https://example.com/details',
      };
      
      expect(item.imageUrl).toBe('https://example.com/image.jpg');
      expect(item.name).toBe('Test Image');
      expect(item.description).toBe('Test description');
      expect(item.ctaLabel).toBe('Learn More');
      expect(item.ctaLink).toBe('https://example.com/details');
    });
  });

  describe('CarouselChartFormData', () => {
    it('extends base form data with carousel-specific fields', () => {
      const formData: CarouselChartFormData = {
        view_mode: 'carousel',
        gallery_size: 6,
        image_url_column: 'image_url',
        name_column: 'name',
        description_column: 'description',
        cta_label_column: 'cta_label',
        cta_link_column: 'cta_link',
        // Base form data fields
        datasource: '1',
        viz_type: 'carousel',
        slice_id: 1,
        url_params: {},
        granularity_sqla: 'ds',
        time_range: 'No filter',
        adhoc_filters: [],
        groupby: [],
        row_limit: 1000,
      };
      
      expect(formData.view_mode).toBe('carousel');
      expect(formData.gallery_size).toBe(6);
      expect(formData.image_url_column).toBe('image_url');
      expect(formData.name_column).toBe('name');
      expect(formData.description_column).toBe('description');
      expect(formData.cta_label_column).toBe('cta_label');
      expect(formData.cta_link_column).toBe('cta_link');
    });

    it('allows optional carousel fields to be undefined', () => {
      const formData: CarouselChartFormData = {
        datasource: '1',
        viz_type: 'carousel',
        slice_id: 1,
        url_params: {},
        granularity_sqla: 'ds',
        time_range: 'No filter',
        adhoc_filters: [],
        groupby: [],
        row_limit: 1000,
      };
      
      expect(formData.view_mode).toBeUndefined();
      expect(formData.gallery_size).toBeUndefined();
      expect(formData.image_url_column).toBeUndefined();
      expect(formData.name_column).toBeUndefined();
      expect(formData.description_column).toBeUndefined();
      expect(formData.cta_label_column).toBeUndefined();
      expect(formData.cta_link_column).toBeUndefined();
    });
  });

  describe('CarouselChartProps', () => {
    it('extends base chart props with carousel-specific fields', () => {
      const props: CarouselChartProps = {
        width: 800,
        height: 600,
        formData: {},
        rawFormData: {
          view_mode: 'carousel',
          gallery_size: 6,
          image_url_column: 'image_url',
          name_column: 'name',
          description_column: 'description',
          cta_label_column: 'cta_label',
          cta_link_column: 'cta_link',
          datasource: '1',
          viz_type: 'carousel',
          slice_id: 1,
          url_params: {},
          granularity_sqla: 'ds',
          time_range: 'No filter',
          adhoc_filters: [],
          groupby: [],
          row_limit: 1000,
        },
        queriesData: [
          {
            data: [
              {
                image_url: 'https://example.com/image.jpg',
                name: 'Test Image',
                description: 'Test description',
                cta_label: 'Learn More',
                cta_link: 'https://example.com/details',
              },
            ],
          },
        ],
        hooks: {},
        onContextMenu: undefined,
      };
      
      expect(props.width).toBe(800);
      expect(props.height).toBe(600);
      expect(props.rawFormData.view_mode).toBe('carousel');
      expect(props.queriesData).toHaveLength(1);
    });
  });

  describe('CarouselChartTransformedProps', () => {
    it('includes all required props for carousel functionality', () => {
      const props: CarouselChartTransformedProps = {
        width: 800,
        height: 600,
        viewMode: 'carousel',
        gallerySize: 6,
        imageUrlColumn: 'image_url',
        nameColumn: 'name',
        descriptionColumn: 'description',
        ctaLabelColumn: 'cta_label',
        ctaLinkColumn: 'cta_link',
        carouselItems: [
          {
            imageUrl: 'https://example.com/image.jpg',
            name: 'Test Image',
            description: 'Test description',
            ctaLabel: 'Learn More',
            ctaLink: 'https://example.com/details',
          },
        ],
        // Required compatibility props
        data: [],
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
        rowCount: 1,
        totals: {},
        timeGrain: undefined,
      };
      
      expect(props.width).toBe(800);
      expect(props.height).toBe(600);
      expect(props.viewMode).toBe('carousel');
      expect(props.gallerySize).toBe(6);
      expect(props.carouselItems).toHaveLength(1);
      expect(props.carouselItems[0].imageUrl).toBe('https://example.com/image.jpg');
    });
  });
});
