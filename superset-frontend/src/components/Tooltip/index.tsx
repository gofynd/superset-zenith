/* eslint-disable import/no-duplicates */
import { supersetTheme } from '@superset-ui/core';
import { Tooltip as AntdTooltip } from 'antd';
import type { TooltipProps as AntdTooltipProps } from 'antd/es/tooltip';
import type { TooltipPlacement } from 'antd/es/tooltip';

/**
 * Extend AntD's TooltipProps by intersecting with our extra props.
 * This works because AntdTooltipProps is a union type.
 */
export type TooltipProps = AntdTooltipProps & {
  overlayStyle?: React.CSSProperties;
  arrow?: boolean | { pointAtCenter?: boolean };
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (visible: boolean) => void;
};

export type { TooltipPlacement };

export const Tooltip = ({ overlayStyle, ...props }: TooltipProps) => (
  <AntdTooltip
    overlayInnerStyle={{
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
    overlayStyle={overlayStyle}
    color={`${supersetTheme.colors.grayscale.dark2}e6`}
    {...props}
  />
);
