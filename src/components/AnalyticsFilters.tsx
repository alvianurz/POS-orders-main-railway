import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";

export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  preset: "today" | "7days" | "30days" | "90days" | "custom";
  categories: string[];
  products: string[];
}

interface DatePreset {
  label: string;
  value: AnalyticsFilters["preset"];
}

const presets: DatePreset[] = [
  { label: "Hari ini", value: "today" },
  { label: "7 hari", value: "7days" },
  { label: "30 hari", value: "30days" },
  { label: "90 hari", value: "90days" },
];

interface AnalyticsFiltersProps {
  categories: string[];
  onFiltersChange: (filters: AnalyticsFilters) => void;
}

export function AnalyticsFilters({ categories, onFiltersChange }: AnalyticsFiltersProps) {
  const [selectedPreset, setSelectedPreset] = useState<AnalyticsFilters["preset"]>("7days");

  const getDates = (preset: AnalyticsFilters["preset"]) => {
    const today = new Date();
    switch (preset) {
      case "today":
        return { start: startOfDay(today), end: endOfDay(today) };
      case "7days":
        return { start: startOfDay(subDays(today, 6)), end: endOfDay(today) };
      case "30days":
        return { start: startOfDay(subDays(today, 29)), end: endOfDay(today) };
      case "90days":
        return { start: startOfDay(subDays(today, 89)), end: endOfDay(today) };
      default:
        return { start: startOfDay(subDays(today, 6)), end: endOfDay(today) };
    }
  };

  useEffect(() => {
    const dates = getDates(selectedPreset);
    onFiltersChange({
      dateRange: dates,
      preset: selectedPreset,
      categories: [],
      products: [],
    });
  }, [selectedPreset]);

  const getPresetLabel = () => {
    const p = presets.find(p => p.value === selectedPreset);
    return p?.label || "7 hari";
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date Range Presets */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedPreset === preset.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedPreset(preset.value)}
            className="h-8 text-xs font-medium"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Category Filter */}
      <span className="text-xs text-muted-foreground">
        Filter aktif: {getPresetLabel()}
      </span>
    </div>
  );
}