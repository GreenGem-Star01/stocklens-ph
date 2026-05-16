"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChartLine, Database, Palette, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ThemeModeSetting } from "@/components/settings/theme-mode-setting";
import { FORECAST_DISCLAIMER } from "@/lib/forecast";
import { useSettingsStore } from "@/lib/stores/settings-store";

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsForm() {
  const settings = useSettingsStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved.");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    settings.reset();
    toast.message("Settings reset to defaults.");
  };

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Preferences for display, forecasts, and notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Color mode applies across the dashboard, stock pages, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeModeSetting />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you receive alerts and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Forecast Updates"
            description="Get notified when new forecasts are available for watchlist stocks"
            checked={settings.forecastUpdates}
            onCheckedChange={(v) => settings.setField("forecastUpdates", v)}
          />
          <Separator />
          <SettingRow
            label="Price Alerts"
            description="Receive alerts when stock prices hit significant levels"
            checked={settings.priceAlerts}
            onCheckedChange={(v) => settings.setField("priceAlerts", v)}
          />
          <Separator />
          <SettingRow
            label="Market News"
            description="Get updates on PSE disclosures and market-moving events"
            checked={settings.marketNews}
            onCheckedChange={(v) => settings.setField("marketNews", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartLine className="h-5 w-5 text-primary" />
            <CardTitle>Forecast Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize forecast display and model settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Forecast Horizon</Label>
            <Select
              value={settings.defaultHorizon}
              onValueChange={(v) => v && settings.setField("defaultHorizon", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3d">3 days</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="14d">14 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Preferred Model</Label>
            <Select
              value={settings.preferredModel}
              onValueChange={(v) => v && settings.setField("preferredModel", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lstm">LSTM (Recommended)</SelectItem>
                <SelectItem value="linear">Linear Regression</SelectItem>
                <SelectItem value="ma">Moving Average</SelectItem>
                <SelectItem value="naive">Naive Baseline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <SettingRow
            label="Show Model Comparison"
            description="Display comparison table with baseline models"
            checked={settings.showModelComparison}
            onCheckedChange={(v) =>
              settings.setField("showModelComparison", v)
            }
          />
          <Separator />
          <SettingRow
            label="Display AI Insights"
            description="Show plain-language interpretation of forecasts"
            checked={settings.displayAiInsights}
            onCheckedChange={(v) => settings.setField("displayAiInsights", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Data & Display</CardTitle>
          </div>
          <CardDescription>
            Configure data sources and chart settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Time Range</Label>
            <Select
              value={settings.defaultTimeRange}
              onValueChange={(v) => v && settings.setField("defaultTimeRange", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Currency Display</Label>
            <Select
              value={settings.currencyDisplay}
              onValueChange={(v) => v && settings.setField("currencyDisplay", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="php">Philippine Peso (₱)</SelectItem>
                <SelectItem value="usd">US Dollar ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <SettingRow
            label="Auto-refresh Data"
            description="Automatically update prices during market hours"
            checked={settings.autoRefresh}
            onCheckedChange={(v) => settings.setField("autoRefresh", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Privacy & Disclaimers</CardTitle>
          </div>
          <CardDescription>
            Important information about data usage and limitations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Show Disclaimer Banners"
            description="Display educational disclaimers on forecast pages"
            checked={settings.showDisclaimerBanners}
            onCheckedChange={(v) =>
              settings.setField("showDisclaimerBanners", v)
            }
          />
          <Separator />
          <div className="space-y-2">
            <Label>About StockLens PH</Label>
            <div className="space-y-2 rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Educational Purpose Only:</strong>{" "}
                StockLens PH is designed for educational and research purposes.
                All forecasts are experimental and should not be used as the sole
                basis for investment decisions.
              </p>
              <p>
                <strong className="text-foreground">Not Financial Advice:</strong>{" "}
                This tool does not provide financial advice. Always consult with
                licensed financial advisors before making investment decisions.
              </p>
              <p>{FORECAST_DISCLAIMER}</p>
            </div>
          </div>
          <div className="pt-2">
            <Link href="/terms">
              <Button variant="outline" className="w-full">
                View Full Terms & Conditions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved ? (
          <span className="text-sm text-trend-up">Settings saved</span>
        ) : null}
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </>
  );
}
