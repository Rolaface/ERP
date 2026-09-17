import type {
  ClassificationPathEntry,
  ItemClassification,
} from "../../../api/itemClassificationCodeApi";

export type TrailEntry = ClassificationPathEntry;

export interface HSNNode {
  id: string;
  name: string;
  code: string;
  level: number;
  hasChildren: boolean;
  ancestorTrail?: TrailEntry[];
}

export interface HSNLeaf extends HSNNode {
  trail: TrailEntry[];
}

export function toNode(item: ItemClassification): HSNNode {
  return {
    id: item.id,
    name: item.class_name,
    code: item.class_code,
    level: item.class_level,
    hasChildren: Boolean(item.has_children),
    ancestorTrail: item.path?.slice(0, -1),
  };
}

export function toSearchLeaf(item: ItemClassification): HSNLeaf {
  return {
    ...toNode(item),
    trail: item.path?.slice(0, -1) ?? [],
  };
}
