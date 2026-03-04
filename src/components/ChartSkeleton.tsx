export type ChartSkeletonVariant = "line" | "bar" | "pie";

export const ChartSkeleton = ({
  variant,
}: {
  variant: ChartSkeletonVariant;
}) => {
  if (variant === "pie") {
    return (
      <div className="w-full h-full flex items-center justify-center animate-pulse">
        <div className="h-32 w-32 rounded-full bg-gray-400 border border-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-3 animate-pulse flex flex-col justify-end gap-2">
      <div className="h-2 w-24 bg-gray-400 rounded" />
      <div className="flex items-end gap-2 h-full">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-gray-400 rounded w-full"
            style={{ height: `${30 + ((idx * 13) % 70)}%` }}
          />
        ))}
      </div>
    </div>
  );
};
