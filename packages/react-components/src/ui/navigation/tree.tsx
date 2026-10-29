import * as React from "react";
import { ChevronDown, ChevronRight, FileText, Folder } from "@biugle/icons";
import { TextField } from "../control/index.js";
import { Ellipsis } from "../overlay/index.js";
import { cx } from "../../shared/utils.js";
import { useComponentsLocale } from "../../provider.js";
import type { NavigationLocaleProps } from "./types.js";
import { nodeText } from "./utils.js";

export interface TreeNode {
  key: string;
  title: React.ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  icon?: React.ReactNode;
}

export interface TreeClassNames {
  root?: string;
  search?: string;
  node?: string;
  toggle?: string;
  checkbox?: string;
  icon?: string;
  title?: string;
}

function collectDescendantKeys(node: TreeNode, childrenFor: (node: TreeNode) => TreeNode[]): string[] {
  return childrenFor(node).flatMap((child) => [child.key, ...collectDescendantKeys(child, childrenFor)]);
}

export function Tree({
  data,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelect,
  className,
  multiple = false,
  defaultExpandedKeys = [],
  expandedKeys,
  onExpand,
  checkable = false,
  checkStrictly = false,
  checkedKeys,
  defaultCheckedKeys = [],
  onCheck,
  showSearch = false,
  searchValue,
  defaultSearchValue = "",
  onSearch,
  filterTreeNode,
  titleRender,
  loadData,
  onLoadError,
  classNames,
  locale,
  localeText,
}: {
  data: TreeNode[];
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelect?: (keys: string[]) => void;
  className?: string;
  multiple?: boolean;
  defaultExpandedKeys?: string[];
  expandedKeys?: string[];
  onExpand?: (keys: string[]) => void;
  checkable?: boolean;
  checkStrictly?: boolean;
  checkedKeys?: string[];
  defaultCheckedKeys?: string[];
  onCheck?: (keys: string[], info: { node: TreeNode; checked: boolean; halfCheckedKeys: string[] }) => void;
  showSearch?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  onSearch?: (value: string) => void;
  filterTreeNode?: (node: TreeNode, searchValue: string) => boolean;
  titleRender?: (node: TreeNode) => React.ReactNode;
  loadData?: (node: TreeNode) => TreeNode[] | void | Promise<TreeNode[] | void>;
  onLoadError?: (error: unknown, node: TreeNode) => void;
  classNames?: TreeClassNames;
} & NavigationLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpandedKeys);
  const [internalSelected, setInternalSelected] = React.useState<string[]>(selectedKeys ?? defaultSelectedKeys);
  const [internalChecked, setInternalChecked] = React.useState(defaultCheckedKeys);
  const [internalSearch, setInternalSearch] = React.useState(defaultSearchValue);
  const [loadedChildren, setLoadedChildren] = React.useState<Record<string, TreeNode[]>>({});
  const [loadingKeys, setLoadingKeys] = React.useState<string[]>([]);
  const activeExpanded = expandedKeys ?? internalExpanded;
  const activeSelected = selectedKeys ?? internalSelected;
  const activeChecked = checkedKeys ?? internalChecked;
  const activeSearch = searchValue ?? internalSearch;
  const childrenFor = React.useCallback(
    (node: TreeNode) =>
      Object.prototype.hasOwnProperty.call(loadedChildren, node.key) ? loadedChildren[node.key] : (node.children ?? []),
    [loadedChildren],
  );
  const findNode = React.useCallback(
    (nodes: TreeNode[], key: string): TreeNode | undefined => {
      for (const node of nodes) {
        if (node.key === key) return node;
        const found = findNode(childrenFor(node), key);
        if (found) return found;
      }
      return undefined;
    },
    [childrenFor],
  );
  const setExpanded = (key: string) => {
    const next = activeExpanded.includes(key)
      ? activeExpanded.filter((item) => item !== key)
      : [...activeExpanded, key];
    if (expandedKeys === undefined) setInternalExpanded(next);
    onExpand?.(next);
  };
  const toggle = async (node: TreeNode) => {
    const isOpening = !activeExpanded.includes(node.key);
    if (isOpening && loadData && !node.isLeaf && !Object.prototype.hasOwnProperty.call(loadedChildren, node.key)) {
      setLoadingKeys((current) => [...new Set([...current, node.key])]);
      let loaded = true;
      try {
        const children = await loadData(node);
        if (children) setLoadedChildren((current) => ({ ...current, [node.key]: children }));
      } catch (error) {
        loaded = false;
        onLoadError?.(error, node);
      } finally {
        setLoadingKeys((current) => current.filter((key) => key !== node.key));
      }
      if (!loaded) return;
    }
    setExpanded(node.key);
  };
  const filteredData = React.useMemo(() => {
    const query = activeSearch.trim().toLowerCase();
    if (!query) return data;
    const filter = (nodes: TreeNode[]): TreeNode[] =>
      nodes.flatMap((node) => {
        const children = filter(childrenFor(node));
        const matched = filterTreeNode ? filterTreeNode(node, activeSearch) : nodeText(node.title).includes(query);
        return matched || children.length ? [{ ...node, children }] : [];
      });
    return filter(data);
  }, [activeSearch, childrenFor, data, filterTreeNode]);
  const searchExpandedKeys = React.useMemo(() => {
    const query = activeSearch.trim().toLowerCase();
    if (!query) return new Set<string>();
    const keys = new Set<string>();
    const visit = (nodes: TreeNode[]): boolean => {
      let matchedAny = false;
      for (const node of nodes) {
        const children = childrenFor(node);
        const childMatched = visit(children);
        const matched = filterTreeNode ? filterTreeNode(node, activeSearch) : nodeText(node.title).includes(query);
        if (childMatched) keys.add(node.key);
        matchedAny ||= matched || childMatched;
      }
      return matchedAny;
    };
    visit(data);
    return keys;
  }, [activeSearch, childrenFor, data, filterTreeNode]);
  // Search renders cloned nodes with only matching descendants. Selection must
  // resolve the original node so checking an ancestor still includes hidden
  // descendants that were excluded from the visible search result.
  const selectionNode = (node: TreeNode) => findNode(data, node.key) ?? node;
  const expandedForRender = React.useMemo(
    () => (activeSearch.trim() ? new Set([...activeExpanded, ...searchExpandedKeys]) : new Set(activeExpanded)),
    [activeExpanded, activeSearch, searchExpandedKeys],
  );
  const render = (nodes: TreeNode[], level = 0) => (
    <ul>
      {nodes.map((node) => (
        <li key={node.key}>
          <div
            className={cx("biu-ui-tree__node", activeSelected.includes(node.key) && "is-active", classNames?.node)}
            style={{ "--biu-tree-level": level } as React.CSSProperties}
          >
            {childrenFor(node).length || (loadData && !node.isLeaf) ? (
              <button
                type="button"
                className={cx("biu-ui-tree__toggle", classNames?.toggle)}
                aria-label={activeExpanded.includes(node.key) ? text["收起行"] : text["展开行"]}
                aria-expanded={expandedForRender.has(node.key)}
                disabled={node.disabled || loadingKeys.includes(node.key)}
                onClick={() => void toggle(node)}
              >
                {loadingKeys.includes(node.key) ? (
                  <span className="biu-ui-tree__loading" aria-hidden="true" />
                ) : expandedForRender.has(node.key) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              <span className={cx("biu-ui-tree__toggle", classNames?.toggle)} aria-hidden="true" />
            )}
            {checkable
              ? (() => {
                  const sourceNode = selectionNode(node);
                  const descendants = collectDescendantKeys(sourceNode, childrenFor);
                  const checkedDescendants = descendants.filter((key) => activeChecked.includes(key));
                  const allDescendantsChecked =
                    descendants.length > 0 && checkedDescendants.length === descendants.length;
                  const checked =
                    checkStrictly || descendants.length === 0
                      ? activeChecked.includes(node.key)
                      : allDescendantsChecked;
                  const halfChecked =
                    !checkStrictly && descendants.length > 0 && checkedDescendants.length > 0 && !allDescendantsChecked;
                  return (
                    <input
                      type="checkbox"
                      className={classNames?.checkbox}
                      checked={checked}
                      ref={(element) => {
                        if (element) element.indeterminate = halfChecked;
                      }}
                      disabled={node.disabled}
                      aria-label={typeof node.title === "string" ? node.title : node.key}
                      onChange={() => {
                        if (node.disabled) return;
                        const keys = new Set(activeChecked);
                        // Do not read the browser-mutated checked value here:
                        // an indeterminate checkbox can report a transient DOM
                        // value that is different from the tree state.
                        const nextChecked = !checked;
                        const affected = checkStrictly ? [node.key] : [node.key, ...descendants];
                        affected.forEach((key) => (nextChecked ? keys.add(key) : keys.delete(key)));
                        const next = [...keys];
                        if (checkedKeys === undefined) setInternalChecked(next);
                        onCheck?.(next, {
                          node: sourceNode,
                          checked: nextChecked,
                          halfCheckedKeys: checkStrictly ? [] : checkedDescendants,
                        });
                      }}
                    />
                  );
                })()
              : null}
            <span className={cx("biu-ui-tree__icon", classNames?.icon)} aria-hidden="true">
              {node.icon ??
                (childrenFor(node).length || (loadData && !node.isLeaf) ? (
                  <Folder size={16} />
                ) : (
                  <FileText size={16} />
                ))}
            </span>
            <button
              type="button"
              disabled={node.disabled}
              className={cx("biu-ui-tree__title", activeSelected.includes(node.key) && "is-active", classNames?.title)}
              onClick={() => {
                if (node.disabled) return;
                const next = multiple
                  ? activeSelected.includes(node.key)
                    ? activeSelected.filter((key) => key !== node.key)
                    : [...activeSelected, node.key]
                  : [node.key];
                if (selectedKeys === undefined) setInternalSelected(next);
                onSelect?.(next);
              }}
            >
              <Ellipsis tooltipContent={node.title} className="biu-ui-tree__title-label">
                {titleRender?.(node) ?? node.title}
              </Ellipsis>
            </button>
          </div>
          {childrenFor(node).length && expandedForRender.has(node.key) ? render(childrenFor(node), level + 1) : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cx("biu-ui-tree", className, classNames?.root)} data-biu-component="tree">
      {showSearch ? (
        <TextField
          className={cx("biu-ui-tree__search", classNames?.search)}
          value={activeSearch}
          allowClear
          onChange={(event) => {
            if (searchValue === undefined) setInternalSearch(event.target.value);
            onSearch?.(event.target.value);
          }}
          onClear={() => {
            if (searchValue === undefined) setInternalSearch("");
            onSearch?.("");
          }}
          placeholder={text["搜索"]}
          aria-label={text["搜索"]}
        />
      ) : null}
      {render(filteredData)}
    </div>
  );
}
