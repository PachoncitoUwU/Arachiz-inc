import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Coffee, ArrowLeft, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

// Estados posibles que Wompi envía por URL
// ?id=<transaction_id>&status=APPROVED|DECLINED|PENDING|ERROR
const STATUS_CONFIG = {
  APPROVED: {
    icon: <CheckCircle size={64} className="text-green-500" />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    title: '¡Gracias por tu apoyo! 🎉',
    subtitle: 'Tu donación fue procesada exitosamente.',
    message: 'Tu aporte ayuda a mantener y mejorar Arachiz. ¡Significa mucho!',
    color: 'text-green-600',
  },
  DECLINED: {
    icon: <XCircle size={64} className="text-red-500" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    title: 'Pago rechazado',
    subtitle: 'No se pudo procesar tu donación.',
    message: 'Verifica los datos de tu tarjeta o intenta con otro método de pago.',
    color: 'text-red-600',
  },
  VOIDED: {
    icon: <XCircle size={64} className="text-red-500" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    title: 'Pago anulado',
    subtitle: 'La transacción fue anulada.',
    message: 'Si crees que esto es un error, intenta de nuevo.',
    color: 'text-red-600',
  },
  PENDING: {
    icon: <Clock size={64} className="text-amber-500" />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    title: 'Pago en proceso',
    subtitle: 'Tu donación está siendo verificada.',
    message: 'Esto puede tardar unos minutos. Te notificaremos cuando se confirme.',
    color: 'text-amber-600',
  },
  ERROR: {
    icon: <XCircle size={64} className="text-gray-500" />,
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    title: 'Algo salió mal',
    subtitle: 'Ocurrió un error inesperado.',
    message: 'Por favor intenta de nuevo. Si el problema persiste, contáctanos.',
    color: 'text-gray-600',
  },
};

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const [transaction, setTransaction] = useState(null);
  const [loadingTx, setLoadingTx] = useState(false);

  // Wompi envía estos parámetros en la redirectUrl
  const transactionId = searchParams.get('id');
  const statusParam   = searchParams.get('status')?.toUpperCase();
  const reference     = searchParams.get('reference');
  const amountParam   = searchParams.get('amount_in_cents');

  // Intentar obtener detalles de la transacción desde Wompi (público)
  useEffect(() => {
    if (!transactionId) return;

    const fetchTransaction = async () => {
      setLoadingTx(true);
      try {
        const res = await fetch(
          `https://api.wompi.co/v1/transactions/${transactionId}`
        );
        if (res.ok) {
          const data = await res.json();
          setTransaction(data.data);
        }
      } catch {
        // Si falla, usamos los params de la URL directamente
      } finally {
        setLoadingTx(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  // Determinar el estado final
  const finalStatus = transaction?.status || statusParam || 'ERROR';
  const config = STATUS_CONFIG[finalStatus] || STATUS_CONFIG.ERROR;

  // Monto: preferir el de la transacción, luego el de la URL
  const amountCents = transaction?.amount_in_cents || parseInt(amountParam) || null;
  const amountCOP   = amountCents ? amountCents / 100 : null;

  // Referencia
  const finalReference = transaction?.reference || reference;

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-zinc-900 flex items-center justify-center p-4">
      {/* Decoración fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full opacity-30" />
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-green-100 dark:bg-green-900/20 rounded-full opacity-20" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card principal */}
        <div className="bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-700  dark:border-zinc-700">

          {/* Header con color según estado */}
          <div className={`${config.bg} ${config.border} border-b px-6 sm:px-8 py-8 sm:py-10 text-center`}>
            {loadingTx ? (
              <Loader size={64} className="text-gray-400 animate-spin mx-auto" />
            ) : (
              <div className="flex justify-center mb-4">{config.icon}</div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white  dark:text-white mt-2">{config.title}</h1>
            <p className={`text-sm font-medium mt-1 ${config.color}`}>{config.subtitle}</p>
          </div>

          {/* Cuerpo */}
          <div className="px-6 sm:px-8 py-6 space-y-5">

            {/* Badge de estado */}
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${config.badge}`}>
                {finalStatus === 'APPROVED' && '✅'}
                {finalStatus === 'DECLINED' && '❌'}
                {finalStatus === 'VOIDED'   && '🚫'}
                {finalStatus === 'PENDING'  && '⏳'}
                {finalStatus === 'ERROR'    && '⚠️'}
                {finalStatus}
              </span>
            </div>

            {/* Detalles de la transacción */}
            {(amountCOP || finalReference || transactionId) && (
              <div className="bg-gray-50 dark:bg-zinc-700 rounded-xl p-5 space-y-3 text-sm">
                {amountCOP && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Monto donado</span>
                    <span className="font-bold text-gray-900 dark:text-white  dark:text-white text-lg">
                      ${amountCOP.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                )}
                {finalReference && (
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-zinc-700  dark:border-zinc-600 pt-3">
                    <span className="text-gray-500 dark:text-gray-400">Referencia</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-zinc-600 px-2 py-1 rounded">
                      {finalReference}
                    </span>
                  </div>
                )}
                {transactionId && (
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-zinc-700  dark:border-zinc-600 pt-3">
                    <span className="text-gray-500 dark:text-gray-400">ID Transacción</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-zinc-600 px-2 py-1 rounded">
                      {transactionId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje */}
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center leading-relaxed">
              {config.message}
            </p>

            {/* Mensaje especial para APPROVED */}
            {finalStatus === 'APPROVED' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
                <Coffee size={24} className="text-amber-500 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  ¡Recibí tu café! Gracias por apoyar el proyecto Arachiz ☕
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col gap-3 pt-2">
              {(finalStatus === 'DECLINED' || finalStatus === 'ERROR' || finalStatus === 'VOIDED') && (
                <Link
                  to="/login"
                  className="w-full bg-[#4285F4] text-white py-3 rounded-xl font-semibold text-sm text-center hover:bg-[#3367d6] transition-colors active:scale-95"
                >
                  Intentar de nuevo
                </Link>
              )}

              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                <ArrowLeft size={16} />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          Pago procesado de forma segura por{' '}
          <span className="font-semibold text-gray-500 dark:text-gray-400">Wompi</span>
        </p>
      </div>
    </div>
  );
}
