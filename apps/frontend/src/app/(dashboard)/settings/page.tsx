"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  Copy,
  Clock,
  Server,
  Coins,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  Activity,
  RefreshCw,
} from "lucide-react";
import Markdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";

import { ProviderIcon, providerMeta } from "@/components/provider-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useAvailableAiProviders,
  useAiProviderSettings,
  useCreateAiProviderSetting,
  useUpdateAiProviderSetting,
  useDeleteAiProviderSetting,
  useTestAiProvider,
  useTestAiProviderSetting,
  useFetchAiProviderModels,
  useAiUsageStats,
  useAiAnalysisHistory,
} from "@/hooks/use-api";
import type {
  AiProviderType,
  AiProviderInfo,
  AiProviderSettings,
  AiModelInfo,
  CreateAiProviderDto,
  UpdateAiProviderDto,
} from "@/lib/api";

function AiProvidersGrid({
  providers,
  settings,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onTest,
  onSetDefault,
}: {
  providers: AiProviderInfo[] | undefined;
  settings: AiProviderSettings[] | undefined;
  isLoading: boolean;
  onAdd: (provider: AiProviderInfo) => void;
  onEdit: (setting: AiProviderSettings, provider: AiProviderInfo) => void;
  onDelete: (setting: AiProviderSettings) => void;
  onTest: (setting: AiProviderSettings) => void;
  onSetDefault: (setting: AiProviderSettings) => void;
}) {
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTest = async (setting: AiProviderSettings) => {
    setTestingId(setting.id);
    try {
      await onTest(setting);
    } finally {
      setTestingId(null);
    }
  };

  // Get all configured settings with their provider info
  const configuredSettings = (settings || []).map((setting) => {
    const provider = providers?.find((p) => p.id === setting.provider);
    return { setting, provider };
  });

  // Get unconfigured providers
  const configuredProviderIds = new Set((settings || []).map((s) => s.provider));
  const unconfiguredProviders = (providers || []).filter(
    (p) => !configuredProviderIds.has(p.id)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasNoConfigured = configuredSettings.length === 0;

  return (
    <div className="space-y-6">
      {/* Configured Providers */}
      {hasNoConfigured ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-linear-to-br from-muted/30 to-muted/10 p-12">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-2xl bg-linear-to-br from-violet-500/20 to-purple-500/20 p-4">
              <Sparkles className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No AI Providers Configured</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Connect an AI provider to enable intelligent log analysis, error detection, and automated troubleshooting suggestions.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(providers || []).slice(0, 3).map((provider) => {
                const meta = providerMeta[provider.id] || { bgColor: "bg-gray-500/10", color: "#888" };
                return (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className="gap-2"
                    onClick={() => onAdd(provider)}
                  >
                    <div className={cn("p-1 rounded", meta.bgColor)}>
                      <ProviderIcon providerId={provider.id} size="sm" />
                    </div>
                    {provider.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-0.5">
          {configuredSettings.map(({ setting, provider }) => {
            if (!provider) return null;
            const meta = providerMeta[provider.id] || { bgColor: "bg-gray-500/10", color: "#888" };
            const modelName = provider.models.find((m) => m.id === setting.model)?.name || setting.model;
            const isTesting = testingId === setting.id;
            const isConnected = setting.lastTestResult === "success";
            const hasFailed = setting.lastTestResult && setting.lastTestResult !== "success";

            return (
              <div
                key={setting.id}
                className={cn(
                  "group relative rounded-xl border bg-card transition-all duration-200",
                  "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
                )}
                style={setting.isDefault ? {
                  boxShadow: `0 0 0 2px ${meta.color}40`,
                } : undefined}
              >
                {/* Gradient accent bar - hidden when default since outline provides visual distinction */}
                {!setting.isDefault && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{
                      background: `linear-gradient(to right, ${meta.color}, ${meta.color}80)`
                    }}
                  />
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-3 rounded-xl transition-transform group-hover:scale-105",
                          meta.bgColor
                        )}
                        style={{ boxShadow: `0 4px 12px ${meta.color}20` }}
                      >
                        <ProviderIcon providerId={provider.id} size="md" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{setting.name}</h3>
                          {setting.isDefault && (
                            <Badge
                              className="text-[10px] px-1.5 border"
                              style={{
                                backgroundColor: `${meta.color}15`,
                                color: meta.color,
                                borderColor: `${meta.color}30`,
                              }}
                            >
                              <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          {provider.name}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(setting, provider)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Configuration
                        </DropdownMenuItem>
                        {!setting.isDefault && (
                          <DropdownMenuItem onClick={() => onSetDefault(setting)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(setting)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Model & Settings */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Model</span>
                      <code className="text-xs bg-muted/50 px-2 py-0.5 rounded-md font-mono">
                        {modelName}
                      </code>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="flex-1">
                        <span className="text-muted-foreground">Temp</span>
                        <div className="font-medium">{setting.temperature?.toFixed(1) ?? "0.7"}</div>
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground">Max Tokens</span>
                        <div className="font-medium">{setting.maxTokens?.toLocaleString() ?? "1,000"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      {setting.lastTestResult ? (
                        <>
                          <div className={cn(
                            "flex items-center gap-1.5 text-xs font-medium",
                            isConnected ? "text-emerald-500" : "text-red-500"
                          )}>
                            <div className={cn(
                              "h-2 w-2 rounded-full animate-pulse",
                              isConnected ? "bg-emerald-500" : "bg-red-500"
                            )} />
                            {isConnected ? "Connected" : "Failed"}
                          </div>
                          {setting.lastTestedAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(setting.lastTestedAt), { addSuffix: true })}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Not tested
                        </span>
                      )}
                    </div>

                    <Button
                      variant={hasFailed ? "destructive" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleTest(setting)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* Available Providers Section */}
      {unconfiguredProviders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Provider
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {unconfiguredProviders.map((provider) => {
              const meta = providerMeta[provider.id] || { bgColor: "bg-gray-500/10", color: "#888" };
              return (
                <button
                  key={provider.id}
                  onClick={() => onAdd(provider)}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg border bg-card/50",
                    "transition-all duration-200 hover:bg-card hover:shadow-md hover:border-muted-foreground/30",
                    "text-left"
                  )}
                >
                  <div
                    className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", meta.bgColor)}
                  >
                    <ProviderIcon providerId={provider.id} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{provider.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {provider.requiresApiKey ? "API Key" : "Local"}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AiUsageDashboard() {
  const { data: stats, isLoading: statsLoading } = useAiUsageStats();
  const { data: historyData, isLoading: historyLoading } = useAiAnalysisHistory({ limit: 20 });
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    id: string;
    provider: string;
    prompt: string;
    response: string;
    tokensUsed: number | null;
    createdAt: string;
    serverId: string | null;
  } | null>(null);

  if (statsLoading || historyLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No usage data yet. Start using AI features to see stats here.
      </div>
    );
  }

  // Calculate provider breakdown
  const providerEntries = Object.entries(stats.analysesByProvider);
  const totalFromProviders = providerEntries.reduce((sum, [, data]) => sum + data.count, 0);
  const last30DaysCount = stats.dailyUsage.reduce((sum, d) => sum + d.count, 0);
  const last30DaysTokens = stats.dailyUsage.reduce((sum, d) => sum + d.tokens, 0);

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // For chart: show last 14 days with proper spacing
  const chartDays = stats.dailyUsage.slice(-14);
  const maxCount = Math.max(...chartDays.map(d => d.count), 1);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Stats + Chart + Providers */}
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xl font-bold">{formatNumber(stats.totalAnalyses)}</div>
              <div className="text-[11px] text-muted-foreground">Total Analyses</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xl font-bold">{formatNumber(stats.totalTokens)}</div>
              <div className="text-[11px] text-muted-foreground">Total Tokens</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xl font-bold">{formatNumber(last30DaysCount)}</div>
              <div className="text-[11px] text-muted-foreground">Last 30 Days</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xl font-bold">{formatNumber(last30DaysTokens)}</div>
              <div className="text-[11px] text-muted-foreground">Tokens (30d)</div>
            </div>
          </div>

          {/* Chart */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Daily Activity</h3>
                <span className="text-xs text-muted-foreground">Last 14 days</span>
              </div>
              <div className="h-24">
                {chartDays.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No activity yet
                  </div>
                ) : (
                  <div className="h-full flex items-end gap-1">
                    {chartDays.map((day, index) => {
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                      const isToday = index === chartDays.length - 1;
                      return (
                        <Tooltip key={day.date}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex-1 rounded-t-lg transition-all cursor-pointer hover:opacity-80",
                                isToday ? "bg-primary" : day.count > 0 ? "bg-primary/50" : "bg-muted/30"
                              )}
                              style={{ height: `${Math.max(height, day.count > 0 ? 10 : 3)}%` }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <div className="font-medium">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div>{day.count} analyses · {day.tokens.toLocaleString()} tokens</div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
              {chartDays.length > 0 && (
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>{new Date(chartDays[0]?.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>Today</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Breakdown */}
          {providerEntries.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Usage by Provider</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {providerEntries.map(([provider, data]) => {
                    const percentage = totalFromProviders > 0
                      ? Math.round((data.count / totalFromProviders) * 100)
                      : 0;
                    const meta = providerMeta[provider as AiProviderType];

                    return (
                      <div key={provider} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                        {meta && (
                          <div className={cn("p-2 rounded-lg", meta.bgColor)}>
                            <ProviderIcon providerId={provider as AiProviderType} size="sm" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium capitalize text-sm">{provider}</div>
                          <div className="text-xs text-muted-foreground">
                            {data.count} ({percentage}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Analysis History */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">Analysis History</h3>
            {!historyData || historyData.data.length === 0 ? (
              <div className="text-muted-foreground text-sm py-8 text-center">
                No analyses yet
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {historyData.data.map((item) => {
                  const meta = providerMeta[item.provider as AiProviderType];
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedAnalysis(item)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {meta && (
                          <div className={cn("p-1.5 rounded shrink-0", meta.bgColor)}>
                            <ProviderIcon providerId={item.provider as AiProviderType} size="sm" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm line-clamp-2 group-hover:text-foreground transition-colors">
                            {item.prompt}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                            {item.tokensUsed && (
                              <>
                                <span>·</span>
                                <span>{item.tokensUsed.toLocaleString()} tokens</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Detail Modal */}
      <Dialog open={!!selectedAnalysis} onOpenChange={(open) => !open && setSelectedAnalysis(null)}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
          {selectedAnalysis && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-4">
                  {providerMeta[selectedAnalysis.provider as AiProviderType] && (
                    <div className={cn("p-3 rounded-xl", providerMeta[selectedAnalysis.provider as AiProviderType].bgColor)}>
                      <ProviderIcon providerId={selectedAnalysis.provider as AiProviderType} size="md" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold capitalize">{selectedAnalysis.provider} Analysis</h2>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(selectedAnalysis.createdAt).toLocaleString()}
                      </span>
                      {selectedAnalysis.tokensUsed && (
                        <span className="flex items-center gap-1.5">
                          <Coins className="h-3.5 w-3.5" />
                          {selectedAnalysis.tokensUsed.toLocaleString()} tokens
                        </span>
                      )}
                      {selectedAnalysis.serverId && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedAnalysis.serverId || '');
                            toast.success('Server ID copied');
                          }}
                          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                          <Server className="h-3.5 w-3.5" />
                          <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">{selectedAnalysis.serverId}</code>
                          <Copy className="h-3 w-3 opacity-50" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Prompt</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAnalysis.prompt);
                        toast.success('Prompt copied');
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30 text-sm whitespace-pre-wrap font-mono">
                    {selectedAnalysis.prompt}
                  </div>
                </div>

                {/* Response */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Response</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAnalysis.response);
                        toast.success('Response copied');
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30 prose prose-sm dark:prose-invert max-w-none">
                    <Markdown>{selectedAnalysis.response}</Markdown>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddEditProviderDialog({
  open,
  onClose,
  provider,
  setting,
}: {
  open: boolean;
  onClose: () => void;
  provider: AiProviderInfo | null;
  setting: AiProviderSettings | null;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    maxTokens: number;
    temperature: number;
    isDefault: boolean;
    isEnabled: boolean;
  }>({
    name: "",
    apiKey: "",
    baseUrl: "",
    model: "",
    maxTokens: 1000,
    temperature: 0.7,
    isDefault: false,
    isEnabled: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    responseTime?: number;
  } | null>(null);
  const [dynamicModels, setDynamicModels] = useState<AiModelInfo[] | null>(null);
  const [modelsFetched, setModelsFetched] = useState(false);
  const [autoFetchTriggered, setAutoFetchTriggered] = useState(false);
  const prevProviderIdRef = useRef<string | null>(null);

  const createMutation = useCreateAiProviderSetting();
  const updateMutation = useUpdateAiProviderSetting();
  const testMutation = useTestAiProvider();
  const fetchModelsMutation = useFetchAiProviderModels();

  // Reset form when provider/setting changes
  const providerId = provider?.id ?? null;
  if (providerId !== prevProviderIdRef.current) {
    prevProviderIdRef.current = providerId;
    if (provider) {
      const defaultBaseUrl = provider.id === 'ollama'
        ? 'http://localhost:11434'
        : provider.id === 'lmstudio'
          ? 'http://localhost:1234'
          : '';
      setFormData({
        name: setting?.name || `My ${provider.name}`,
        apiKey: "",
        baseUrl: setting?.baseUrl || defaultBaseUrl,
        model: setting?.model || (provider.models[0]?.id || ""),
        maxTokens: setting?.maxTokens || 1000,
        temperature: setting?.temperature || 0.7,
        isDefault: setting?.isDefault || false,
        isEnabled: setting?.isEnabled ?? true,
      });
      setTestResult(null);
      setShowApiKey(false);
      setDynamicModels(null);
      setModelsFetched(false);
      setAutoFetchTriggered(false);
    }
  }

  // Fetch models dynamically
  const handleFetchModels = async (showToast = false) => {
    if (!provider) return;

    // For providers requiring API key, we need it to fetch
    if (provider.requiresApiKey && !formData.apiKey) {
      if (showToast) toast.error("API key required to fetch models");
      return;
    }

    try {
      const models = await fetchModelsMutation.mutateAsync({
        provider: provider.id,
        apiKey: formData.apiKey || '',
        baseUrl: formData.baseUrl || undefined,
      });
      setDynamicModels(models);
      setModelsFetched(true);
      // If we got models and current selection isn't in the list, select first
      if (models.length > 0 && !models.find(m => m.id === formData.model)) {
        setFormData(prev => ({ ...prev, model: models[0].id }));
      }
      if (showToast) toast.success(`Found ${models.length} models`);
    } catch (err) {
      if (showToast) toast.error(err instanceof Error ? err.message : "Failed to fetch models");
      setModelsFetched(true);
    }
  };

  // Auto-fetch models for local providers when baseUrl is set
  const shouldAutoFetch = provider && !provider.requiresApiKey && formData.baseUrl && !autoFetchTriggered && !modelsFetched;
  if (shouldAutoFetch) {
    setAutoFetchTriggered(true);
    handleFetchModels(false);
  }

  // Use dynamic models if fetched, otherwise use provider fallback
  const availableModels = dynamicModels || provider?.models || [];

  const isEditing = !!setting;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isTesting = testMutation.isPending;

  const handleTest = async () => {
    if (!provider || !formData.apiKey) {
      toast.error("API key is required to test");
      return;
    }

    setTestResult(null);
    try {
      const result = await testMutation.mutateAsync({
        provider: provider.id,
        apiKey: formData.apiKey,
        model: formData.model,
        baseUrl: formData.baseUrl || undefined,
      });
      setTestResult(result);
      if (result.success) {
        toast.success(`Connected (${result.responseTime}ms)`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test failed");
    }
  };

  const handleSubmit = async () => {
    if (!provider) return;

    try {
      if (isEditing) {
        const updateData: UpdateAiProviderDto = {
          name: formData.name,
          model: formData.model,
          maxTokens: formData.maxTokens,
          temperature: formData.temperature,
          isDefault: formData.isDefault,
          isEnabled: formData.isEnabled,
        };
        if (formData.apiKey) updateData.apiKey = formData.apiKey;
        if (formData.baseUrl) updateData.baseUrl = formData.baseUrl;

        await updateMutation.mutateAsync({ id: setting.id, data: updateData });
        toast.success("Updated");
      } else {
        if (!formData.apiKey && provider.requiresApiKey) {
          toast.error("API key is required");
          return;
        }

        const createData: CreateAiProviderDto = {
          provider: provider.id,
          name: formData.name,
          apiKey: formData.apiKey,
          model: formData.model,
          maxTokens: formData.maxTokens,
          temperature: formData.temperature,
          isDefault: formData.isDefault,
          isEnabled: formData.isEnabled,
        };
        if (formData.baseUrl) createData.baseUrl = formData.baseUrl;

        await createMutation.mutateAsync(createData);
        toast.success("Configured");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  if (!provider) return null;

  const meta = providerMeta[provider.id] || { bgColor: "bg-gray-500/10" };
  const selectedModel = availableModels.find((m) => m.id === formData.model);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", meta.bgColor)}>
              <ProviderIcon providerId={provider.id} size="sm" />
            </div>
            {isEditing ? `Edit ${provider.name}` : `Configure ${provider.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* API Key - only show if provider requires it */}
          {provider.requiresApiKey && (
            <div className="space-y-1.5">
              <Label htmlFor="apiKey">
                API Key {isEditing && <span className="text-muted-foreground">(blank to keep)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={isEditing && setting?.hasApiKey ? "••••••••" : "sk-..."}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Base URL - show if provider supports it */}
          {provider.supportsBaseUrl && (
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">
                Base URL {provider.requiresApiKey && <span className="text-muted-foreground">(optional)</span>}
              </Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, baseUrl: e.target.value }));
                  // Reset model fetch state when base URL changes for local providers
                  if (!provider.requiresApiKey) {
                    setModelsFetched(false);
                    setAutoFetchTriggered(false);
                  }
                }}
                placeholder={
                  provider.id === 'ollama'
                    ? "http://localhost:11434"
                    : provider.id === 'lmstudio'
                      ? "http://localhost:1234"
                      : "https://api.openai.com/v1"
                }
              />
              {!provider.requiresApiKey && (
                <p className="text-xs text-muted-foreground">
                  Models will be auto-detected from this endpoint
                </p>
              )}
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="model">Model</Label>
              <div className="flex items-center gap-2">
                {dynamicModels && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {dynamicModels.length} detected
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={() => handleFetchModels(true)}
                  disabled={fetchModelsMutation.isPending || (provider?.requiresApiKey && !formData.apiKey)}
                >
                  {fetchModelsMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {dynamicModels ? "Refresh" : "Detect"}
                </Button>
              </div>
            </div>
            <Select
              value={formData.model}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, model: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel?.contextWindow && (
              <p className="text-xs text-muted-foreground">
                {selectedModel.contextWindow.toLocaleString()} tokens context
              </p>
            )}
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">{formData.temperature.toFixed(1)}</span>
            </div>
            <Slider
              value={[formData.temperature]}
              onValueChange={([value]) => setFormData((prev) => ({ ...prev, temperature: value }))}
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Max Tokens</Label>
              <span className="text-sm text-muted-foreground">{formData.maxTokens}</span>
            </div>
            <Slider
              value={[formData.maxTokens]}
              onValueChange={([value]) => setFormData((prev) => ({ ...prev, maxTokens: value }))}
              min={100}
              max={4000}
              step={100}
            />
          </div>

          {/* Set as Default */}
          <div className="flex items-center justify-between">
            <Label>Set as Default</Label>
            <Switch
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: checked }))}
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-sm",
                testResult.success
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {testResult.success ? `Connected (${testResult.responseTime}ms)` : testResult.message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleTest} disabled={isTesting || (!formData.apiKey && provider.requiresApiKey)}>
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
            Test
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProviderInfo | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<AiProviderSettings | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<AiProviderSettings | null>(null);

  const { data: providers, isLoading: providersLoading } = useAvailableAiProviders();
  const { data: settings, isLoading: settingsLoading } = useAiProviderSettings();
  const deleteMutation = useDeleteAiProviderSetting();
  const updateMutation = useUpdateAiProviderSetting();
  const testMutation = useTestAiProviderSetting();

  const handleAddProvider = (provider: AiProviderInfo) => {
    setSelectedProvider(provider);
    setSelectedSetting(null);
    setDialogOpen(true);
  };

  const handleEditProvider = (setting: AiProviderSettings, provider: AiProviderInfo) => {
    setSelectedProvider(provider);
    setSelectedSetting(setting);
    setDialogOpen(true);
  };

  const handleDeleteProvider = (setting: AiProviderSettings) => {
    setSettingToDelete(setting);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!settingToDelete) return;
    try {
      await deleteMutation.mutateAsync(settingToDelete.id);
      toast.success("Deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
    setDeleteConfirmOpen(false);
    setSettingToDelete(null);
  };

  const handleTestProvider = async (setting: AiProviderSettings) => {
    try {
      const result = await testMutation.mutateAsync(setting.id);
      if (result.success) {
        toast.success(`Connected (${result.responseTime}ms)`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  const handleSetDefault = async (setting: AiProviderSettings) => {
    try {
      await updateMutation.mutateAsync({
        id: setting.id,
        data: { isDefault: true },
      });
      toast.success("Set as default");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  };

  const isLoading = providersLoading || settingsLoading;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <Tabs defaultValue="providers" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="mb-4 shrink-0">
          <TabsTrigger value="providers" className="gap-2">
            <Zap className="h-4 w-4" />
            AI Providers
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="flex-1 min-h-0 overflow-auto mt-0">
          <AiProvidersGrid
            providers={providers}
            settings={settings}
            isLoading={isLoading}
            onAdd={handleAddProvider}
            onEdit={handleEditProvider}
            onDelete={handleDeleteProvider}
            onTest={handleTestProvider}
            onSetDefault={handleSetDefault}
          />
        </TabsContent>

        <TabsContent value="usage" className="flex-1 min-h-0 overflow-auto mt-0">
          <AiUsageDashboard />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <AddEditProviderDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedProvider(null);
          setSelectedSetting(null);
        }}
        provider={selectedProvider}
        setting={selectedSetting}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete &quot;{settingToDelete?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
