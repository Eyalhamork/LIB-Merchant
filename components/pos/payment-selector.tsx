// components/pos/payment-selector.tsx

'use client';

import { DollarSign, Smartphone, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/types';

interface PaymentSelectorProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  usedMethods?: PaymentMethod[];
}

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: 'cash',
    label: 'Cash',
    icon: DollarSign,
    color: 'green',
  },
  {
    value: 'mtn_momo',
    label: 'MTN MoMo',
    icon: Smartphone,
    color: 'yellow',
  },
  {
    value: 'orange_money',
    label: 'Orange Money',
    icon: Smartphone,
    color: 'orange',
  },
  {
    value: 'credit',
    label: 'Credit',
    icon: CreditCard,
    color: 'red',
  },
];

export function PaymentSelector({
  selectedMethod,
  onChange,
  disabled = false,
  usedMethods = [],
}: PaymentSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.value;
        const isUsed = usedMethods.includes(method.value);
        const isDisabled = disabled || isUsed;

        return (
          <button
            key={method.value}
            onClick={() => !isDisabled && onChange(method.value)}
            disabled={isDisabled}
            className={cn(
              'relative p-4 rounded-lg border-2 transition-all',
              isSelected && !isDisabled
                ? 'border-emerald-500 bg-emerald-50'
                : isDisabled
                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center',
                  method.color === 'green' && 'bg-green-100',
                  method.color === 'yellow' && 'bg-yellow-100',
                  method.color === 'orange' && 'bg-orange-100',
                  method.color === 'red' && 'bg-red-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    method.color === 'green' && 'text-green-600',
                    method.color === 'yellow' && 'text-yellow-600',
                    method.color === 'orange' && 'text-orange-600',
                    method.color === 'red' && 'text-red-600'
                  )}
                />
              </div>

              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-emerald-700' : 'text-gray-700'
                )}
              >
                {method.label}
              </span>

              {isUsed && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  Used
                </span>
              )}
            </div>

            {/* Selection Indicator */}
            {isSelected && !isDisabled && (
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
