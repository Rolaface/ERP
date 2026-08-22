export function buildListParams({
  fields,
  start,
  pageSize,
  search,
  searchFields,
  status,
  sortBy,
  sortOrder,
}: {
  fields: string[];
  start?: number;
  pageSize?: number;
  search?: string;
  searchFields?: string[];
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const params = new URLSearchParams();

  params.append("fields", JSON.stringify(fields));
  params.append("with_pagination", "1");

  if (typeof start === "number") {
    params.append("limit_start", String(start));
  }

  if (typeof pageSize === "number") {
    params.append("limit_page_length", String(pageSize));
  }

  if (sortBy) {
    params.append("order_by", `${sortBy} ${sortOrder || "asc"}`);
  } else {
    params.append("order_by", "creation desc");
  }

  if (search && searchFields?.length) {
    const orFilters = searchFields.map((field) => [
      field,
      "like",
      `%${search}%`,
    ]);
    params.append("or_filters", JSON.stringify(orFilters));
  }
  if (status) {
    params.append("or_filters", JSON.stringify({ status }));
  }
  return params.toString();
}