export interface ExperimentData {
  protocol: string;
  image: File | null;
  imagePreview: string | null;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  markdown: string;
}

export interface LabTimer {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  planned: string;
  actual: string;
  observation: string;
}

export interface ReagentCheckResult {
  safe: boolean;
  message: string;
  bottleName?: string;
  expiryDate?: string;
  concentration?: string;
}

export interface RoastResult {
  verdict: string;
  critique: string;
  score: number; // 1-10
}

export interface CostAnalysis {
  totalCost: string; // e.g. "$45.00"
  currency: string;
  riskySteps: Array<{
    stepIndex: number; // 1-based
    reagent: string;
    cost: string;
    reason: string;
  }>;
}