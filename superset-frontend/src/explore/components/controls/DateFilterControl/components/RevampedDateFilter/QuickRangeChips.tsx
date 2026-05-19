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
import { css, styled } from '@superset-ui/core';
import { QuickRangeOption } from './types';

const ChipGrid = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.gridUnit * 1.5}px;
    margin-bottom: ${theme.gridUnit * 4}px;
    margin-top: ${theme.gridUnit * 3}px;
  `}
`;

const ChipButton = styled.button<{ $active: boolean }>`
  ${({ $active, theme }) => css`
    align-items: center;
    background: ${$active
      ? theme.colors.grayscale.light4
      : theme.colors.grayscale.light5};
    border: 1px solid ${theme.colors.grayscale.light2};
    border-radius: 999px;
    color: ${theme.colors.grayscale.dark1};
    cursor: pointer;
    display: flex;
    font-family: ${theme.typography.families.sansSerif};
    font-size: ${theme.typography.sizes.m}px;
    font-weight: ${theme.typography.weights.normal};
    justify-content: flex-start;
    line-height: ${theme.gridUnit * 5}px;
    min-height: ${theme.gridUnit * 7}px;
    padding: ${theme.gridUnit * 0.5}px ${theme.gridUnit * 2}px
      ${theme.gridUnit * 0.5}px ${theme.gridUnit * 3}px;
    touch-action: manipulation;
    width: fit-content;

    &:hover,
    &:active {
      background: ${theme.colors.grayscale.light3};
      border-style: solid;
    }

    &:focus-visible {
      border-style: solid;
      outline: 2px solid ${theme.colors.primary.light2};
      outline-offset: ${theme.gridUnit * 0.5}px;
    }
  `}
`;

type QuickRangeChipsProps = {
  activeValue: string;
  options: QuickRangeOption[];
  onSelect: (option: QuickRangeOption) => void;
};

export function QuickRangeChips({
  activeValue,
  options,
  onSelect,
}: QuickRangeChipsProps) {
  return (
    <ChipGrid data-test="revamped-date-filter-chips">
      {options.map(option => (
        <ChipButton
          key={option.value}
          type="button"
          $active={activeValue === option.value}
          aria-pressed={activeValue === option.value}
          onClick={() => onSelect(option)}
        >
          {option.label}
        </ChipButton>
      ))}
    </ChipGrid>
  );
}
