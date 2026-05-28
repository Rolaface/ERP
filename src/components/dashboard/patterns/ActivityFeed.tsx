import React from "react";
import { cn } from "@/lib/utils";

import DashboardSection from "../primitives/DashboardSection";
import TimelineItem from "../primitives/TimelineItem";
import DashboardStack from "../layout/DashboardStack";

export interface ActivityItemData {
  id: string;

  title: string;
  description?: string;

  timestamp: string;

  type?: "info" | "success" | "warning" | "danger";

  actor?: string;

  unread?: boolean;

  icon?: React.ReactNode;

  actionLabel?: string;
  onActionClick?: () => void;
}

interface ActivityFeedProps {
  title?: string;

  items: ActivityItemData[];

  className?: string;

  emptyMessage?: string;

  maxHeight?: number;

  compact?: boolean;
}

export default function ActivityFeed({
  title = "Recent Activity",

  items,

  className,

  emptyMessage = "No recent activity.",

  maxHeight = 420,

  compact = false,
}: ActivityFeedProps) {
  const hasItems = items.length > 0;

  return (
    <DashboardSection
      title={title}
      className={cn("h-full", className)}
    >
      {!hasItems ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div
          className={cn(
            "overflow-y-auto pr-1",
            "no-scrollbar"
          )}
          style={{
            maxHeight,
          }}
        >
          <DashboardStack
            gap={compact ? "sm" : "md"}
          >
            {items.map((item, index) => {
              const isLast =
                index === items.length - 1;

              return (
                <TimelineItem
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  timestamp={item.timestamp}
                  type={item.type}
                  actor={item.actor}
                  unread={item.unread}
                  icon={item.icon}
                  actionLabel={item.actionLabel}
                  onActionClick={
                    item.onActionClick
                  }
                  isLast={isLast}
                />
              );
            })}
          </DashboardStack>
        </div>
      )}
    </DashboardSection>
  );
}

interface EmptyStateProps {
  message: string;
}

function EmptyState({
  message,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] items-center justify-center",
        "rounded-2xl border border-dashed border-theme",
        "bg-surface-1",
        "text-sm text-muted"
      )}
    >
      {message}
    </div>
  );
}