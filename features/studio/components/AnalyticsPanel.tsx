'use client';

type AnalyticsPanelProps = {
  analytics: Array<{
    label: string;
    value: number;
    detail: string;
  }>;
};

export default function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  return (
    <div className="studioAnalyticsGrid studioAnalyticsGridFour">
      {analytics.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span><small>{item.detail}</small></div>)}
    </div>
  );
}
