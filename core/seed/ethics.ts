import { ICognitivePlan } from '../brain-os/cognitive-bus';

export interface IEthicalDecisionLog {
  decisionId: string;
  timestamp: Date;
  correlationId: string;
  contextInput: string;
  selectedAction: string;
  rejectedAlternatives: {
    action: string;
    rejectionReason: string;
    ethicalScore: number; // 0 - 100
  }[];
  appliedEthicalPrinciples: string[];
  justificationNotes: string;
}

export interface IEthicalEvaluationResult {
  isApproved: boolean;
  ethicalAlignmentIndex: number; // 0.0 - 1.0
  rejectionReason?: string;
  justification: string;
  flaggedPrinciples: string[];
}

/**
 * Interfaz para el Ethical Reasoning Layer (ERL).
 * 
 * Evalúa planes cognitivos a nivel de impacto ético y cumplimiento de prioridades.
 */
export interface IEthicalReasoningLayer {
  /**
   * Evalúa éticamente un plan cognitivo propuesto antes de ser firmado y ejecutado.
   */
  evaluatePlan(plan: ICognitivePlan, correlationId: string): Promise<IEthicalEvaluationResult>;

  /**
   * Registra una auditoría de decisión ética en el histórico de persistencia.
   */
  logEthicalDecision(log: IEthicalDecisionLog): Promise<void>;
}
