import { useCallback, useEffect, useRef, useState } from "react";
import {
  getItemClassificationChildren,
  type ClassificationPage,
} from "../../../api/itemClassificationCodeApi";
import { HSNNode, toNode } from "./hsnTreeUtils";

const ROOT_KEY = "__root__";
const CHILD_PAGE_SIZE = 50;

export function useHsnTree(open: boolean) {
  const [childrenByParent, setChildrenByParent] = useState<
    Record<string, HSNNode[]>
  >({});
  const [paginationByParent, setPaginationByParent] = useState<
    Record<string, ClassificationPage>
  >({});
  const [loadingByParent, setLoadingByParent] = useState<
    Record<string, boolean>
  >({});
  const [treeError, setTreeError] = useState<string | null>(null);
  const loadingKeys = useRef(new Set<string>());

  const loadChildren = useCallback(
    async (parentCode?: string, append = false) => {
      const key = parentCode || ROOT_KEY;
      if (loadingKeys.current.has(key)) return;
      const existing = childrenByParent[key];
      const pagination = paginationByParent[key];
      if (!append && existing) return;
      if (append && (!pagination?.has_next || !pagination.next_cursor)) return;

      loadingKeys.current.add(key);
      setLoadingByParent((current) => ({ ...current, [key]: true }));
      setTreeError(null);
      try {
        const response = await getItemClassificationChildren(
          parentCode,
          CHILD_PAGE_SIZE,
          append ? pagination.next_cursor : undefined,
        );
        const newItems = response.data.map(toNode);
        setChildrenByParent((current) => ({
          ...current,
          [key]: append
            ? [
                ...(current[key] ?? []),
                ...newItems.filter(
                  (item) =>
                    !(current[key] ?? []).some((old) => old.code === item.code),
                ),
              ]
            : newItems,
        }));
        setPaginationByParent((current) => ({
          ...current,
          [key]: response.pagination,
        }));
      } catch {
        setTreeError("Couldn't load HSN classifications.");
      } finally {
        loadingKeys.current.delete(key);
        setLoadingByParent((current) => ({ ...current, [key]: false }));
      }
    },
    [childrenByParent, paginationByParent],
  );

  useEffect(() => {
    if (open) void loadChildren();
  }, [open, loadChildren]);

  const rootItems = childrenByParent[ROOT_KEY] ?? [];
  return {
    apiTree: rootItems,
    isTreeLoading: Boolean(loadingByParent[ROOT_KEY]) && rootItems.length === 0,
    treeError,
    getChildren: (parentCode?: string) =>
      childrenByParent[parentCode || ROOT_KEY] ?? [],
    loadChildren,
    loadMoreChildren: (parentCode?: string) => loadChildren(parentCode, true),
    isChildrenLoading: (parentCode?: string) =>
      Boolean(loadingByParent[parentCode || ROOT_KEY]),
    hasMoreChildren: (parentCode?: string) =>
      Boolean(paginationByParent[parentCode || ROOT_KEY]?.has_next),
  };
}
