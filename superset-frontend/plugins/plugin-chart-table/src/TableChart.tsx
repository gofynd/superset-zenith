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
  CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  MouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import {
  ColumnInstance,
  ColumnWithLooseAccessor,
  DefaultSortTypes,
  Row,
} from 'react-table';
import { extent as d3Extent, max as d3Max } from 'd3-array';
import { FaSort } from '@react-icons/all-files/fa/FaSort';
import { FaSortDown as FaSortDesc } from '@react-icons/all-files/fa/FaSortDown';
import { FaSortUp as FaSortAsc } from '@react-icons/all-files/fa/FaSortUp';
import cx from 'classnames';
import {
  DataRecord,
  DataRecordValue,
  DTTM_ALIAS,
  ensureIsArray,
  GenericDataType,
  getSelectedText,
  getTimeFormatterForGranularity,
  BinaryQueryObjectFilterClause,
  styled,
  css,
  t,
  tn,
  useTheme,
} from '@superset-ui/core';
import { Dropdown, Menu, Tooltip } from '@superset-ui/chart-controls';
import {
  CheckOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  InfoCircleOutlined,
  DownOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { isEmpty, isNumber } from 'lodash';
import {
  ColorSchemeEnum,
  DataColumnMeta,
  HierarchyConfig,
  TableChartTransformedProps,
} from './types';
import DataTable, {
  DataTableProps,
  SearchInputProps,
  SelectPageSizeRendererProps,
  SizeOption,
} from './DataTable';

import Styles from './Styles';
import { formatColumnValue } from './utils/formatValue';
import { PAGE_SIZE_OPTIONS } from './consts';
import { updateExternalFormData } from './DataTable/utils/externalAPIs';
import getScrollBarSize from './DataTable/utils/getScrollBarSize';
import {
  validateAndFormatUrl,
  getHyperlinkDisplayText,
} from './utils/urlUtils';
import ChipButton from './components/ChipButton';

// Inline NewTabIcon component
const NewTabIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M0 0h48v48H0z" fill="none" />
    <g>
      <polygon
        points="44,30 40,30 40,38 8,38 8,10 20,10 20,6 4,6 4,42 44,42"
        fill="currentColor"
      />
      <polygon
        points="26,26.828 40,12.828 40,24 44,24 44,6 26,6 26,10 37.172,10 23.172,24"
        fill="currentColor"
      />
    </g>
  </svg>
);

type ValueRange = [number, number];

interface TableSize {
  width: number;
  height: number;
}

const ACTION_KEYS = {
  enter: 'Enter',
  spacebar: 'Spacebar',
  space: ' ',
};

const HIERARCHY_ROOT_PATH = '';
const HIERARCHY_LEVEL_KEY = '__table_hierarchy_level';
const HIERARCHY_PATH_KEY = '__table_hierarchy_path';
const HIERARCHY_CAN_EXPAND_KEY = '__table_hierarchy_can_expand';
const HIERARCHY_DIMENSION_KEY = '__table_hierarchy_dimension_key';

type HierarchyModel<D extends DataRecord> = {
  rows: D[];
  expandablePaths: string[];
  expandablePathsByLevel: Map<number, string[]>;
};

const getHierarchyPath = (values: DataRecordValue[]) =>
  JSON.stringify(
    values.map(value => (value instanceof Date ? value.toISOString() : value)),
  );

const getHierarchyLevelRowsFromLeaves = <D extends DataRecord>(
  data: D[],
  columns: DataColumnMeta[],
  hierarchy: HierarchyConfig,
) => {
  const metricColumns = columns.filter(
    column => !hierarchy.dimensionKeys.includes(column.key),
  );
  const rowsByLevel = hierarchy.dimensionKeys.map(() => new Map<string, D>());

  data.forEach(sourceRow => {
    hierarchy.dimensionKeys.forEach((_, level) => {
      const pathValues = hierarchy.dimensionKeys
        .slice(0, level + 1)
        .map(key => sourceRow[key]);
      const path = getHierarchyPath(pathValues);
      const rowsForLevel = rowsByLevel[level]!;
      let row = rowsForLevel.get(path);

      if (!row) {
        row = {} as D;
        hierarchy.dimensionKeys.slice(0, level + 1).forEach(key => {
          row![key] = sourceRow[key];
        });
        rowsForLevel.set(path, row!);
      }

      metricColumns.forEach(column => {
        const value = sourceRow[column.key];
        const currentValue = row![column.key];
        if (typeof value === 'number') {
          row![column.key] =
            (typeof currentValue === 'number' ? currentValue : 0) + value;
        } else if (currentValue === null || currentValue === undefined) {
          row![column.key] = value;
        }
      });
    });
  });

  return rowsByLevel.map(rows => Array.from(rows.values()));
};

const buildHierarchyModel = <D extends DataRecord>(
  data: D[],
  columns: DataColumnMeta[],
  hierarchy: HierarchyConfig,
  expandedPaths: Set<string>,
): HierarchyModel<D> => {
  const levelData =
    hierarchy.levelData?.length === hierarchy.dimensionKeys.length
      ? (hierarchy.levelData as D[][])
      : getHierarchyLevelRowsFromLeaves(data, columns, hierarchy);
  const nodes = new Map<string, D>();
  const childrenByPath = new Map<string, string[]>();
  const expandablePaths: string[] = [];
  const expandablePathsByLevel = new Map<number, string[]>();

  levelData.forEach((rows, level) => {
    rows.forEach(sourceRow => {
      const pathValues = hierarchy.dimensionKeys
        .slice(0, level + 1)
        .map(key => sourceRow[key]);

      if (pathValues.some(value => value === undefined)) {
        return;
      }

      const path = getHierarchyPath(pathValues);
      const parentPath =
        level === 0
          ? HIERARCHY_ROOT_PATH
          : getHierarchyPath(pathValues.slice(0, -1));
      const children = childrenByPath.get(parentPath) || [];
      if (!children.includes(path)) {
        children.push(path);
        childrenByPath.set(parentPath, children);
      }

      const dimensionKey = hierarchy.dimensionKeys[level];
      nodes.set(path, {
        ...sourceRow,
        [hierarchy.dimensionKeys[0]]: sourceRow[dimensionKey],
        [HIERARCHY_LEVEL_KEY]: level,
        [HIERARCHY_PATH_KEY]: path,
        [HIERARCHY_CAN_EXPAND_KEY]: false,
        [HIERARCHY_DIMENSION_KEY]: dimensionKey,
      });
    });
  });

  nodes.forEach((node, path) => {
    const level = Number(node[HIERARCHY_LEVEL_KEY]);
    const canExpand =
      level < hierarchy.dimensionKeys.length - 1 &&
      Boolean(childrenByPath.get(path)?.length);
    nodes.set(path, {
      ...node,
      [HIERARCHY_CAN_EXPAND_KEY]: canExpand,
    });

    if (canExpand) {
      expandablePaths.push(path);
      const pathsForLevel = expandablePathsByLevel.get(level) || [];
      pathsForLevel.push(path);
      expandablePathsByLevel.set(level, pathsForLevel);
    }
  });

  const rows: D[] = [];
  const appendRows = (parentPath: string) => {
    (childrenByPath.get(parentPath) || []).forEach(path => {
      const row = nodes.get(path);
      if (!row) {
        return;
      }
      rows.push(row);
      if (row[HIERARCHY_CAN_EXPAND_KEY] && expandedPaths.has(path)) {
        appendRows(path);
      }
    });
  };
  appendRows(HIERARCHY_ROOT_PATH);

  return {
    rows,
    expandablePaths,
    expandablePathsByLevel,
  };
};

