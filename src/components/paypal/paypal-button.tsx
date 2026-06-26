'use client';

import { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { CartItem } from '@/context/cart-context';
import { ShippingAddress } from '@/types/order';
import { Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  shippingAddress: ShippingAddress;
  items: CartItem[];
  onValidate: () => boolean;
  onSuccess: (localOrderId: string) => void;
  onError: (errorMessage: string) => void;
}

export default function PayPalButton({
  shippingAddress,
  items,
  onValidate,
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch PayPal client ID on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/paypal/config');
        if (!response.ok) throw new Error('Failed to load PayPal client configuration');
        const data = await response.json();
        setClientId(data.clientId);
      } catch (err) {
        console.error('❌ Error loading PayPal Config:', err);
        onError('No se pudo cargar la configuración de PayPal. Por favor, inténtelo de nuevo.');
      } finally {
        setIsLoadingConfig(false);
      }
    }
    loadConfig();
  }, [onError]);

  if (isLoadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--foreground)]" />
        <span className="text-xs tracking-widest text-[var(--foreground)]/50 uppercase">
          Cargando métodos de pago...
        </span>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="text-center text-xs tracking-widest text-red-500 uppercase py-4 border border-red-500/20 bg-red-500/5">
        Error al inicializar la pasarela de pago.
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <span className="text-xs tracking-widest text-[var(--foreground)] uppercase font-medium">
            Procesando pago y preparando pedido...
          </span>
          <span className="text-[10px] text-[var(--foreground)]/50 tracking-wider text-center max-w-[280px]">
            Por favor, no cierres esta ventana ni recargues la página.
          </span>
        </div>
      )}

      <PayPalScriptProvider
        options={{
          clientId: clientId,
          currency: 'EUR',
          intent: 'capture',
        }}
      >
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'black',
            shape: 'rect',
            label: 'pay',
          }}
          disabled={isProcessing}
          onClick={(data, actions) => {
            // Trigger parent form validation
            const isValid = onValidate();
            if (!isValid) {
              return actions.reject();
            }
            return actions.resolve();
          }}
          createOrder={async () => {
            try {
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  shippingAddress,
                  items,
                }),
              });

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create PayPal order');
              }

              const data = await res.json();
              return data.paypalOrderId;
            } catch (err) {
              console.error('❌ PayPal button createOrder error:', err);
              onError((err as Error).message || 'Error al iniciar la transacción con PayPal.');
              throw err;
            }
          }}
          onApprove={async (data) => {
            setIsProcessing(true);
            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paypalOrderId: data.orderID,
                  shippingAddress,
                  items,
                }),
              });

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to capture PayPal order');
              }

              const result = await res.json();
              onSuccess(result.orderId);
            } catch (err) {
              console.error('❌ PayPal button onApprove error:', err);
              onError((err as Error).message || 'Error al capturar el pago. Contacta con soporte.');
            } finally {
              setIsProcessing(false);
            }
          }}
          onError={(err: unknown) => {
            console.error('❌ PayPal button onError:', err);
            onError('Se produjo un error durante el proceso de pago. Vuelve a intentarlo.');
          }}
          onCancel={() => {
            console.log('PayPal transaction canceled by customer');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
