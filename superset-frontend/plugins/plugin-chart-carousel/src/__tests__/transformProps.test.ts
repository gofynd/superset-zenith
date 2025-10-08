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
import transformProps from '../transformProps';
import { CarouselChartProps, CarouselItem } from '../types';

const mockChartProps: CarouselChartProps = {
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
  },
  queriesData: [
    {
      data: [
        {
          image_url: 'https://example.com/image1.jpg',
          name: 'Test Image 1',
          description: 'Test description 1',
          cta_label: 'Learn More',
          cta_link: 'https://example.com/details1',
        },
        {
          image_url: 'https://example.com/image2.jpg',
          name: 'Test Image 2',
          description: 'Test description 2',
          cta_label: 'View Details',
          cta_link: 'https://example.com/details2',
        },
        {
          image_url: 'https://example.com/image3.jpg',
          name: 'Test Image 3',
          // Missing description and CTA
        },
        {
          // Missing image_url - should be filtered out
          name: 'Invalid Item',
          description: 'This should not appear',
        },
      ],
    },
  ],
  hooks: {},
  onContextMenu: undefined,
};

describe('transformProps', () => {
  it('transforms props correctly with complete data', () => {
    const result = transformProps(mockChartProps);

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.viewMode).toBe('carousel');
    expect(result.gallerySize).toBe(6);
    expect(result.imageUrlColumn).toBe('image_url');
    expect(result.nameColumn).toBe('name');
    expect(result.descriptionColumn).toBe('description');
    expect(result.ctaLabelColumn).toBe('cta_label');
    expect(result.ctaLinkColumn).toBe('cta_link');
  });

  it('transforms carousel items correctly', () => {
    const result = transformProps(mockChartProps);

    expect(result.carouselItems).toHaveLength(3); // One item filtered out due to missing image_url

    const expectedItems: CarouselItem[] = [
      {
        imageUrl: 'https://example.com/image1.jpg',
        name: 'Test Image 1',
        description: 'Test description 1',
        ctaLabel: 'Learn More',
        ctaLink: 'https://example.com/details1',
      },
      {
        imageUrl: 'https://example.com/image2.jpg',
        name: 'Test Image 2',
        description: 'Test description 2',
        ctaLabel: 'View Details',
        ctaLink: 'https://example.com/details2',
      },
      {
        imageUrl: 'https://example.com/image3.jpg',
        name: 'Test Image 3',
        description: undefined,
        ctaLabel: undefined,
        ctaLink: undefined,
      },
    ];

    expect(result.carouselItems).toEqual(expectedItems);
  });

  it('handles missing optional columns', () => {
    const propsWithoutOptionalColumns = {
      ...mockChartProps,
      rawFormData: {
        ...mockChartProps.rawFormData,
        description_column: undefined,
        cta_label_column: undefined,
        cta_link_column: undefined,
      },
    };

    const result = transformProps(propsWithoutOptionalColumns);

    expect(result.descriptionColumn).toBeUndefined();
    expect(result.ctaLabelColumn).toBeUndefined();
    expect(result.ctaLinkColumn).toBeUndefined();

    // All items should have undefined optional fields
    result.carouselItems.forEach(item => {
      expect(item.description).toBeUndefined();
      expect(item.ctaLabel).toBeUndefined();
      expect(item.ctaLink).toBeUndefined();
    });
  });

  it('handles empty data array', () => {
    const propsWithEmptyData = {
      ...mockChartProps,
      queriesData: [{ data: [] }],
    };

    const result = transformProps(propsWithEmptyData);

    expect(result.carouselItems).toEqual([]);
    expect(result.data).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('handles missing queriesData', () => {
    const propsWithoutQueriesData = {
      ...mockChartProps,
      queriesData: [],
    };

    const result = transformProps(propsWithoutQueriesData);

    expect(result.carouselItems).toEqual([]);
    expect(result.data).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('handles undefined queriesData', () => {
    const propsWithUndefinedQueriesData = {
      ...mockChartProps,
      queriesData: undefined as any,
    };

    const result = transformProps(propsWithUndefinedQueriesData);

    expect(result.carouselItems).toEqual([]);
    expect(result.data).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('uses default values when form data is missing', () => {
    const propsWithMinimalFormData = {
      ...mockChartProps,
      rawFormData: {},
    };

    const result = transformProps(propsWithMinimalFormData);

    expect(result.viewMode).toBe('carousel');
    expect(result.gallerySize).toBe(6);
    expect(result.imageUrlColumn).toBeUndefined();
    expect(result.nameColumn).toBeUndefined();
  });

  it('filters out items without image_url', () => {
    const propsWithInvalidItems = {
      ...mockChartProps,
      queriesData: [
        {
          data: [
            { image_url: 'https://example.com/valid.jpg', name: 'Valid Item' },
            { name: 'Invalid Item 1' }, // No image_url
            { image_url: '', name: 'Invalid Item 2' }, // Empty image_url
            { image_url: null, name: 'Invalid Item 3' }, // Null image_url
          ],
        },
      ],
    };

    const result = transformProps(propsWithInvalidItems);

    expect(result.carouselItems).toHaveLength(1);
    expect(result.carouselItems[0].name).toBe('Valid Item');
  });

  it('converts all values to strings', () => {
    const propsWithNonStringValues = {
      ...mockChartProps,
      queriesData: [
        {
          data: [
            {
              image_url: 123, // Number
              name: true, // Boolean
              description: null, // Null
              cta_label: undefined, // Undefined
              cta_link: 456, // Number
            },
          ],
        },
      ],
    };

    const result = transformProps(propsWithNonStringValues);

    expect(result.carouselItems[0].imageUrl).toBe('123');
    expect(result.carouselItems[0].name).toBe('true');
    expect(result.carouselItems[0].description).toBeUndefined();
    expect(result.carouselItems[0].ctaLabel).toBeUndefined();
    expect(result.carouselItems[0].ctaLink).toBe('456');
  });

  it('provides all required props for compatibility', () => {
    const result = transformProps(mockChartProps);

    // Check that all required props are present
    expect(result.data).toBeDefined();
    expect(result.columns).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.percentMetrics).toBeDefined();
    expect(result.pageSize).toBeDefined();
    expect(result.showCellBars).toBeDefined();
    expect(result.sortDesc).toBeDefined();
    expect(result.includeSearch).toBeDefined();
    expect(result.alignPositiveNegative).toBeDefined();
    expect(result.colorPositiveNegative).toBeDefined();
    expect(result.tableTimestampFormat).toBeDefined();
    expect(result.filters).toBeDefined();
    expect(result.emitCrossFilters).toBeDefined();
    expect(result.columnColorFormatters).toBeDefined();
    expect(result.allowRearrangeColumns).toBeDefined();
    expect(result.allowRenderHtml).toBeDefined();
    expect(result.isUsingTimeComparison).toBeDefined();
    expect(result.basicColorFormatters).toBeDefined();
    expect(result.basicColorColumnFormatters).toBeDefined();
    expect(result.startDateOffset).toBeDefined();
    expect(result.hyperlinkConfigs).toBeDefined();
    expect(result.serverPagination).toBeDefined();
    expect(result.serverPaginationData).toBeDefined();
    expect(result.setDataMask).toBeDefined();
    expect(result.isRawRecords).toBeDefined();
    expect(result.rowCount).toBeDefined();
    expect(result.totals).toBeDefined();
    expect(result.timeGrain).toBeUndefined();
  });
});
