import React from "react";

import {
  Brain,
  TrendingUp,
  Activity,
} from "lucide-react";

import WorkspaceCluster from "./WorkspaceCluster";
import AnalyticsPlaceholderCard from "./AnalyticsPlaceholderCard";

const InsightsSection: React.FC = () => {
  return (
    <WorkspaceCluster
      eyebrow="Future Operations Layer"
      title="Workforce Insights & Predictive Analytics"
      description="
        Reserved operational intelligence environment for
        attendance forecasting, productivity analytics,
        AI-generated recommendations, workforce behavior
        analysis, and future enterprise reporting systems.
      "
      contentClassName="
        grid
        grid-cols-1
        lg:grid-cols-3
        gap-6
      "
    >

      {/* ATTENDANCE */}

      <AnalyticsPlaceholderCard
        icon={<TrendingUp size={22} />}
        title="Attendance Trends"
        description="
          Future attendance intelligence layer for
          absenteeism tracking, attendance consistency,
          workforce participation analytics, and
          operational forecasting.
        "
        badge="Forecasting"
      />

      {/* PRODUCTIVITY */}

      <AnalyticsPlaceholderCard
        icon={<Activity size={22} />}
        title="Productivity Intelligence"
        description="
          Workforce productivity monitoring including
          operational performance patterns, workload
          analysis, and behavioral productivity insights.
        "
        badge="Behavioral Analytics"
      />

      {/* AI INSIGHTS */}

      <AnalyticsPlaceholderCard
        icon={<Brain size={22} />}
        title="AI Operational Insights"
        description="
          AI-generated recommendations, operational
          anomaly detection, predictive workforce
          intelligence, and enterprise HR optimization.
        "
        badge="AI Layer"
      />

    </WorkspaceCluster>
  );
};

export default InsightsSection;