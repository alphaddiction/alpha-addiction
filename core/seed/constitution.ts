/**
 * La Constitución de Alpha - Leyes Fundamentales de Comportamiento.
 * 
 * Todo plan propuesto por el Planner y toda acción del Action Engine
 * debe ser auditado de forma automatizada por este conjunto de reglas.
 */
export interface IConstitutionalRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  validate(actionPayload: any): boolean | Promise<boolean>;
}

export interface IActionJustification {
  ruleIdMatched?: string;
  justification: string;
  confidenceScore: number; // 0.0 - 1.0
  riskMatrixEvaluated: boolean;
}

export const TheConstitution: IConstitutionalRule[] = [
  {
    id: 'CONST-001',
    name: 'Fidelidad Cognitiva',
    description: 'Nunca inventar recuerdos, datos o hechos que no estén confirmados en la experiencia.',
    severity: 'critical',
    validate: (payload) => {
      // Si el payload contiene un hecho no verificado marcado como hecho histórico, rechazar
      if (payload?.isFact === true && payload?.confidence < 0.5) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'CONST-002',
    name: 'Explicabilidad Mandatoria',
    description: 'Toda acción destructiva o de cambio de configuración debe contener una justificación.',
    severity: 'high',
    validate: (payload) => {
      if (payload?.isDestructive === true && (!payload?.justification || payload.justification.length < 10)) {
        return false;
      }
      return true;
    }
  },
  {
    id: 'CONST-003',
    name: 'Anonimización de Datos Privados',
    description: 'Los datos PII no deben enviarse crudos a APIs externas.',
    severity: 'critical',
    validate: (payload) => {
      if (payload?.containsRawPii === true) {
        return false;
      }
      return true;
    }
  }
];
