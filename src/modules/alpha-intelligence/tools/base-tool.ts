export interface IAiTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: Record<string, any>;
    }>;
    required?: string[];
  };
  execute(args: any): Promise<any>;
}
