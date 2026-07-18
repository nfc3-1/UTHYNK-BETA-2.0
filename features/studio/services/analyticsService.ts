import type { StudioMetric, StudioPost } from '@/features/studio/types/studio';

export function summarizeStudioMetrics(posts: StudioPost[], metrics: StudioMetric[]) {
  const publishedPosts = posts.filter((post) => post.status === 'published').length;
  const failedPosts = posts.filter((post) => post.status === 'failed').length;
  const engagement = metrics
    .filter((metric) => ['likes', 'comments', 'shares', 'clicks', 'engagement'].includes(metric.metricType))
    .reduce((total, metric) => total + metric.metricValue, 0);

  return {
    publishedPosts,
    failedPosts,
    engagement,
    metricEvents: metrics.length,
  };
}
