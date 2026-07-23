export interface ProjectContext {
  id: string;
  name: string;
  domain: string;
  description: string;
}

export class ProjectLayer {
  private static projects: Record<string, ProjectContext> = {
    'alpha-addiction': {
      id: 'alpha-addiction',
      name: 'Alpha Addiction',
      domain: 'alphaaddiction.es',
      description: 'Tienda de moda de lujo minimalista y drops de edición limitada.'
    },
    'iably': {
      id: 'iably',
      name: 'IAbly',
      domain: 'iably.ai',
      description: 'Plataforma SaaS de agentes y soluciones B2B inteligentes.'
    },
    'foedus': {
      id: 'foedus',
      name: 'Foedus',
      domain: 'foedus.co',
      description: 'Red federada de comercio electrónico y consorcios digitales.'
    }
  };

  /**
   * Resuelve el contexto del proyecto activo.
   */
  static getProject(projectId?: string): ProjectContext {
    const activeId = projectId || process.env.NEXT_PUBLIC_PROJECT_ID || 'alpha-addiction';
    return this.projects[activeId] || this.projects['alpha-addiction'];
  }

  /**
   * Obtiene la lista de todos los proyectos registrados en el ecosistema.
   */
  static getAllProjects(): ProjectContext[] {
    return Object.values(this.projects);
  }
}
