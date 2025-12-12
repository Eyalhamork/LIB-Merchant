// components/pos/cash-calculator.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface CashCalculatorProps {
  amount: number;
  onComplete: (amountGiven: number, change: number) => void;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100, 200, 500, 1000];

export function CashCalculator({ amount, onComplete }: CashCalculatorProps) {
  const [amountGiven, setAmountGiven] = useState('');

  const given = parseFloat(amountGiven) || 0;
  const change = given - amount;

  const handleQuickAmount = (value: number) => {
    setAmountGiven(value.toString());
  };

  const handleExactAmount = () => {
    setAmountGiven(amount.toFixed(2));
  };

  const handleComplete = () => {
    if (given >= amount) {
      onComplete(given, change);
    }
  };

  const canComplete = given >= amount;

  return (
    <div className="space-y-4">
      {/* Amount Due */}
      <div className="bg-emerald-50 p-4 rounded-lg">
        <p className="text-sm text-emerald-700 mb-1">Amount Due</p>
        <p className="text-3xl font-bold text-emerald-900">{formatCurrency(amount)}</p>
      </div>

      {/* Amount Given Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Cash Given
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amountGiven}
          onChange={(e) => setAmountGiven(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-3 text-2xl text-center font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quick Amount Buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Quick Amounts (LRD):</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <Button
              key={value}
              variant="secondary"
              onClick={() => handleQuickAmount(value)}
              className="text-sm"
            >
              {value}
            </Button>
          ))}
        </div>
        <Button
          variant="secondary"
          onClick={handleExactAmount}
          className="w-full"
        >
          Exact Amount
        </Button>
      </div>

      {/* Change Display */}
      {given > 0 && (
        <div
          className={`p-4 rounded-lg ${
            change >= 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}
        >
          <p
            className={`text-sm mb-1 ${
              change >= 0 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {change >= 0 ? 'Change' : 'Insufficient'}
          </p>
          <p
            className={`text-3xl font-bold ${
              change >= 0 ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {change >= 0 ? formatCurrency(change) : formatCurrency(amount - given) + ' short'}
          </p>
        </div>
      )}

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        disabled={!canComplete}
        className="w-full py-3 text-base"
      >
        {canComplete ? 'Complete Payment' : 'Enter Amount'}
      </Button>
    </div>
  );
}
