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

import React from 'react';
import { styled, useTheme } from '@superset-ui/core';
import { LinkOutlined } from '@ant-design/icons';

interface ChipButtonProps {
  href: string;
  label: string;
  color?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
}

const StyledChipButton = styled.button<{ $color?: string }>`
  ${({ theme, $color }) => `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: none;
    border-radius: 16px;
    background-color: ${$color || theme.colors.primary.base};
    color: white;
    font-size: ${theme.typography.sizes.s}px;
    font-weight: ${theme.typography.weights.normal};
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    
    &:hover {
      background-color: ${$color ? `${$color}dd` : theme.colors.primary.dark1};
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    &:focus {
      outline: 2px solid ${theme.colors.primary.light2};
      outline-offset: 2px;
    }
    
    .chip-icon {
      font-size: 10px;
      opacity: 0.8;
    }
  `}
`;

const ChipButton: React.FC<ChipButtonProps> = ({
  href,
  label,
  color,
  onClick,
  className,
  showIcon = false,
  iconPosition = 'right',
}) => {
  const theme = useTheme();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(e);
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const icon = showIcon ? (
    <LinkOutlined className="chip-icon" />
  ) : null;

  return (
    <div className="dt-cell-chip">
      <StyledChipButton
        as="a"
        href={href}
        $color={color}
        onClick={handleClick}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {iconPosition === 'left' && icon}
        <span>{label}</span>
        {iconPosition === 'right' && icon}
      </StyledChipButton>
    </div>
  );
};

export default ChipButton;
