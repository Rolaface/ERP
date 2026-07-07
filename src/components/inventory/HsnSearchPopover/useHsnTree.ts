import { useEffect, useState } from "react";
import { getItemClassifications } from "../../../api/itemClassificationCodeApi";
import { HSNNode, buildTreeFromJson, toLegacyShape } from "./hsnTreeUtils";

/** Loads the full HSN tree once per popover mount, cached until it unmounts. */
export function useHsnTree(open: boolean) {
  const [apiTree, setApiTree] = useState<HSNNode[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || apiTree.length > 0 || isTreeLoading) return;

    setIsTreeLoading(true);
    setTreeError(null);

    getItemClassifications(1, 3000)
      .then((res) => setApiTree(buildTreeFromJson(toLegacyShape(res.data))))
      .catch(() => setTreeError("Couldn't load HSN classifications."))
      .finally(() => setIsTreeLoading(false));
  }, [open, apiTree.length, isTreeLoading]);

  return { apiTree, isTreeLoading, treeError };
}