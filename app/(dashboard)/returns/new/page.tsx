// app/(dashboard)/returns/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { FindTransactionStep } from '@/components/returns/find-transaction-step';
import { SelectItemsStep } from '@/components/returns/select-items-step';
import { RefundMethodStep } from '@/components/returns/refund-method-step';
import { ExchangeItemsStep } from '@/components/returns/exchange-items-step';
import { useAuth } from '@/hooks/use-auth';
import { processReturn, processExchange } from '@/lib/supabase/returns';
import { toast } from 'sonner';
import type { Transaction, ReturnReason, RefundMethod, PaymentMethod } from '@/types';

type ProcessStep = 'find' | 'items' | 'refund' | 'exchange';

interface ReturnItem {
  shop_product_id: string;
  product_name: string;
  quantity: number;
  max_quantity: number;
  price_at_sale: number;
  reason: ReturnReason | '';
  reason_notes: string;
  restore_to_stock: boolean;
}

interface ExchangeItem {
  shop_product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  available_quantity: number;
  unit: string;
}

export default function NewReturnPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ProcessStep>('find');
  const [isProcessing, setIsProcessing] = useState(false);

  // Data state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('cash');
  const [notes, setNotes] = useState('');

  // Exchange state
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [exchangePaymentMethod, setExchangePaymentMethod] = useState<PaymentMethod | undefined>();
  const [exchangeAmountGiven, setExchangeAmountGiven] = useState<number | undefined>();

  const handleTransactionSelected = (transaction: Transaction) => {
    setSelectedTransaction(transaction);

    // Initialize return items from transaction items
    if (transaction.items) {
      const items: ReturnItem[] = transaction.items.map((item) => ({
        shop_product_id: item.shop_product_id,
        product_name: item.shop_product?.product?.name || 'Unknown Product',
        quantity: 0, // User will set this
        max_quantity: item.quantity,
        price_at_sale: item.price_at_sale,
        reason: '',
        reason_notes: '',
        restore_to_stock: true,
      }));
      setReturnItems(items);
    }

    setCurrentStep('items');
  };

  const handleItemsSelected = (items: ReturnItem[]) => {
    setReturnItems(items);
    setCurrentStep('refund');
  };

  const handleRefundMethodSelected = async (method: RefundMethod, returnNotes: string) => {
    setRefundMethod(method);
    setNotes(returnNotes);

    // If exchange is selected, go to exchange items step
    if (method === 'exchange') {
      setCurrentStep('exchange');
      return;
    }

    // Otherwise, process regular return
    await processRegularReturn(method, returnNotes);
  };

  const processRegularReturn = async (method: RefundMethod, returnNotes: string) => {
    if (!selectedTransaction || !user) return;

    // Filter items with quantity > 0
    const itemsToReturn = returnItems.filter((item) => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    // Validate all items have reasons
    const missingReasons = itemsToReturn.filter((item) => !item.reason);
    if (missingReasons.length > 0) {
      toast.error('Please select a reason for all returned items');
      return;
    }

    // Validate "other" reasons have notes
    const missingNotes = itemsToReturn.filter(
      (item) => item.reason === 'other' && !item.reason_notes
    );
    if (missingNotes.length > 0) {
      toast.error('Please provide notes for items with "Other" reason');
      return;
    }

    setIsProcessing(true);

    try {
      await processReturn({
        shop_id: user.profile.shop_id,
        original_transaction_id: selectedTransaction.id,
        employee_id: user.id,
        customer_id: selectedTransaction.customer_id,
        cash_session_id: selectedTransaction.cash_session_id,
        refund_method: method,
        items: itemsToReturn.map((item) => ({
          shop_product_id: item.shop_product_id,
          quantity: item.quantity,
          price_at_sale: item.price_at_sale,
          reason: item.reason as ReturnReason,
          reason_notes: item.reason_notes,
          restore_to_stock: item.restore_to_stock,
        })),
        notes: returnNotes,
      });

      toast.success('Return processed successfully');
      router.push('/returns');
    } catch (error) {
      console.error('Process return error:', error);
      toast.error('Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExchangeComplete = async (
    items: ExchangeItem[],
    paymentMethod?: PaymentMethod,
    amountGiven?: number
  ) => {
    if (!selectedTransaction || !user) return;

    // Filter items with quantity > 0
    const itemsToReturn = returnItems.filter((item) => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    if (items.length === 0) {
      toast.error('Please select at least one item to exchange');
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate payment due
      const returnTotal = itemsToReturn.reduce(
        (sum, item) => sum + item.quantity * item.price_at_sale,
        0
      );
      const exchangeTotal = items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const paymentDue = exchangeTotal - returnTotal;

      await processExchange({
        shop_id: user.profile.shop_id,
        original_transaction_id: selectedTransaction.id,
        employee_id: user.id,
        customer_id: selectedTransaction.customer_id,
        cash_session_id: selectedTransaction.cash_session_id,
        refund_method: 'exchange',
        items: itemsToReturn.map((item) => ({
          shop_product_id: item.shop_product_id,
          quantity: item.quantity,
          price_at_sale: item.price_at_sale,
          reason: item.reason as ReturnReason,
          reason_notes: item.reason_notes,
          restore_to_stock: item.restore_to_stock,
        })),
        notes,
        exchange_items: items,
        payment_due: paymentDue,
        payment_method: paymentMethod,
        amount_given: amountGiven,
      });

      toast.success('Exchange processed successfully');
      router.push('/returns');
    } catch (error) {
      console.error('Process exchange error:', error);
      toast.error('Failed to process exchange');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'items') {
      setCurrentStep('find');
      setSelectedTransaction(null);
      setReturnItems([]);
    } else if (currentStep === 'refund') {
      setCurrentStep('items');
    } else if (currentStep === 'exchange') {
      setCurrentStep('refund');
      setExchangeItems([]);
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'find':
        return 1;
      case 'items':
        return 2;
      case 'refund':
        return 3;
      case 'exchange':
        return 4;
      default:
        return 1;
    }
  };

  const getTotalSteps = () => {
    return refundMethod === 'exchange' && currentStep === 'exchange' ? 4 : 3;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Process Return</h1>
        <p className="text-sm text-gray-600 mt-1">
          {currentStep === 'exchange'
            ? 'Select items to exchange for'
            : 'Find the transaction and select items to return'}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {getStepNumber()} of {getTotalSteps()}
          </span>
          <span className="text-sm text-gray-500">
            {currentStep === 'find' && 'Find Transaction'}
            {currentStep === 'items' && 'Select Items'}
            {currentStep === 'refund' && 'Refund Method'}
            {currentStep === 'exchange' && 'Exchange Items'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(getStepNumber() / getTotalSteps()) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <Card className="p-6">
        {currentStep === 'find' && (
          <FindTransactionStep
            shopId={user?.profile.shop_id || ''}
            onTransactionSelected={handleTransactionSelected}
          />
        )}

        {currentStep === 'items' && selectedTransaction && (
          <SelectItemsStep
            transaction={selectedTransaction}
            returnItems={returnItems}
            onItemsSelected={handleItemsSelected}
            onBack={handleBack}
          />
        )}

        {currentStep === 'refund' && selectedTransaction && (
          <RefundMethodStep
            transaction={selectedTransaction}
            returnItems={returnItems.filter((item) => item.quantity > 0)}
            onProcess={handleRefundMethodSelected}
            onBack={handleBack}
            isProcessing={isProcessing}
          />
        )}

        {currentStep === 'exchange' && selectedTransaction && (
          <ExchangeItemsStep
            returnItems={returnItems.filter((item) => item.quantity > 0)}
            onComplete={handleExchangeComplete}
            onBack={handleBack}
            isProcessing={isProcessing}
          />
        )}
      </Card>
    </div>
  );
}
