export function buildListParams({
  fields,
  start,
  pageSize,
  search,
  searchFields,
}: {
  fields: string[];
  start?: number;
  pageSize?: number;
  search?: string;
  searchFields?: string[];
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

  if (search && searchFields?.length) {
    const orFilters = searchFields.map((field) => [
      field,
      "like",
      `%${search}%`,
    ]);
    params.append("or_filters", JSON.stringify(orFilters));
  }

  return params.toString();
}