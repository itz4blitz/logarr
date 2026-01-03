/**
 * Structured AI analysis response types
 * The AI returns JSON matching these types, which are then
 * parsed and validated before being sent to the frontend
 */

export interface StructuredAnalysis {
  rootCause: {
    identified: boolean;
    confidence: number; // 0-100
    summary: string;
    explanation: string; // Markdown
    evidence: string[];
  };
  impact: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    summary: string;
    usersAffected: number;
    sessionsAffected: number;
  };
  recommendations: Recommendation[];
  investigation: string[];
  additionalNotes?: string; // Markdown
}

export interface Recommendation {
  priority: number; // 1-5 (1 = highest priority)
  action: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  commands?: string[];
}

export interface AnalysisMetadata {
  provider: string;
  model: string;
  tokensUsed: number;
  generatedAt: Date;
  contextSummary: {
    occurrencesIncluded: number;
    stackTracesIncluded: number;
    usersIncluded: number;
    sessionsIncluded: number;
  };
}

export interface AnalysisResult {
  analysis: StructuredAnalysis;
  metadata: AnalysisMetadata;
  conversationId?: string; // For follow-ups
}

export interface FollowUpResult {
  conversationId: string;
  response: string; // Markdown
  tokensUsed: number;
}

/**
 * Conversation message for follow-up support
 * Note: timestamp is stored as string in JSON (ISO format)
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string format for JSON storage
  tokensUsed?: number;
}

/**
 * Raw AI response before parsing (for debugging/logging)
 */
export interface RawAIResponse {
  content: string;
  tokensUsed: number;
  provider: string;
  model: string;
}
