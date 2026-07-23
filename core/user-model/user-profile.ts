/**
 * Modelo Cognitivo Dinámico de Usuario.
 * 
 * Se actualiza de forma pasiva ante observaciones recogidas.
 */
export interface IUserProfile {
  userId: string;
  name: string;
  communicationPreference: {
    format: 'detailed_technical' | 'bullet_points_executive' | 'conversational_friendly';
    languagePreference: string; // ej: "es-ES"
    estimatedReadingSpeedWordsPerMinute: number;
  };
  inferredHabits: {
    peakActivityHourStart: number; // 0-23
    peakActivityHourEnd: number;
    preferredPlatforms: ('web' | 'mobile' | 'admin')[];
  };
  businessGoals: {
    id: string;
    description: string;
    priority: 'low' | 'normal' | 'high';
    status: 'pending' | 'in_progress' | 'achieved';
  }[];
  detectedPatterns: string[];
}

export interface IUserObservation {
  id: string;
  timestamp: Date;
  userId: string;
  observedAction: string;
  inferredValue: string;
  confidence: number; // 0.0 - 1.0
}

export interface IUserModelManager {
  /**
   * Obtiene el perfil dinámico actual del usuario.
   */
  getProfile(userId: string): Promise<IUserProfile>;

  /**
   * Agrega una observación pasiva al log de comportamiento.
   */
  addObservation(observation: IUserObservation): Promise<void>;

  /**
   * Refina el perfil consolidando observaciones mediante thresholds estadísticos.
   */
  consolidateUserProfile(userId: string): Promise<IUserProfile>;
}