const getExpandedHierarchyPathsToLevel = <D extends DataRecord>(
  model: HierarchyModel<D>,
  level: number,
) => {
  const expandedPaths = new Set<string>();
  model.expandablePathsByLevel.forEach((paths, nodeLevel) => {
    if (nodeLevel + 1 < level) {
      paths.forEach(path => expandedPaths.add(path));
    }
  });
  return expandedPaths;
};

/**
 * Return sortType based on data type
 */
function getSortTypeByDataType(dataType: GenericDataType): DefaultSortTypes {
  if (dataType === GenericDataType.Temporal) {
    return 'datetime';
  }
  if (dataType === GenericDataType.String) {
    return 'alphanumeric';
  }
  return 'basic';
}

/**
 * Cell background width calculation for horizontal bar chart
 */
function cellWidth({
  value,
  valueRange,
  alignPositiveNegative,
}: {
  value: number;
  valueRange: ValueRange;
  alignPositiveNegative: boolean;
}) {
  const [minValue, maxValue] = valueRange;
  if (alignPositiveNegative) {
    const perc = Math.abs(Math.round((value / maxValue) * 100));
    return perc;
  }
  const posExtent = Math.abs(Math.max(maxValue, 0));
  const negExtent = Math.abs(Math.min(minValue, 0));
  const tot = posExtent + negExtent;
  const perc2 = Math.round((Math.abs(value) / tot) * 100);
  return perc2;
}

/**
 * Cell left margin (offset) calculation for horizontal bar chart elements
 * when alignPositiveNegative is not set
 */
function cellOffset({
  value,
  valueRange,
  alignPositiveNegative,
}: {
  value: number;
  valueRange: ValueRange;
  alignPositiveNegative: boolean;
}) {
  if (alignPositiveNegative) {
    return 0;
  }
  const [minValue, maxValue] = valueRange;
  const posExtent = Math.abs(Math.max(maxValue, 0));
  const negExtent = Math.abs(Math.min(minValue, 0));
  const tot = posExtent + negExtent;
  return Math.round((Math.min(negExtent + value, negExtent) / tot) * 100);
}

/**
 * Cell background color calculation for horizontal bar chart
 */
function cellBackground({
  value,
  colorPositiveNegative = false,
}: {
  value: number;
  colorPositiveNegative: boolean;
}) {
  const r = colorPositiveNegative && value < 0 ? 150 : 0;
  return `rgba(${r},0,0,0.2)`;
}

function SortIcon<D extends object>({ column }: { column: ColumnInstance<D> }) {
  const { isSorted, isSortedDesc } = column;
  let sortIcon = <FaSort />;
  if (isSorted) {
    sortIcon = isSortedDesc ? <FaSortDesc /> : <FaSortAsc />;
  }
  return sortIcon;
}

function SearchInput({ count, value, onChange }: SearchInputProps) {
  return (
    <span className="dt-global-filter">
      {t('Search')}{' '}
      <input
        aria-label={t('Search %s records', count)}
        className="form-control input-sm"
        placeholder={tn('search.num_records', count)}
        value={value}
        onChange={onChange}
      />
    </span>
  );
}

function SelectPageSize({
  options,
  current,
  onChange,
}: SelectPageSizeRendererProps) {
  return (
    <span className="dt-select-page-size form-inline">
      {t('page_size.show')}{' '}
      <select
        className="form-control input-sm"
        value={current}
        onBlur={() => {}}
        onChange={e => {
          onChange(Number((e.target as HTMLSelectElement).value));
        }}
      >
        {options.map(option => {
          const [size, text] = Array.isArray(option)
            ? option
            : [option, option];
          const sizeLabel = size === 0 ? t('all') : size;
          return (
            <option
              aria-label={t('Show %s entries', sizeLabel)}
              key={size}
              value={size}
            >
              {text}
            </option>
          );
        })}
      </select>{' '}
      {t('page_size.entries')}
    </span>
  );
}

const getNoResultsMessage = (filter: string) =>
  filter ? t('No matching records found') : t('No records found');

