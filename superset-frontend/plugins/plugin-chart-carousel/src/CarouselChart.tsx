/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 ( the
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
import React, { useState, useCallback, useMemo } from 'react';
import { styled, css, t, useTheme } from '@superset-ui/core';
import { Modal, Button, Carousel as AntCarousel } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
// import TableChart from '../plugin-chart-table/src/TableChart';
import { CarouselChartTransformedProps, CarouselItem } from './types';

const CarouselContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const GalleryContainer = styled.div`
  display: grid;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const GalleryItem = styled.div<{ columns: number }>`
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  ${({ columns }) => css`
    grid-template-columns: repeat(${columns}, 1fr);
  `}
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
`;

const ItemContent = styled.div`
  padding: 12px;
  background: white;
`;

const ItemName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
`;

const ItemDescription = styled.p`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CTAButton = styled(Button)`
  width: 100%;
  margin-top: 8px;
`;

const ViewAllButton = styled(Button)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    color: white;
  }
`;

const ModalCarousel = styled.div`
  .ant-carousel .slick-dots {
    bottom: 20px;
  }
  
  .ant-carousel .slick-dots li button {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
  }
  
  .ant-carousel .slick-dots li.slick-active button {
    background: white;
  }
`;

const SlideContainer = styled.div`
  position: relative;
  height: 70vh;
  display: flex;
  flex-direction: column;
`;

const SlideImageContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  overflow: hidden;
`;

const SlideImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const SlideContent = styled.div`
  padding: 24px;
  background: white;
  border-top: 1px solid #f0f0f0;
`;

const SlideName = styled.h2`
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
`;

const SlideDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #666;
  line-height: 1.6;
`;

const NavigationButton = styled(Button)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }
  
  &.prev {
    left: 16px;
  }
  
  &.next {
    right: 16px;
  }
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  font-size: 16px;
`;

export default function CarouselChart(props: CarouselChartTransformedProps) {
  const {
    viewMode,
    gallerySize,
    carouselItems,
    ...tableProps
  } = props;

  const theme = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // For now, always render carousel view
  // TODO: Add table view support if needed

  // Calculate grid columns based on gallery size
  const getGridColumns = useCallback((size: number) => {
    if (size <= 3) return 1;
    if (size <= 6) return 2;
    if (size <= 9) return 3;
    return 4;
  }, []);

  const gridColumns = getGridColumns(gallerySize);
  const displayItems = carouselItems.slice(0, gallerySize);

  const handleImageClick = useCallback((index: number) => {
    setCurrentSlide(index);
    setIsModalVisible(true);
  }, []);

  const handleViewAll = useCallback(() => {
    setCurrentSlide(0);
    setIsModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleSlideChange = useCallback((current: number) => {
    setCurrentSlide(current);
  }, []);

  const handleCTAClick = useCallback((link: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const renderGalleryItem = useCallback((item: CarouselItem, index: number) => (
    <GalleryItem
      key={index}
      columns={gridColumns}
      onClick={() => handleImageClick(index)}
    >
      <ImageContainer>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <ImagePlaceholder style={{ display: item.imageUrl ? 'none' : 'flex' }}>
          {t('No Image')}
        </ImagePlaceholder>
      </ImageContainer>
      <ItemContent>
        <ItemName>{item.name || t('Untitled')}</ItemName>
        {item.description && (
          <ItemDescription>{item.description}</ItemDescription>
        )}
        {item.ctaLabel && item.ctaLink && (
          <CTAButton
            type="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleCTAClick(item.ctaLink!);
            }}
          >
            {item.ctaLabel}
          </CTAButton>
        )}
      </ItemContent>
    </GalleryItem>
  ), [gridColumns, handleImageClick, handleCTAClick]);

  const renderSlide = useCallback((item: CarouselItem, index: number) => (
    <SlideContainer key={index}>
      <SlideImageContainer>
        {item.imageUrl ? (
          <SlideImage
            src={item.imageUrl}
            alt={item.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <ImagePlaceholder style={{ display: item.imageUrl ? 'none' : 'flex' }}>
          {t('No Image')}
        </ImagePlaceholder>
      </SlideImageContainer>
      <SlideContent>
        <SlideName>{item.name || t('Untitled')}</SlideName>
        {item.description && (
          <SlideDescription>{item.description}</SlideDescription>
        )}
        {item.ctaLabel && item.ctaLink && (
          <CTAButton
            type="primary"
            size="large"
            onClick={() => handleCTAClick(item.ctaLink!)}
          >
            {item.ctaLabel}
          </CTAButton>
        )}
      </SlideContent>
    </SlideContainer>
  ), [handleCTAClick]);

  if (carouselItems.length === 0) {
    return (
      <CarouselContainer>
        <EmptyState>
          <div>{t('No carousel items found')}</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            {t('Please configure the column mappings in the control panel')}
          </div>
        </EmptyState>
      </CarouselContainer>
    );
  }

  return (
    <CarouselContainer>
      <GalleryContainer
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        }}
      >
        {displayItems.map(renderGalleryItem)}
        {carouselItems.length > gallerySize && (
          <GalleryItem
            columns={gridColumns}
            onClick={handleViewAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <EyeOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <div>{t('View All')}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {t('{{count}} items', { count: carouselItems.length })}
              </div>
            </div>
          </GalleryItem>
        )}
      </GalleryContainer>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
        closable={false}
      >
        <ModalCarousel>
          <AntCarousel
            afterChange={handleSlideChange}
            initialSlide={currentSlide}
            arrows
            prevArrow={<NavigationButton className="prev" icon={<LeftOutlined />} />}
            nextArrow={<NavigationButton className="next" icon={<RightOutlined />} />}
          >
            {carouselItems.map(renderSlide)}
          </AntCarousel>
          <CloseButton
            icon={<CloseOutlined />}
            onClick={handleModalClose}
          />
        </ModalCarousel>
      </Modal>
    </CarouselContainer>
  );
}
