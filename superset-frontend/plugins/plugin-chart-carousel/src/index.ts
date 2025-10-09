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
import { Behavior, ChartMetadata, ChartPlugin, t } from '@superset-ui/core';
import transformProps from './transformProps';
import controlPanel from './controlPanel';
// import buildQuery from '../plugin-chart-table/src/buildQuery';
import { CarouselChartFormData, CarouselChartProps } from './types';

// Import images for examples
import thumbnail from './images/thumbnail.svg';
import example1 from './images/example1.svg';
import example2 from './images/example2.svg';

// must export something for the module to be exist in dev mode
export { default as __hack__ } from './types';
export * from './types';

const metadata = new ChartMetadata({
  behaviors: [
    Behavior.InteractiveChart,
    Behavior.DrillToDetail,
    Behavior.DrillBy,
  ],
  category: t('Table'),
  canBeAnnotationTypes: ['EVENT', 'INTERVAL'],
  description: t(
    'A carousel/gallery chart that displays images in a grid layout with the ability to view them in a full-screen modal carousel. Extends the table chart functionality.',
  ),
  exampleGallery: [{ url: example1 }, { url: example2 }],
  name: t('Carousel'),
  tags: [
    t('Additive'),
    t('Business'),
    t('Pattern'),
    t('Featured'),
    t('Report'),
    t('Sequential'),
    t('Tabular'),
    t('Gallery'),
    t('Images'),
  ],
  thumbnail,
});

export default class CarouselChartPlugin extends ChartPlugin<
  CarouselChartFormData,
  CarouselChartProps
> {
  constructor() {
    super({
      loadChart: () => import('./CarouselChart'),
      metadata,
      transformProps,
      controlPanel,
      // buildQuery: undefined, // Use default buildQuery
    });
  }
}