export default function TableChart<D extends DataRecord = DataRecord>(
  props: TableChartTransformedProps<D> & {
    sticky?: DataTableProps<D>['sticky'];
  },
) {
  const {
    timeGrain,
    height,
    width,
    data,
    totals,
    isRawRecords,
    rowCount = 0,
    columns: columnsMeta,
    alignPositiveNegative: defaultAlignPN = false,
    colorPositiveNegative: defaultColorPN = false,
    includeSearch = false,
    pageSize = 0,
    serverPagination = false,
    serverPaginationData,
    setDataMask,
    showCellBars = true,
    sortDesc = false,
    filters,
    sticky = true, // whether to use sticky header
    columnColorFormatters,
    allowRearrangeColumns = false,
    allowRenderHtml = true,
    onContextMenu,
    emitCrossFilters,
    isUsingTimeComparison,
    basicColorFormatters,
    basicColorColumnFormatters,
    hyperlinkConfigs = { enabled: false, configs: [] },
    hierarchy,
  } = props;

  const comparisonColumns = [
    { key: 'all', label: t('Display all') },
    { key: '#', label: '#' },
    { key: '△', label: '△' },
    { key: '%', label: '%' },
  ];
  const timestampFormatter = useCallback(
    value => getTimeFormatterForGranularity(timeGrain)(value),
    [timeGrain],
  );
  const [tableSize, setTableSize] = useState<TableSize>({
    width: 0,
    height: 0,
  });
  // keep track of whether column order changed, so that column widths can too
  const [columnOrderToggle, setColumnOrderToggle] = useState(false);
  const [showComparisonDropdown, setShowComparisonDropdown] = useState(false);
  const [selectedComparisonColumns, setSelectedComparisonColumns] = useState([
    comparisonColumns[0].key,
  ]);
  const [hideComparisonKeys, setHideComparisonKeys] = useState<string[]>([]);
  const [expandedHierarchyPaths, setExpandedHierarchyPaths] = useState<
    Set<string>
  >(new Set());
  const [hierarchyLevelControlId] = useState(
    () => `dt-hierarchy-expand-level-${Math.random().toString(36).slice(2)}`,
  );
  const theme = useTheme();
  const hierarchyDimensionKey = hierarchy?.dimensionKeys.join('\t') || '';

  useEffect(() => {
    if (!hierarchy) {
      setExpandedHierarchyPaths(new Set());
      return;
    }

    const model = buildHierarchyModel(data, columnsMeta, hierarchy, new Set());
    setExpandedHierarchyPaths(
      getExpandedHierarchyPathsToLevel(model, hierarchy.defaultLevel),
    );
  }, [columnsMeta, data, hierarchy, hierarchyDimensionKey]);

  const hierarchyModel = useMemo(
    () =>
      hierarchy
        ? buildHierarchyModel(
            data,
            columnsMeta,
            hierarchy,
            expandedHierarchyPaths,
          )
        : undefined,
    [columnsMeta, data, expandedHierarchyPaths, hierarchy],
  );
  const tableData = hierarchyModel?.rows || data;

  // only take relevant page size options
  const pageSizeOptions = useMemo(() => {
    const getServerPagination = (n: number) => n <= rowCount;
    return PAGE_SIZE_OPTIONS.filter(([n]) =>
      serverPagination ? getServerPagination(n) : n <= 2 * tableData.length,
    ) as SizeOption[];
  }, [rowCount, serverPagination, tableData.length]);

  const getValueRange = useCallback(
    function getValueRange(key: string, alignPositiveNegative: boolean) {
      if (typeof tableData?.[0]?.[key] === 'number') {
        const nums = tableData.map(row => row[key]) as number[];
        return (
          alignPositiveNegative
            ? [0, d3Max(nums.map(Math.abs))]
            : d3Extent(nums)
        ) as ValueRange;
      }
      return null;
    },
    [tableData],
  );

  const isActiveFilterValue = useCallback(
    function isActiveFilterValue(key: string, val: DataRecordValue) {
      return !!filters && filters[key]?.includes(val);
    },
    [filters],
  );

  const getCrossFilterDataMask = (key: string, value: DataRecordValue) => {
    let updatedFilters = { ...(filters || {}) };
    if (filters && isActiveFilterValue(key, value)) {
      updatedFilters = {};
    } else {
      updatedFilters = {
        [key]: [value],
      };
    }
    if (
      Array.isArray(updatedFilters[key]) &&
      updatedFilters[key].length === 0
    ) {
      delete updatedFilters[key];
    }

    const groupBy = Object.keys(updatedFilters);
    const groupByValues = Object.values(updatedFilters);
    const labelElements: string[] = [];
    groupBy.forEach(col => {
      const isTimestamp = col === DTTM_ALIAS;
      const filterValues = ensureIsArray(updatedFilters?.[col]);
      if (filterValues.length) {
        const valueLabels = filterValues.map(value =>
          isTimestamp ? timestampFormatter(value) : value,
        );
        labelElements.push(`${valueLabels.join(', ')}`);
      }
    });

    return {
      dataMask: {
        extraFormData: {
          filters:
            groupBy.length === 0
              ? []
              : groupBy.map(col => {
                  const val = ensureIsArray(updatedFilters?.[col]);
                  if (!val.length)
                    return {
                      col,
                      op: 'IS NULL' as const,
                    };
                  return {
                    col,
                    op: 'IN' as const,
                    val: val.map(el =>
                      el instanceof Date ? el.getTime() : el!,
                    ),
                    grain: col === DTTM_ALIAS ? timeGrain : undefined,
                  };
                }),
        },
        filterState: {
          label: labelElements.join(', '),
          value: groupByValues.length ? groupByValues : null,
          filters:
            updatedFilters && Object.keys(updatedFilters).length
              ? updatedFilters
              : null,
        },
      },
      isCurrentValueSelected: isActiveFilterValue(key, value),
    };
  };

  const toggleFilter = useCallback(
    function toggleFilter(key: string, val: DataRecordValue) {
      if (!emitCrossFilters) {
        return;
      }
      setDataMask(getCrossFilterDataMask(key, val).dataMask);
    },
    [emitCrossFilters, getCrossFilterDataMask, setDataMask],
  );

  const getSharedStyle = (column: DataColumnMeta): CSSProperties => {
    const { isNumeric, config = {} } = column;
    const textAlign =
      config.horizontalAlign ||
      (isNumeric && !isUsingTimeComparison ? 'right' : 'left');
    return {
      textAlign,
    };
  };

  // Helper function to check if a column should be hidden (URL column)
  const isUrlColumn = useCallback(
    (columnKey: string) => {
      if (!hyperlinkConfigs.enabled) return false;
      return hyperlinkConfigs.configs.some(
        config => config.urlColumn === columnKey,
      );
    },
    [hyperlinkConfigs],
  );

  const comparisonLabels = [t('Main'), '#', '△', '%'];
  const filteredColumnsMeta = useMemo(() => {
    let filtered = columnsMeta;

    // Filter out URL columns if hyperlink is enabled
    if (hyperlinkConfigs.enabled) {
      filtered = filtered.filter(column => !isUrlColumn(column.key));
    }

    if (hierarchy) {
      const [treeColumnKey, ...hiddenDimensionKeys] = hierarchy.dimensionKeys;
      filtered = filtered
        .filter(column => !hiddenDimensionKeys.includes(column.key))
        .map(column =>
          column.key === treeColumnKey
            ? {
                ...column,
                label: t('Dimensions'),
              }
            : column,
        );
    }

    if (!isUsingTimeComparison) {
      return filtered;
    }
    const allColumns = comparisonColumns[0].key;
    const main = comparisonLabels[0];
    const showAllColumns = selectedComparisonColumns.includes(allColumns);

    return filtered.filter(({ label, key }) => {
      // Extract the key portion after the space, assuming the format is always "label key"
      const keyPortion = key.substring(label.length);
      const isKeyHidded = hideComparisonKeys.includes(keyPortion);
      const isLableMain = label === main;

      return (
        isLableMain ||
        (!isKeyHidded &&
          (!comparisonLabels.includes(label) ||
            showAllColumns ||
            selectedComparisonColumns.includes(label)))
      );
    });
  }, [
    columnsMeta,
    hierarchy,
    hyperlinkConfigs.enabled,
    isUrlColumn,
    comparisonColumns,
    comparisonLabels,
    isUsingTimeComparison,
    hideComparisonKeys,
    selectedComparisonColumns,
  ]);

  // Helper function to check if a column should be hyperlinked
  const getHyperlinkConfig = useCallback(
    (columnKey: string) => {
      if (!hyperlinkConfigs.enabled) {
        return null;
      }

      // Try multiple matching strategies
      const config = hyperlinkConfigs.configs.find(config => {
        // Direct match
        if (config.displayColumn === columnKey) {
          return true;
        }

        // Match after removing common prefixes
        const cleanKey = columnKey
          .replace(/^[^:]+:\s*/, '')
          .replace(/^Column:\s*/, '');
        if (config.displayColumn === cleanKey) {
          return true;
        }

        // Match by label if available
        const column = filteredColumnsMeta.find(col => col.key === columnKey);
        if (column && config.displayColumn === column.label) {
          return true;
        }

        // Match by column name (case insensitive)
        if (config.displayColumn.toLowerCase() === columnKey.toLowerCase()) {
          return true;
        }
        if (config.displayColumn.toLowerCase() === cleanKey.toLowerCase()) {
          return true;
        }

        // Match by converting spaces to underscores and comparing (case insensitive)
        const normalizedColumnKey = columnKey
          .toLowerCase()
          .replace(/\s+/g, '_');
        const normalizedDisplayColumn = config.displayColumn
          .toLowerCase()
          .replace(/\s+/g, '_');
        if (normalizedDisplayColumn === normalizedColumnKey) {
          return true;
        }

        // Match by converting underscores to spaces and comparing (case insensitive)
        const spaceNormalizedColumnKey = columnKey
          .toLowerCase()
          .replace(/_/g, ' ');
        const spaceNormalizedDisplayColumn = config.displayColumn
          .toLowerCase()
          .replace(/_/g, ' ');
        if (spaceNormalizedDisplayColumn === spaceNormalizedColumnKey) {
          return true;
        }

        return false;
      });

      return config;
    },
    [hyperlinkConfigs, filteredColumnsMeta],
  );

  // Helper function to get URL for a hyperlinked column
  const getHyperlinkUrl = useCallback(
    (columnKey: string, rowData: D) => {
      const config = getHyperlinkConfig(columnKey);
      if (!config) {
        return null;
      }

      const urlValue = rowData[config.urlColumn as keyof D];
      const formattedUrl = validateAndFormatUrl(urlValue);
      return formattedUrl;
    },
    [getHyperlinkConfig],
  );

  // Helper function to get hyperlink styles
  const getHyperlinkStyles = useCallback(
    (columnKey: string) => {
      const config = getHyperlinkConfig(columnKey);
      if (!config) return {};

      // Provide default styles for backward compatibility
      const defaultStyles = {
        hyperlinkColor: false,
        underline: true,
        redirectIcon: false,
        iconPosition: 'right' as const,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        hoverEffect: true,
      };

      const styles = config.styles || defaultStyles;
      const cssStyles: React.CSSProperties = {};

      // Always set color to override CSS class default
      if (styles.hyperlinkColor) {
        cssStyles.color = 'rgb(53,53,245)';
      } else {
        // Use default text color when hyperlink color is disabled
        cssStyles.color = 'inherit';
      }

      // Always set text decoration to override CSS class default
      if (styles.underline) {
        cssStyles.textDecoration = 'underline';
      } else {
        cssStyles.textDecoration = 'none';
      }

      if (styles.fontWeight !== 'normal') {
        cssStyles.fontWeight = styles.fontWeight === 'bold' ? 'bold' : '300';
      }

      if (styles.fontStyle === 'italic') {
        cssStyles.fontStyle = 'italic';
      }

      if (styles.hoverEffect) {
        cssStyles.transition = 'all 0.2s ease';
      }

      return cssStyles;
    },
    [getHyperlinkConfig],
  );

  // Helper function to render hyperlink content with icon
  const renderHyperlinkContent = useCallback(
    (columnKey: string, displayText: string) => {
      const config = getHyperlinkConfig(columnKey);
      if (!config) return displayText;

      // Provide default styles for backward compatibility
      const defaultStyles = {
        hyperlinkColor: false,
        underline: true,
        redirectIcon: false,
        iconPosition: 'right' as const,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        hoverEffect: true,
      };

      const styles = config.styles || defaultStyles;

      const icon = styles.redirectIcon ? (
        <NewTabIcon
          style={{
            marginLeft: '4px',
            width: '12px',
            height: '12px',
            textDecoration: 'none',
            verticalAlign: 'middle',
            display: 'inline-block',
          }}
        />
      ) : null;

      if (styles.redirectIcon && styles.iconPosition === 'left') {
        return (
          <>
            <NewTabIcon
              style={{
                marginRight: '4px',
                width: '12px',
                height: '12px',
                textDecoration: 'none',
                verticalAlign: 'middle',
                display: 'inline-block',
              }}
            />
            {displayText}
          </>
        );
      }

      return (
        <>
          {displayText}
          {icon}
        </>
      );
    },
    [getHyperlinkConfig],
  );

  const handleContextMenu =
    onContextMenu && !isRawRecords
      ? (
          value: D,
          cellPoint: {
            key: string;
            value: DataRecordValue;
            isMetric?: boolean;
          },
          clientX: number,
          clientY: number,
        ) => {
          const drillToDetailFilters: BinaryQueryObjectFilterClause[] = [];
          filteredColumnsMeta.forEach(col => {
            if (!col.isMetric) {
              const dataRecordValue = value[col.key];
              drillToDetailFilters.push({
                col: col.key,
                op: '==',
                val: dataRecordValue as string | number | boolean,
                formattedVal: formatColumnValue(col, dataRecordValue)[1],
              });
            }
          });
          onContextMenu(clientX, clientY, {
            drillToDetail: drillToDetailFilters,
            crossFilter: cellPoint.isMetric
              ? undefined
              : getCrossFilterDataMask(cellPoint.key, cellPoint.value),
            drillBy: cellPoint.isMetric
              ? undefined
              : {
                  filters: [
                    {
                      col: cellPoint.key,
                      op: '==',
                      val: cellPoint.value as string | number | boolean,
                    },
                  ],
                  groupbyFieldName: 'groupby',
                },
          });
        }
      : undefined;

  const getHeaderColumns = (
    columnsMeta: DataColumnMeta[],
    enableTimeComparison?: boolean,
  ) => {
    const resultMap: Record<string, number[]> = {};

    if (!enableTimeComparison) {
      return resultMap;
    }

    columnsMeta.forEach((element, index) => {
      // Check if element's label is one of the comparison labels
      if (comparisonLabels.includes(element.label)) {
        // Extract the key portion after the space, assuming the format is always "label key"
        const keyPortion = element.key.substring(element.label.length);

        // If the key portion is not in the map, initialize it with the current index
        if (!resultMap[keyPortion]) {
          resultMap[keyPortion] = [index];
        } else {
          // Add the index to the existing array
          resultMap[keyPortion].push(index);
        }
      }
    });

    return resultMap;
  };

  const renderTimeComparisonDropdown = (): JSX.Element => {
    const allKey = comparisonColumns[0].key;
    const handleOnClick = (data: any) => {
      const { key } = data;
      // Toggle 'All' key selection
      if (key === allKey) {
        setSelectedComparisonColumns([allKey]);
      } else if (selectedComparisonColumns.includes(allKey)) {
        setSelectedComparisonColumns([key]);
      } else {
        // Toggle selection for other keys
        setSelectedComparisonColumns(
          selectedComparisonColumns.includes(key)
            ? selectedComparisonColumns.filter(k => k !== key) // Deselect if already selected
            : [...selectedComparisonColumns, key],
        ); // Select if not already selected
      }
    };

    const handleOnBlur = () => {
      if (selectedComparisonColumns.length === 3) {
        setSelectedComparisonColumns([comparisonColumns[0].key]);
      }
    };

    return (
      <Dropdown
        placement="bottomRight"
        visible={showComparisonDropdown}
        onVisibleChange={(flag: boolean) => {
          setShowComparisonDropdown(flag);
        }}
        overlay={
          <Menu
            multiple
            onClick={handleOnClick}
            onBlur={handleOnBlur}
            selectedKeys={selectedComparisonColumns}
          >
            <div
              css={css`
                max-width: 242px;
                padding: 0 ${theme.gridUnit * 2}px;
                color: ${theme.colors.grayscale.base};
                font-size: ${theme.typography.sizes.s}px;
              `}
            >
              {t(
                'Select columns that will be displayed in the table. You can multiselect columns.',
              )}
            </div>
            {comparisonColumns.map(column => (
              <Menu.Item key={column.key}>
                <span
                  css={css`
                    color: ${theme.colors.grayscale.dark2};
                  `}
                >
                  {column.label}
                </span>
                <span
                  css={css`
                    float: right;
                    font-size: ${theme.typography.sizes.s}px;
                  `}
                >
                  {selectedComparisonColumns.includes(column.key) && (
                    <CheckOutlined />
                  )}
                </span>
              </Menu.Item>
            ))}
          </Menu>
        }
        trigger={['click']}
      >
        <span>
          <TableOutlined /> <DownOutlined />
        </span>
      </Dropdown>
    );
  };

  const renderGroupingHeaders = (): JSX.Element => {
    // TODO: Make use of ColumnGroup to render the aditional headers
    const headers: any = [];
    let currentColumnIndex = 0;

    Object.entries(groupHeaderColumns || {}).forEach(([key, value]) => {
      // Calculate the number of placeholder columns needed before the current header
      const startPosition = value[0];
      const colSpan = value.length;

      // Add placeholder <th> for columns before this header
      for (let i = currentColumnIndex; i < startPosition; i += 1) {
        headers.push(
          <th
            key={`placeholder-${i}`}
            style={{ borderBottom: 0 }}
            aria-label={`Header-${i}`}
          />,
        );
      }

      // Add the current header <th>
      headers.push(
        <th key={`header-${key}`} colSpan={colSpan} style={{ borderBottom: 0 }}>
          {key}
          <span
            css={css`
              float: right;
              & svg {
                color: ${theme.colors.grayscale.base} !important;
              }
            `}
          >
            {hideComparisonKeys.includes(key) ? (
              <PlusCircleOutlined
                onClick={() =>
                  setHideComparisonKeys(
                    hideComparisonKeys.filter(k => k !== key),
                  )
                }
              />
            ) : (
              <MinusCircleOutlined
                onClick={() =>
                  setHideComparisonKeys([...hideComparisonKeys, key])
                }
              />
            )}
          </span>
        </th>,
      );

      // Update the current column index
      currentColumnIndex = startPosition + colSpan;
    });

    return (
      <tr
        css={css`
          th {
            border-right: 2px solid ${theme.colors.grayscale.light2};
          }
          th:first-child {
            border-left: none;
          }
          th:last-child {
            border-right: none;
          }
        `}
      >
        {headers}
      </tr>
    );
  };

  const groupHeaderColumns = useMemo(
    () => getHeaderColumns(filteredColumnsMeta, isUsingTimeComparison),
    [filteredColumnsMeta, isUsingTimeComparison],
  );

  const toggleHierarchyPath = useCallback((path: string) => {
    setExpandedHierarchyPaths(currentPaths => {
      const nextPaths = new Set(currentPaths);
      if (nextPaths.has(path)) {
        nextPaths.delete(path);
      } else {
        nextPaths.add(path);
      }
      return nextPaths;
    });
  }, []);

  const renderHierarchyControls = (): JSX.Element | undefined => {
    if (!hierarchy || !hierarchyModel) {
      return undefined;
    }

    const setExpandedLevel = (level: number) => {
      setExpandedHierarchyPaths(
        getExpandedHierarchyPathsToLevel(hierarchyModel, level),
      );
    };

    return (
      <div className="dt-hierarchy-toolbar">
        <button
          type="button"
          className="btn btn-xs btn-default"
          disabled={!hierarchyModel.expandablePaths.length}
          onClick={() =>
            setExpandedHierarchyPaths(new Set(hierarchyModel.expandablePaths))
          }
        >
          {t('Expand all')}
        </button>
        <button
          type="button"
          className="btn btn-xs btn-default"
          disabled={!hierarchyModel.expandablePaths.length}
          onClick={() => setExpandedHierarchyPaths(new Set())}
        >
          {t('Collapse all')}
        </button>
        <label htmlFor={hierarchyLevelControlId}>
          {t('Expand to level')}
          <select
            id={hierarchyLevelControlId}
            aria-label={t('Expand to hierarchy level')}
            className="form-control input-sm"
            value=""
            onChange={event => setExpandedLevel(Number(event.target.value))}
          >
            <option value="" disabled>
              {t('Select')}
            </option>
            {hierarchy.dimensionKeys.map((dimensionKey, index) => {
              const dimension = columnsMeta.find(
                column => column.key === dimensionKey,
              );
              return (
                <option key={dimensionKey} value={index + 1}>
                  {dimension?.label || dimensionKey}
                </option>
              );
            })}
          </select>
        </label>
      </div>
    );
  };

  const getColumnConfigs = useCallback(
    (column: DataColumnMeta, i: number): ColumnWithLooseAccessor<D> => {
      const {
        key,
        label,
        isNumeric,
        dataType,
        isMetric,
        isPercentMetric,
        config = {},
      } = column;
      const columnWidth = Number.isNaN(Number(config.columnWidth))
        ? config.columnWidth
        : Number(config.columnWidth);
      const isHierarchyColumn = Boolean(
        hierarchy && hierarchy.dimensionKeys[0] === key,
      );

      // inline style for both th and td cell
      const sharedStyle: CSSProperties = {
        ...getSharedStyle(column),
        ...(isHierarchyColumn ? { textAlign: 'left' } : {}),
      };

      const alignPositiveNegative =
        config.alignPositiveNegative === undefined
          ? defaultAlignPN
          : config.alignPositiveNegative;
      const colorPositiveNegative =
        config.colorPositiveNegative === undefined
          ? defaultColorPN
          : config.colorPositiveNegative;

      const { truncateLongCells } = config;

      const hasColumnColorFormatters =
        isNumeric &&
        Array.isArray(columnColorFormatters) &&
        columnColorFormatters.length > 0;

      const hasBasicColorFormatters =
        isUsingTimeComparison &&
        Array.isArray(basicColorFormatters) &&
        basicColorFormatters.length > 0;

      const valueRange =
        !hasBasicColorFormatters &&
        !hasColumnColorFormatters &&
        (config.showCellBars === undefined
          ? showCellBars
          : config.showCellBars) &&
        (isMetric || isRawRecords || isPercentMetric) &&
        getValueRange(key, alignPositiveNegative);

      let className = '';
      if (emitCrossFilters && !isMetric) {
        className += ' dt-is-filter';
      }

      if (!isMetric && !isPercentMetric) {
        className += ' right-border-only';
      } else if (comparisonLabels.includes(label)) {
        const groupinHeader = key.substring(label.length);
        const columnsUnderHeader = groupHeaderColumns[groupinHeader] || [];
        if (i === columnsUnderHeader[columnsUnderHeader.length - 1]) {
          className += ' right-border-only';
        }
      }

      return {
        id: String(i), // to allow duplicate column keys
        // must use custom accessor to allow `.` in column names
        // typing is incorrect in current version of `@types/react-table`
        // so we ask TS not to check.
        accessor: ((datum: D) => datum[key]) as never,
        Cell: ({ value, row }: { value: DataRecordValue; row: Row<D> }) => {
          const [isHtml, text] = formatColumnValue(column, value);
          const html = isHtml && allowRenderHtml ? { __html: text } : undefined;
          const hierarchyLevel = Number(row.original[HIERARCHY_LEVEL_KEY] || 0);
          const hierarchyPath = row.original[HIERARCHY_PATH_KEY] as
            | string
            | undefined;
          const hierarchyCanExpand = Boolean(
            row.original[HIERARCHY_CAN_EXPAND_KEY],
          );
          const filterKey =
            isHierarchyColumn &&
            typeof row.original[HIERARCHY_DIMENSION_KEY] === 'string'
              ? (row.original[HIERARCHY_DIMENSION_KEY] as string)
              : key;

          // Check if this column should be hyperlinked
          const hyperlinkUrl = isHierarchyColumn
            ? null
            : getHyperlinkUrl(key, row.original);
          const displayText = getHyperlinkDisplayText(value);

          let backgroundColor;
          let arrow = '';
          const originKey = column.key.substring(column.label.length).trim();
          if (!hasColumnColorFormatters && hasBasicColorFormatters) {
            backgroundColor =
              basicColorFormatters[row.index]?.[originKey]?.backgroundColor;
            arrow =
              column.label === comparisonLabels[0]
                ? basicColorFormatters[row.index]?.[originKey]?.mainArrow
                : '';
          }

          if (hasColumnColorFormatters) {
            columnColorFormatters!
              .filter(formatter => formatter.column === column.key)
              .forEach(formatter => {
                const formatterResult =
                  value || value === 0
                    ? formatter.getColorFromValue(value as number)
                    : false;
                if (formatterResult) {
                  backgroundColor = formatterResult;
                }
              });
          }

          if (
            basicColorColumnFormatters &&
            basicColorColumnFormatters?.length > 0
          ) {
            backgroundColor =
              basicColorColumnFormatters[row.index]?.[column.key]
                ?.backgroundColor || backgroundColor;
            arrow =
              column.label === comparisonLabels[0]
                ? basicColorColumnFormatters[row.index]?.[column.key]?.mainArrow
                : '';
          }

          const StyledCell = styled.td`
            text-align: ${sharedStyle.textAlign};
            white-space: ${value instanceof Date ? 'nowrap' : undefined};
            position: relative;
            background: ${backgroundColor || undefined};
            font-weight: ${hierarchy?.boldParentRows && hierarchyCanExpand
              ? theme.typography.weights.bold
              : undefined};
          `;

          const cellBarStyles = css`
            position: absolute;
            height: 100%;
            display: block;
            top: 0;
            ${valueRange &&
            `
                width: ${`${cellWidth({
                  value: value as number,
                  valueRange,
                  alignPositiveNegative,
                })}%`};
                left: ${`${cellOffset({
                  value: value as number,
                  valueRange,
                  alignPositiveNegative,
                })}%`};
                background-color: ${cellBackground({
                  value: value as number,
                  colorPositiveNegative,
                })};
              `}
          `;

          let arrowStyles = css`
            color: ${basicColorFormatters &&
            basicColorFormatters[row.index]?.[originKey]?.arrowColor ===
              ColorSchemeEnum.Green
              ? theme.colors.success.base
              : theme.colors.error.base};
            margin-right: ${theme.gridUnit}px;
          `;

          if (
            basicColorColumnFormatters &&
            basicColorColumnFormatters?.length > 0
          ) {
            arrowStyles = css`
              color: ${basicColorColumnFormatters[row.index]?.[column.key]
                ?.arrowColor === ColorSchemeEnum.Green
                ? theme.colors.success.base
                : theme.colors.error.base};
              margin-right: ${theme.gridUnit}px;
            `;
          }

          const cellProps = {
            'aria-labelledby': `header-${column.key}`,
            role: 'cell',
            // show raw number in title in case of numeric values
            title: typeof value === 'number' ? String(value) : undefined,
            onClick:
              emitCrossFilters && !valueRange && !isMetric
                ? () => {
                    // allow selecting text in a cell
                    if (!getSelectedText()) {
                      toggleFilter(filterKey, value);
                    }
                  }
                : undefined,
            onContextMenu: (e: MouseEvent) => {
              if (handleContextMenu) {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenu(
                  row.original,
                  { key: filterKey, value, isMetric },
                  e.nativeEvent.clientX,
                  e.nativeEvent.clientY,
                );
              }
            },
            className: [
              className,
              value == null ? 'dt-is-null' : '',
              isActiveFilterValue(filterKey, value)
                ? ' dt-is-active-filter'
                : '',
              isHierarchyColumn &&
              hierarchy?.showHierarchyLines &&
              hierarchyLevel > 0
                ? ' dt-hierarchy-line'
                : '',
            ].join(' '),
            tabIndex: 0,
          };
          if (hierarchy && isHierarchyColumn) {
            const isExpanded = Boolean(
              hierarchyPath && expandedHierarchyPaths.has(hierarchyPath),
            );
            const labelContent = html ? (
              // eslint-disable-next-line react/no-danger
              <span dangerouslySetInnerHTML={html} />
            ) : (
              text
            );

            return (
              <StyledCell {...cellProps}>
                <span
                  className="dt-hierarchy-cell"
                  style={{
                    paddingLeft: hierarchyLevel * hierarchy.indentSize,
                  }}
                >
                  {hierarchy.showExpandIcons && hierarchyCanExpand ? (
                    <button
                      type="button"
                      className="dt-hierarchy-toggle"
                      aria-label={
                        isExpanded
                          ? t('Collapse %s', text)
                          : t('Expand %s', text)
                      }
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (hierarchyPath) {
                          toggleHierarchyPath(hierarchyPath);
                        }
                      }}
                    >
                      {isExpanded ? (
                        <CaretDownOutlined />
                      ) : (
                        <CaretRightOutlined />
                      )}
                    </button>
                  ) : hierarchy.showExpandIcons ? (
                    <span className="dt-hierarchy-spacer" />
                  ) : null}
                  <span
                    className={
                      truncateLongCells
                        ? 'dt-hierarchy-label dt-truncate-cell'
                        : 'dt-hierarchy-label'
                    }
                    style={columnWidth ? { width: columnWidth } : undefined}
                  >
                    {labelContent}
                  </span>
                </span>
              </StyledCell>
            );
          }
          if (html) {
            if (truncateLongCells) {
              // eslint-disable-next-line react/no-danger
              return (
                <StyledCell {...cellProps}>
                  <div
                    className="dt-truncate-cell"
                    style={columnWidth ? { width: columnWidth } : undefined}
                    dangerouslySetInnerHTML={html}
                  />
                </StyledCell>
              );
            }
            // eslint-disable-next-line react/no-danger
            return <StyledCell {...cellProps} dangerouslySetInnerHTML={html} />;
          }
          // If cellProps renders textContent already, then we don't have to
          // render `Cell`. This saves some time for large tables.
          return (
            <StyledCell {...cellProps}>
              {valueRange && (
                <div
                  /* The following classes are added to support custom CSS styling */
                  className={cx(
                    'cell-bar',
                    isNumber(value) && value < 0 ? 'negative' : 'positive',
                  )}
                  css={cellBarStyles}
                  role="presentation"
                />
              )}
              {truncateLongCells ? (
                <div
                  className="dt-truncate-cell"
                  style={columnWidth ? { width: columnWidth } : undefined}
                >
                  {arrow && <span css={arrowStyles}>{arrow}</span>}
                  {hyperlinkUrl
                    ? (() => {
                        const config = getHyperlinkConfig(key);
                        if (config?.styles.showAsButton) {
                          const chipLabel =
                            config.styles.chipLabel || displayText;
                          return (
                            <ChipButton
                              href={hyperlinkUrl}
                              label={chipLabel}
                              color={config.styles.chipColor}
                              showIcon={config.styles.redirectIcon}
                              iconPosition={config.styles.iconPosition}
                              onClick={e => e.stopPropagation()}
                            />
                          );
                        }
                        return (
                          <a
                            href={hyperlinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dt-hyperlink"
                            onClick={e => e.stopPropagation()}
                            style={getHyperlinkStyles(key)}
                          >
                            {renderHyperlinkContent(key, displayText)}
                          </a>
                        );
                      })()
                    : text}
                </div>
              ) : (
                <>
                  {arrow && <span css={arrowStyles}>{arrow}</span>}
                  {hyperlinkUrl
                    ? (() => {
                        const config = getHyperlinkConfig(key);
                        if (config?.styles.showAsButton) {
                          const chipLabel =
                            config.styles.chipLabel || displayText;
                          return (
                            <ChipButton
                              href={hyperlinkUrl}
                              label={chipLabel}
                              color={config.styles.chipColor}
                              showIcon={config.styles.redirectIcon}
                              iconPosition={config.styles.iconPosition}
                              onClick={e => e.stopPropagation()}
                            />
                          );
                        }
                        return (
                          <a
                            href={hyperlinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dt-hyperlink"
                            onClick={e => e.stopPropagation()}
                            style={getHyperlinkStyles(key)}
                          >
                            {renderHyperlinkContent(key, displayText)}
                          </a>
                        );
                      })()
                    : text}
                </>
              )}
            </StyledCell>
          );
        },
        Header: ({ column: col, onClick, style, onDragStart, onDrop }) => (
          <th
            id={`header-${column.key}`}
            title={
              hierarchy
                ? t('Hierarchy order follows the selected dimensions')
                : t('Shift + Click to sort by multiple columns')
            }
            className={[className, col.isSorted ? 'is-sorted' : ''].join(' ')}
            style={{
              ...sharedStyle,
              ...style,
            }}
            onKeyDown={(e: ReactKeyboardEvent<HTMLElement>) => {
              // programatically sort column on keypress
              if (!hierarchy && Object.values(ACTION_KEYS).includes(e.key)) {
                col.toggleSortBy();
              }
            }}
            role="columnheader button"
            onClick={onClick}
            data-column-name={col.id}
            {...(allowRearrangeColumns && {
              draggable: 'true',
              onDragStart,
              onDragOver: e => e.preventDefault(),
              onDragEnter: e => e.preventDefault(),
              onDrop,
            })}
            tabIndex={0}
          >
            {/* can't use `columnWidth &&` because it may also be zero */}
            {config.columnWidth ? (
              // column width hint
              <div
                style={{
                  width: columnWidth,
                  height: 0.01,
                }}
              />
            ) : null}
            <div
              data-column-name={col.id}
              css={{
                display: 'inline-flex',
                alignItems: 'flex-end',
              }}
            >
              <span data-column-name={col.id}>{label}</span>
              {hierarchy ? null : <SortIcon column={col} />}
            </div>
          </th>
        ),
        Footer: totals ? (
          i === 0 ? (
            <th>
              <div
                css={css`
                  display: flex;
                  align-items: center;
                  & svg {
                    margin-left: ${theme.gridUnit}px;
                    color: ${theme.colors.grayscale.dark1} !important;
                  }
                `}
              >
                {t('Summary')}
                <Tooltip overlay="Shows total aggregation">
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
            </th>
          ) : (
            <td style={sharedStyle}>
              <strong>{formatColumnValue(column, totals[key])[1]}</strong>
            </td>
          )
        ) : undefined,
        disableSortBy: Boolean(hierarchy),
        sortDescFirst: sortDesc,
        sortType: getSortTypeByDataType(dataType),
      };
    },
    [
      defaultAlignPN,
      defaultColorPN,
      emitCrossFilters,
      getValueRange,
      isActiveFilterValue,
      isRawRecords,
      showCellBars,
      sortDesc,
      toggleFilter,
      totals,
      columnColorFormatters,
      columnOrderToggle,
      expandedHierarchyPaths,
      getHyperlinkConfig,
      getHyperlinkStyles,
      hierarchy,
      renderHyperlinkContent,
      toggleHierarchyPath,
    ],
  );

  const columns = useMemo(
    () => filteredColumnsMeta.map(getColumnConfigs),
    [filteredColumnsMeta, getColumnConfigs],
  );

  const handleServerPaginationChange = useCallback(
    (pageNumber: number, pageSize: number) => {
      updateExternalFormData(setDataMask, pageNumber, pageSize);
    },
    [setDataMask],
  );

  const handleSizeChange = useCallback(
    ({ width, height }: { width: number; height: number }) => {
      setTableSize({ width, height });
    },
    [],
  );

  useLayoutEffect(() => {
    // After initial load the table should resize only when the new sizes
    // Are not only scrollbar updates, otherwise, the table would twicth
    const scrollBarSize = getScrollBarSize();
    const { width: tableWidth, height: tableHeight } = tableSize;
    // Table is increasing its original size
    if (
      width - tableWidth > scrollBarSize ||
      height - tableHeight > scrollBarSize
    ) {
      handleSizeChange({
        width: width - scrollBarSize,
        height: height - scrollBarSize,
      });
    } else if (
      tableWidth - width > scrollBarSize ||
      tableHeight - height > scrollBarSize
    ) {
      // Table is decreasing its original size
      handleSizeChange({
        width,
        height,
      });
    }
  }, [width, height, handleSizeChange, tableSize]);

  const { width: widthFromState, height: heightFromState } = tableSize;

  return (
    <Styles>
      <DataTable<D>
        columns={columns}
        data={tableData}
        rowCount={hierarchy ? tableData.length : rowCount}
        tableClassName="table table-striped table-condensed"
        pageSize={pageSize}
        serverPaginationData={serverPaginationData}
        pageSizeOptions={pageSizeOptions}
        width={widthFromState}
        height={heightFromState}
        serverPagination={serverPagination}
        onServerPaginationChange={handleServerPaginationChange}
        onColumnOrderChange={() => setColumnOrderToggle(!columnOrderToggle)}
        // 9 page items in > 340px works well even for 100+ pages
        maxPageItemCount={width > 340 ? 9 : 7}
        noResults={getNoResultsMessage}
        searchInput={includeSearch && SearchInput}
        selectPageSize={pageSize !== null && SelectPageSize}
        // not in use in Superset, but needed for unit tests
        sticky={sticky}
        renderGroupingHeaders={
          !isEmpty(groupHeaderColumns) ? renderGroupingHeaders : undefined
        }
        renderTimeComparisonDropdown={
          isUsingTimeComparison ? renderTimeComparisonDropdown : undefined
        }
        renderHierarchyControls={
          hierarchy ? renderHierarchyControls : undefined
        }
      />
    </Styles>
  );
}
