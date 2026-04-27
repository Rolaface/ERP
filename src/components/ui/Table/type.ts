import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  tooltip?: (item: T) => React.ReactNode;
  width?: string;
  maxWidth?: string;
   minWidth?: string;   
  width?: string; 
  truncate?: boolean;
}