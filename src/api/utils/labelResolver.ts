export type LabelFetcher = (
  search?: string,
) => Promise<any[]>;

export const resolveLabel =
  async ({
    value,
    fetcher,
  }: {
    value?: string;
    fetcher: LabelFetcher;
  }): Promise<string> => {
    if (!value) {
      return "";
    }

    try {
      const res = await fetcher(value);

      const matched = (
        res || []
      ).find(
        (item: any) =>
          item.value === value,
      );

      return (
        matched?.label || value
      );
    } catch {
      return value;
    }
  };