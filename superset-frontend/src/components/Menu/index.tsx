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
import { addAlpha, styled } from '@superset-ui/core';
import { ReactElement } from 'react';
import { Menu as AntdMenu } from 'antd-v5';
import { MenuProps as AntdMenuProps } from 'antd-v5/es/menu';

export type MenuProps = AntdMenuProps;

export enum MenuItemKeyEnum {
  MenuItem = 'menu-item',
  SubMenu = 'submenu',
  SubMenuItem = 'submenu-item',
}

export type AntdMenuTypeRef = {
  current: { props: { parentMenu: typeof AntdMenu } };
};

export type AntdMenuItemType = ReactElement & {
  ref: AntdMenuTypeRef;
  type: { displayName: string; isSubMenu: number };
};

export type MenuItemChildType = AntdMenuItemType;

const StyledMenuItem = styled(AntdMenu.Item)`
  a {
    text-decoration: none;
  }
  &.antd5-menu-item {
    div {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    a {
      transition: background-color ${({ theme }) => theme.transitionTiming}s;
      &:after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        width: 0;
        height: 3px;
        opacity: 0;
        transform: translateX(-50%);
        transition: all ${({ theme }) => theme.transitionTiming}s;
        background-color: ${({ theme }) => theme.colors.primary.base};
      }
      &:focus {
        @media (max-width: 767px) {
          background-color: ${({ theme }) => theme.colors.primary.light5};
        }
      }
    }
  }
`;

// TODO: @geido - Move this to theme after fully migrating dropdown to Antd5
const StyledMenu = styled(AntdMenu)`
  ${({ theme }) => `
    &.antd5-menu-horizontal {
      background-color: inherit;
      border-bottom: 1px solid transparent;
    }
    &.antd5-menu-vertical,
    &.ant-dropdown-menu {
      min-width: 200px;
      border-radius: ${theme.borderRadius}px;
      box-shadow:
        0 3px 6px -4px ${addAlpha(theme.colors.grayscale.dark2, 0.12)},
        0 6px 16px 0 ${addAlpha(theme.colors.grayscale.dark2, 0.08)},
        0 9px 28px 8px ${addAlpha(theme.colors.grayscale.dark2, 0.05)};
      border: 1px solid ${theme.colors.grayscale.light2};
      background-color: ${theme.colors.grayscale.light5};
      overflow: hidden;
      
      /* Fix for submenu arrow positioning */
      .antd5-menu-submenu-arrow {
        position: absolute;
        right: ${theme.gridUnit * 2}px;
        top: 50%;
        transform: translateY(-50%);
      }
      
      /* Improve menu item group styling */
      .antd5-menu-item-group-title {
        color: ${theme.colors.grayscale.base};
        font-weight: ${theme.typography.weights.bold};
        font-size: ${theme.typography.sizes.s}px;
        padding: ${theme.gridUnit * 2}px ${theme.gridUnit * 4}px ${theme.gridUnit}px;
        line-height: 1.4;
      }
      
      /* Enhanced menu item styling */
      .antd5-menu-item {
        padding: ${theme.gridUnit * 1.5}px ${theme.gridUnit * 4}px;
        margin: 0;
        line-height: 1.4;
        
        &:hover {
          background-color: ${theme.colors.primary.light5};
        }
        
        a {
          color: ${theme.colors.grayscale.dark1};
          text-decoration: none;
          
          &:hover {
            color: ${theme.colors.primary.base};
          }
        }
      }
      
      /* Fix divider styling */
      .antd5-menu-item-divider {
        margin: ${theme.gridUnit}px 0;
        background-color: ${theme.colors.grayscale.light2};
        height: 1px;
      }
    }
    `}
`;

const StyledNav = styled(AntdMenu)`
  display: flex;
  align-items: center;
  height: 100%;
  gap: 0;
  &.antd5-menu-horizontal > .antd5-menu-item {
    height: 100%;
    display: flex;
    align-items: center;
    margin: 0;
    border-bottom: 2px solid transparent;
    padding: ${({ theme }) => theme.gridUnit * 2}px
      ${({ theme }) => theme.gridUnit * 4}px;
    &:hover {
      background-color: ${({ theme }) => theme.colors.primary.light5};
      border-bottom: 2px solid transparent;
      & a:after {
        opacity: 1;
        width: 100%;
      }
    }
  }
  &.antd5-menu-horizontal > .antd5-menu-item-selected {
    box-sizing: border-box;
    border-bottom: 2px solid ${({ theme }) => theme.colors.primary.base};
  }
`;

const StyledSubMenu = styled(AntdMenu.SubMenu)`
  .antd5-menu-submenu-open,
  .antd5-menu-submenu-active {
    .antd5-menu-submenu-title {
      &:after {
        opacity: 1;
        width: calc(100% - 1);
      }
    }
  }
  .antd5-menu-submenu-title {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    padding: ${({ theme }) => theme.gridUnit * 2}px
      ${({ theme }) => theme.gridUnit * 4}px;

    &:after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 50%;
      width: 0;
      height: 3px;
      opacity: 0;
      transform: translateX(-50%);
      transition: all ${({ theme }) => theme.transitionTiming}s;
    }

    /* Fix icon alignment and size */
    .anticon {
      margin-left: ${({ theme }) => theme.gridUnit}px;
      font-size: ${({ theme }) => theme.typography.sizes.s}px;
    }
  }

  .ant-dropdown-menu-submenu-arrow:before,
  .ant-dropdown-menu-submenu-arrow:after {
    content: none !important;
  }

  /* Ensure proper dropdown positioning */
  &.antd5-menu-submenu-horizontal {
    .antd5-menu-submenu-popup {
      top: 100% !important;
      border-radius: ${({ theme }) => theme.borderRadius}px;
      box-shadow:
        0 3px 6px -4px ${({ theme }) => addAlpha(theme.colors.grayscale.dark2, 0.12)},
        0 6px 16px 0
          ${({ theme }) => addAlpha(theme.colors.grayscale.dark2, 0.08)},
        0 9px 28px 8px
          ${({ theme }) => addAlpha(theme.colors.grayscale.dark2, 0.05)};
    }
  }
`;

export type MenuMode = AntdMenuProps['mode'];
export type MenuItem = Required<AntdMenuProps>['items'][number];

export const Menu = Object.assign(StyledMenu, {
  Item: StyledMenuItem,
  SubMenu: StyledSubMenu,
  Divider: AntdMenu.Divider,
  ItemGroup: AntdMenu.ItemGroup,
});

export const MainNav = Object.assign(StyledNav, {
  Item: StyledMenuItem,
  SubMenu: StyledSubMenu,
  Divider: AntdMenu.Divider,
  ItemGroup: AntdMenu.ItemGroup,
});
