import { useEffect, useRef, useState } from "react";
import { getItemClassifications } from "../../../api/itemClassificationCodeApi";
import { HSNNode, buildTreeFromJson, toLegacyShape } from "./hsnTreeUtils";

/** Loads the full HSN tree once per popover mount, cached until it unmounts. */
export function useHsnTree(open: boolean) {
  const [apiTree, setApiTree] = useState<HSNNode[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!open || hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    setIsTreeLoading(true);
    setTreeError(null);

    getItemClassifications(1, 3000)
      .then((res) => setApiTree(buildTreeFromJson(toLegacyShape(res.data))))
      .catch(() => {
        setTreeError("Couldn't load HSN classifications.");
        hasFetchedRef.current = false; 
      })
      .finally(() => setIsTreeLoading(false));
  }, [open]);

  return { apiTree, isTreeLoading, treeError };
}