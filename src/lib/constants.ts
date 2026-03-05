export const SEB_COLORS = {
  red: "#DD2D1F",
  redDark: "#B82419",
  redLight: "#F5E6E4",
  gray: "#726059",
  grayLight: "#A89890",
  grayDark: "#4A3D37",
  cream: "#F8F6F4",
  creamDark: "#EDE8E4",
} as const;

export const CHART_COLORS = {
  gseb: SEB_COLORS.red,
  competitor: SEB_COLORS.gray,
  gsebLight: SEB_COLORS.redLight,
  competitorLight: SEB_COLORS.grayLight,
} as const;

export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  allowedExtensions: [".xlsx"],
} as const;

export const METRIC_LABELS: Record<string, string> = {
  influencers_activated: "Influencers Activated",
  video_views: "Video Views",
  engagement: "Engagement",
} as const;

export const ENTITY_LABELS: Record<string, string> = {
  gseb: "Groupe SEB",
  competitor: "Competitors",
} as const;

export const SOURCE_LABELS: Record<string, string> = {
  total: "All",
  organic: "Organic",
  paid: "Paid",
} as const;

export const KPI_SECTIONS = [
  "influencers_activated",
  "video_views",
  "engagement",
  "brand_breakdown",
  "organic_paid",
] as const;
