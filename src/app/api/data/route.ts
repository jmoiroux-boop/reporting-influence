import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MetricType } from "@/lib/types/database";
import type { KPIData, BrandBreakdown, OrganicPaidEntry, DashboardData } from "@/lib/types/dashboard";
import { METRIC_LABELS } from "@/lib/constants";
import { deltaAbsolute, deltaPercent } from "@/lib/utils/format";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Fetch the last completed upload to get period labels and years
  const { data: lastUploadData } = await supabase
    .from("uploads")
    .select("id, file_name, created_at, metadata")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Extract years and period labels from upload metadata
  const metadata = lastUploadData?.metadata as {
    sheetNames?: string[];
    years?: number[];
  } | null;

  const uploadYears = metadata?.years ?? [];
  const sheetNames = metadata?.sheetNames ?? [];

  // Build periodLabels: year → sheet tab name
  const periodLabels: Record<number, string> = {};
  for (let i = 0; i < uploadYears.length; i++) {
    periodLabels[uploadYears[i]] = sheetNames[i] || `${uploadYears[i]}`;
  }

  // Determine current/previous from uploaded data (most recent year = current)
  const sortedYears = [...uploadYears].sort((a, b) => b - a);
  const currentYear = sortedYears[0] ?? 2025;
  const previousYear = sortedYears[1] ?? currentYear - 1;

  // Fetch all influence data for both years
  const { data: rawData, error } = await supabase
    .from("influence_data")
    .select("*")
    .in("year", [currentYear, previousYear]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rawData || rawData.length === 0) {
    const emptyData: DashboardData = {
      kpis: [],
      brandBreakdown: {} as Record<MetricType, BrandBreakdown[]>,
      organicPaid: [],
      periodLabels,
      currentYear,
      previousYear,
      lastUpload: null,
    };
    return NextResponse.json(emptyData);
  }

  // Build KPIs (aggregate "total" source by year/metric/entity)
  const metricKeys: MetricType[] = [
    "influencers_activated",
    "video_views",
    "engagement",
  ];

  const kpiAgg: Record<
    number,
    Record<MetricType, { gseb: number; competitor: number }>
  > = {};

  for (const year of [currentYear, previousYear]) {
    kpiAgg[year] = {} as Record<
      MetricType,
      { gseb: number; competitor: number }
    >;
    for (const m of metricKeys) {
      kpiAgg[year][m] = { gseb: 0, competitor: 0 };
    }
  }

  for (const row of rawData) {
    if (row.source !== "total") continue;
    const year = row.year as number;
    const metric = row.metric as MetricType;
    const entity = row.entity as "gseb" | "competitor";
    if (kpiAgg[year]?.[metric]) {
      kpiAgg[year][metric][entity] += Number(row.value);
    }
  }

  const kpis: KPIData[] = metricKeys.map((metric) => {
    const current = kpiAgg[currentYear]?.[metric] || { gseb: 0, competitor: 0 };
    const previous = kpiAgg[previousYear]?.[metric] || {
      gseb: 0,
      competitor: 0,
    };
    return {
      metric,
      label: METRIC_LABELS[metric] || metric,
      current,
      previous,
      deltaAbsolute: {
        gseb: deltaAbsolute(current.gseb, previous.gseb),
        competitor: deltaAbsolute(current.competitor, previous.competitor),
      },
      deltaPercent: {
        gseb: deltaPercent(current.gseb, previous.gseb),
        competitor: deltaPercent(current.competitor, previous.competitor),
      },
    };
  });

  // Brand breakdown (per metric, "total" source, both years)
  const brandBreakdown: Record<MetricType, BrandBreakdown[]> = {
    influencers_activated: [],
    video_views: [],
    engagement: [],
  };

  // Aggregate by metric → brand → { entity, currentValue, previousValue }
  const brandAgg: Record<
    MetricType,
    Record<string, { entity: "gseb" | "competitor"; currentValue: number; previousValue: number }>
  > = {
    influencers_activated: {},
    video_views: {},
    engagement: {},
  };

  for (const row of rawData) {
    if (row.source !== "total") continue;
    const metric = row.metric as MetricType;
    const brand = row.brand as string;
    const entity = row.entity as "gseb" | "competitor";

    if (!brandAgg[metric][brand]) {
      brandAgg[metric][brand] = { entity, currentValue: 0, previousValue: 0 };
    }
    if (row.year === currentYear) {
      brandAgg[metric][brand].currentValue += Number(row.value);
    } else if (row.year === previousYear) {
      brandAgg[metric][brand].previousValue += Number(row.value);
    }
  }

  for (const metric of metricKeys) {
    brandBreakdown[metric] = Object.entries(brandAgg[metric])
      .map(([brand, data]) => ({
        brand,
        entity: data.entity,
        currentValue: data.currentValue,
        previousValue: data.previousValue,
      }))
      .sort((a, b) => b.currentValue - a.currentValue);
  }

  // Organic vs Paid breakdown
  const organicPaidMap: Record<
    string,
    { currentValue: number; previousValue: number }
  > = {};

  for (const row of rawData) {
    if (row.source === "total") continue;
    const key = `${row.brand}|${row.entity}|${row.source}|${row.metric}`;
    if (!organicPaidMap[key]) {
      organicPaidMap[key] = { currentValue: 0, previousValue: 0 };
    }
    if (row.year === currentYear) {
      organicPaidMap[key].currentValue += Number(row.value);
    } else {
      organicPaidMap[key].previousValue += Number(row.value);
    }
  }

  const organicPaid: OrganicPaidEntry[] = Object.entries(organicPaidMap).map(
    ([key, values]) => {
      const [brand, entity, source, metric] = key.split("|");
      return {
        brand,
        entity: entity as OrganicPaidEntry["entity"],
        source: source as OrganicPaidEntry["source"],
        metric: metric as MetricType,
        currentValue: values.currentValue,
        previousValue: values.previousValue,
        deltaAbsolute: deltaAbsolute(values.currentValue, values.previousValue),
        deltaPercent: deltaPercent(values.currentValue, values.previousValue),
      };
    }
  );

  const dashboardData: DashboardData = {
    kpis,
    brandBreakdown,
    organicPaid,
    periodLabels,
    currentYear,
    previousYear,
    lastUpload: lastUploadData
      ? {
          id: lastUploadData.id,
          fileName: lastUploadData.file_name,
          createdAt: lastUploadData.created_at,
        }
      : null,
  };

  return NextResponse.json(dashboardData);
}
