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

import { iconUpload, iconUrl } from '../sharedControls';

describe('Icon Validation', () => {
  describe('File Upload Validation', () => {
    const fileUploadValidator = iconUpload.config.validators?.[0];

    it('should return undefined for null file', () => {
      expect(fileUploadValidator?.(null)).toBeUndefined();
    });

    it('should return undefined for undefined file', () => {
      expect(fileUploadValidator?.(undefined)).toBeUndefined();
    });

    it('should validate PNG files', () => {
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(pngFile, 'size', { value: 50000 });
      expect(fileUploadValidator?.(pngFile)).toBeUndefined();
    });

    it('should validate JPEG files', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(jpegFile, 'size', { value: 50000 });
      expect(fileUploadValidator?.(jpegFile)).toBeUndefined();
    });

    it('should validate JPG files', () => {
      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpg' });
      Object.defineProperty(jpgFile, 'size', { value: 50000 });
      expect(fileUploadValidator?.(jpgFile)).toBeUndefined();
    });

    it('should validate SVG files', () => {
      const svgFile = new File([''], 'test.svg', { type: 'image/svg+xml' });
      Object.defineProperty(svgFile, 'size', { value: 50000 });
      expect(fileUploadValidator?.(svgFile)).toBeUndefined();
    });

    it('should validate GIF files', () => {
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(gifFile, 'size', { value: 50000 });
      expect(fileUploadValidator?.(gifFile)).toBeUndefined();
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(invalidFile, 'size', { value: 50000 });
      const result = fileUploadValidator?.(invalidFile);
      expect(result).toContain('Invalid file type');
    });

    it('should reject files that are too large', () => {
      const largeFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB
      const result = fileUploadValidator?.(largeFile);
      expect(result).toContain('File size too large');
    });

    it('should reject files that are too small', () => {
      const smallFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(smallFile, 'size', { value: 500 }); // 500 bytes
      const result = fileUploadValidator?.(smallFile);
      expect(result).toContain('File size too small');
    });

    it('should accept files at the minimum size limit', () => {
      const minSizeFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(minSizeFile, 'size', { value: 1024 }); // 1KB
      expect(fileUploadValidator?.(minSizeFile)).toBeUndefined();
    });

    it('should accept files at the maximum size limit', () => {
      const maxSizeFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(maxSizeFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB
      expect(fileUploadValidator?.(maxSizeFile)).toBeUndefined();
    });
  });

  describe('URL Validation', () => {
    const urlValidator = iconUrl.config.validators?.[0];

    it('should return undefined for empty string', () => {
      expect(urlValidator?.('')).toBeUndefined();
    });

    it('should return undefined for null', () => {
      expect(urlValidator?.(null as any)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(urlValidator?.(undefined as any)).toBeUndefined();
    });

    it('should validate HTTP URLs with image extensions', () => {
      const validUrls = [
        'http://example.com/image.png',
        'http://example.com/image.jpg',
        'http://example.com/image.jpeg',
        'http://example.com/image.svg',
        'http://example.com/image.gif',
        'http://example.com/image.webp',
      ];

      validUrls.forEach(url => {
        expect(urlValidator?.(url)).toBeUndefined();
      });
    });

    it('should validate HTTPS URLs with image extensions', () => {
      const validUrls = [
        'https://example.com/image.png',
        'https://example.com/image.jpg',
        'https://example.com/image.jpeg',
        'https://example.com/image.svg',
        'https://example.com/image.gif',
        'https://example.com/image.webp',
      ];

      validUrls.forEach(url => {
        expect(urlValidator?.(url)).toBeUndefined();
      });
    });

    it('should reject non-HTTP/HTTPS URLs', () => {
      const invalidUrls = [
        'ftp://example.com/image.png',
        'file:///path/to/image.png',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      ];

      invalidUrls.forEach(url => {
        const result = urlValidator?.(url);
        expect(result).toContain('valid HTTP or HTTPS URL');
      });
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'https://',
        'http://example',
        'just-text',
      ];

      malformedUrls.forEach(url => {
        const result = urlValidator?.(url);
        expect(result).toContain('valid URL');
      });
    });

    it('should reject URLs without image extensions', () => {
      const nonImageUrls = [
        'https://example.com/page.html',
        'https://example.com/data.json',
        'https://example.com/document.pdf',
        'https://example.com/script.js',
        'https://example.com/style.css',
      ];

      nonImageUrls.forEach(url => {
        const result = urlValidator?.(url);
        expect(result).toContain('point to an image file');
      });
    });

    it('should accept URLs with image extensions in different positions', () => {
      const validUrls = [
        'https://example.com/path/to/image.png',
        'https://example.com/image.jpg?v=123',
        'https://example.com/image.jpeg#section',
        'https://example.com/api/image.svg?format=png',
      ];

      validUrls.forEach(url => {
        expect(urlValidator?.(url)).toBeUndefined();
      });
    });

    it('should be case insensitive for image extensions', () => {
      const validUrls = [
        'https://example.com/image.PNG',
        'https://example.com/image.JPG',
        'https://example.com/image.JPEG',
        'https://example.com/image.SVG',
        'https://example.com/image.GIF',
        'https://example.com/image.WEBP',
      ];

      validUrls.forEach(url => {
        expect(urlValidator?.(url)).toBeUndefined();
      });
    });
  });

  describe('Control Configuration', () => {
    it('should have correct file upload control configuration', () => {
      expect(iconUpload.name).toBe('icon_upload');
      expect(iconUpload.config.type).toBe('FileControl');
      expect(iconUpload.config.accept).toBe('.png,.jpg,.jpeg,.svg,.gif');
      expect(iconUpload.config.validators).toHaveLength(1);
    });

    it('should have correct URL control configuration', () => {
      expect(iconUrl.name).toBe('icon_url');
      expect(iconUrl.config.type).toBe('TextControl');
      expect(iconUrl.config.validators).toHaveLength(1);
    });

    it('should have proper visibility conditions', () => {
      const mockControls = {
        show_icon: { value: true },
        icon_type: { value: 'upload' }
      };

      expect(iconUpload.config.visibility?.(mockControls)).toBe(true);
      expect(iconUrl.config.visibility?.(mockControls)).toBe(false);

      mockControls.icon_type.value = 'url';
      expect(iconUpload.config.visibility?.(mockControls)).toBe(false);
      expect(iconUrl.config.visibility?.(mockControls)).toBe(true);

      mockControls.show_icon.value = false;
      expect(iconUpload.config.visibility?.(mockControls)).toBe(false);
      expect(iconUrl.config.visibility?.(mockControls)).toBe(false);
    });
  });
});
