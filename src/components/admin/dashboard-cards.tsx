import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

export function MetricCard({ title, value, change, changeType, icon: Icon }: MetricCardProps) {
  return (
    <div className="bg-[#121212] border border-white/5 p-6 hover:border-white/10 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase font-semibold">
          {title}
        </span>
        <span className="bg-white/5 text-[var(--primary)] p-2 rounded">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-serif font-bold text-[#f5f5f0]">{value}</h3>
        {change && (
          <p className="text-[10px] mt-2 tracking-wider">
            <span
              className={`
                font-semibold mr-1.5
                ${changeType === 'positive' ? 'text-green-500' : ''}
                ${changeType === 'negative' ? 'text-red-500' : ''}
                ${changeType === 'neutral' ? 'text-[var(--muted)]' : ''}
              `}
            >
              {change}
            </span>
            <span className="text-[var(--muted)]">vs ayer</span>
          </p>
        )}
      </div>
    </div>
  );
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  details?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface IntegrationsStatusProps {
  services: ServiceStatus[];
}

export function IntegrationsStatus({ services }: IntegrationsStatusProps) {
  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'Operativo';
      case 'offline':
        return 'Caído';
      case 'degraded':
        return 'Degradado';
    }
  };

  return (
    <div className="bg-[#121212] border border-white/5 p-6 shadow-sm">
      <h2 className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase font-bold mb-6 pb-3 border-b border-white/5">
        Estado de Integraciones
      </h2>
      <div className="space-y-4">
        {services.map(service => {
          const ServiceIcon = service.icon;
          return (
            <div key={service.name} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <span className="bg-white/5 p-1.5 rounded text-[#f5f5f0]/80">
                  <ServiceIcon className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-semibold text-[#f5f5f0]">{service.name}</span>
                  {service.details && (
                    <span className="text-[9px] text-[var(--muted)] block tracking-wider mt-0.5">
                      {service.details}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-wider font-medium text-[#f5f5f0]/80">
                  {getStatusText(service.status)}
                </span>
                {getStatusIcon(service.status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
