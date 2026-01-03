'use client';

import { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  Send,
  Loader2,
  Users,
  MonitorPlay,
  Clock,
  FileText,
  Lightbulb,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { cn } from '@/lib/utils';

// Types matching backend response
export interface StructuredAnalysis {
  rootCause: {
    identified: boolean;
    confidence: number;
    summary: string;
    explanation: string;
    evidence: string[];
  };
  impact: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    summary: string;
    usersAffected: number;
    sessionsAffected: number;
  };
  recommendations: {
    priority: number;
    action: string;
    rationale: string;
    effort: 'low' | 'medium' | 'high';
    commands?: string[];
  }[];
  investigation: string[];
  additionalNotes?: string;
}

export interface AnalysisMetadata {
  provider: string;
  model: string;
  tokensUsed: number;
  generatedAt: string | Date;
  contextSummary: {
    occurrencesIncluded: number;
    stackTracesIncluded: number;
    usersIncluded: number;
    sessionsIncluded: number;
  };
}

interface AnalysisDisplayProps {
  analysis: StructuredAnalysis;
  metadata: AnalysisMetadata;
  onFollowUp?: (question: string) => Promise<void>;
  isLoading?: boolean;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let label = 'High';

  if (confidence >= 80) {
    variant = 'default';
    label = 'High Confidence';
  } else if (confidence >= 50) {
    variant = 'secondary';
    label = 'Medium Confidence';
  } else {
    variant = 'outline';
    label = 'Low Confidence';
  }

  return (
    <Badge variant={variant} className="gap-1">
      <span className="text-xs font-medium">{confidence}%</span>
      <span className="text-xs opacity-80">{label}</span>
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, { className: string; icon: typeof AlertCircle }> = {
    critical: { className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
    high: { className: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
    medium: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
    low: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Info },
  };

  const config = variants[severity] || variants.medium;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1', config.className)}>
      <Icon className="h-3 w-3" />
      <span className="capitalize">{severity}</span>
    </Badge>
  );
}

function EffortBadge({ effort }: { effort: string }) {
  const variants: Record<string, string> = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <Badge variant="outline" className={cn('text-xs', variants[effort] || variants.medium)}>
      {effort} effort
    </Badge>
  );
}

function FollowUpInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}) {
  const [question, setQuestion] = useState('');

  const handleSubmit = () => {
    if (question.trim() && !disabled) {
      onSubmit(question.trim());
      setQuestion('');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Ask a follow-up question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="flex-1"
      />
      <Button
        onClick={handleSubmit}
        disabled={disabled || !question.trim()}
        size="icon"
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function AnalysisDisplay({
  analysis,
  metadata,
  onFollowUp,
  isLoading,
  conversationHistory,
}: AnalysisDisplayProps) {
  const handleFollowUp = async (question: string) => {
    if (onFollowUp) {
      await onFollowUp(question);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with confidence badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Analysis
        </h3>
        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={analysis.rootCause.confidence} />
          <span className="text-xs text-muted-foreground">
            {metadata.tokensUsed.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* Context Summary */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {metadata.contextSummary.occurrencesIncluded} occurrences analyzed
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {metadata.contextSummary.usersIncluded} users
        </div>
        <div className="flex items-center gap-1">
          <MonitorPlay className="h-3 w-3" />
          {metadata.contextSummary.sessionsIncluded} sessions
        </div>
        {metadata.contextSummary.stackTracesIncluded > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {metadata.contextSummary.stackTracesIncluded} stack traces
          </div>
        )}
      </div>

      {/* Root Cause Card */}
      <Card
        className={cn(
          'border-l-4',
          analysis.rootCause.identified
            ? 'border-l-green-500'
            : 'border-l-yellow-500'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Root Cause
            </h4>
            {analysis.rootCause.identified ? (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Identified
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Uncertain
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium mb-3">{analysis.rootCause.summary}</p>
          <MarkdownRenderer content={analysis.rootCause.explanation} />
          {analysis.rootCause.evidence.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Evidence:</p>
              <ul className="space-y-1">
                {analysis.rootCause.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impact Card */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Impact Assessment
          </h4>
          <div className="flex items-center gap-4 mb-3">
            <SeverityBadge severity={analysis.impact.severity} />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {analysis.impact.usersAffected} users affected
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MonitorPlay className="h-4 w-4" />
              {analysis.impact.sessionsAffected} sessions affected
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{analysis.impact.summary}</p>
        </CardContent>
      </Card>

      {/* Recommendations Accordion */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Recommendations ({analysis.recommendations.length})
            </h4>
            <Accordion type="single" collapsible className="space-y-2">
              {analysis.recommendations.map((rec, i) => (
                <AccordionItem key={i} value={`rec-${i}`} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-left">
                      <Badge variant="outline" className="shrink-0">
                        P{rec.priority}
                      </Badge>
                      <span className="flex-1">{rec.action}</span>
                      <EffortBadge effort={rec.effort} />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <p className="text-sm text-muted-foreground mb-3">
                      {rec.rationale}
                    </p>
                    {rec.commands && rec.commands.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Commands:
                        </p>
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono">
                          {rec.commands.join('\n')}
                        </pre>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Investigation Steps - Checklist */}
      {analysis.investigation.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Investigation Steps
            </h4>
            <div className="space-y-3">
              {analysis.investigation.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Checkbox id={`step-${i}`} className="mt-0.5" />
                  <label
                    htmlFor={`step-${i}`}
                    className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                  >
                    {step}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {analysis.additionalNotes && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Additional Notes
            </h4>
            <MarkdownRenderer content={analysis.additionalNotes} />
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      {conversationHistory && conversationHistory.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Conversation History</h4>
            <div className="space-y-4">
              {conversationHistory.slice(1).map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-3 rounded-lg',
                    msg.role === 'user'
                      ? 'bg-primary/10 ml-8'
                      : 'bg-muted mr-8'
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </p>
                  {msg.role === 'assistant' ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Input */}
      {onFollowUp && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Ask a Follow-up Question</h4>
            <FollowUpInput onSubmit={handleFollowUp} disabled={isLoading} />
          </CardContent>
        </Card>
      )}

      {/* Metadata Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>
          Analyzed by {metadata.provider} ({metadata.model})
        </span>
        <span>
          {new Date(metadata.generatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
