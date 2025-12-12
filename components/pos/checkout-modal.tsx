// components/pos/checkout-modal.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/store/cart-store';
import { useOfflineStore } from '@/store/offline-store';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { CustomerSelector } from '@/components/pos/customer-selector';
import { PaymentSelector } from '@/components/pos/payment-selector';
import { SplitPayment } from '@/components/pos/split-payment';
import { CashCalculator } from '@/components/pos/cash-calculator';
import { ReceiptPreview } from '@/components/pos/receipt-preview';
import { createSale } from '@/lib/supabase/pos';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ShoppingCart,
  User,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { CashSession, Customer, PaymentEntry, PaymentMethod, Transaction } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cashSession: CashSession | null;
}

type CheckoutStep = 'customer' | 'payment' | 'receipt';

export default function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  cashSession,
}: CheckoutModalProps) {
  const { profile } = useAuth();
  const { isOnline } = useOfflineStore();
  const {
    items,
    customer,
    setCustomer,
    discountAmount,
    getSubtotal,
    getTotal,
  } = useCartStore();

  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(
    null
  );
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - paidAmount;

  // Check if credit payment is included
  const hasCreditPayment = payments.some((p) => p.method === 'credit');

  const handleCustomerSelected = (selectedCustomer: Customer | null) => {
    setCustomer(selectedCustomer);
    setShowCustomerSelector(false);
  };

  const handlePaymentsComplete = (paymentEntries: PaymentEntry[]) => {
    setPayments(paymentEntries);
  };

  const handleCompleteSale = async () => {
    // Validation
    if (remaining > 0) {
      toast.error('Payment amount is insufficient');
      return;
    }

    if (hasCreditPayment && !customer) {
      toast.error('Please select a customer for credit sale');
      setCurrentStep('customer');
      return;
    }

    if (!profile?.shop_id || !profile?.id) {
      toast.error('User profile not found');
      return;
    }

    setIsProcessing(true);

    try {
      // Create sale
      const transaction = await createSale({
        shop_id: profile.shop_id,
        employee_id: profile.id,
        customer_id: customer?.id,
        cash_session_id: cashSession?.id,
        items: items.map((item) => ({
          shop_product_id: item.shop_product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        payments: payments,
        discount_amount: discountAmount,
        notes: '',
      });

      setCompletedTransaction(transaction);
      setCurrentStep('receipt');
      
      toast.success('Sale completed successfully!');
    } catch (error: any) {
      console.error('Complete sale error:', error);
      toast.error(error.message || 'Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (currentStep === 'receipt') {
      // Sale completed, trigger success
      onSuccess();
    } else {
      // Not completed, just close
      onClose();
    }
  };

  const handleNewSale = () => {
    onSuccess();
  };

  const getStepIcon = (step: CheckoutStep) => {
    switch (step) {
      case 'customer':
        return User;
      case 'payment':
        return CreditCard;
      case 'receipt':
        return Receipt;
    }
  };

  const StepIcon = getStepIcon(currentStep);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <StepIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStep === 'customer' && 'Customer Selection'}
              {currentStep === 'payment' && 'Payment'}
              {currentStep === 'receipt' && 'Receipt'}
            </h3>
            <p className="text-sm text-gray-500">
              {currentStep === 'customer' && 'Optional: Select customer for credit'}
              {currentStep === 'payment' && 'Complete payment for sale'}
              {currentStep === 'receipt' && 'Sale completed successfully'}
            </p>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        {currentStep !== 'receipt' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'customer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-green-600 text-white'
                }`}
              >
                {currentStep === 'customer' ? '1' : <CheckCircle className="h-5 w-5" />}
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep === 'customer' ? 'text-gray-900' : 'text-green-600'
                }`}
              >
                Customer
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-gray-200 mx-4" />

            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'payment'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${
                  currentStep === 'payment' ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                Payment
              </span>
            </div>
          </div>
        )}

        {/* Sale Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Items:</span>
            <span className="font-medium text-gray-900">{items.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'customer' && (
          <div className="space-y-4">
            {/* Selected Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer (Optional)
              </label>
              {customer ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    )}
                    {customer.credit_balance > 0 && (
                      <p className="text-sm text-amber-600">
                        Current balance: {formatCurrency(customer.credit_balance)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setCustomer(null)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerSelector(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Select Customer
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Customer selection is optional</p>
                <p>
                  Only required if the sale includes credit payment. For cash or mobile
                  money sales, you can skip customer selection.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setCurrentStep('payment')} className="flex-1">
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'payment' && (
          <div className="space-y-4">
            {/* Split Payment Component */}
            <SplitPayment
              totalAmount={total}
              onPaymentsChange={handlePaymentsComplete}
              requireCustomer={hasCreditPayment && !customer}
            />

            {/* Warning if credit but no customer */}
            {hasCreditPayment && !customer && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Customer Required</p>
                  <p>
                    You have selected credit as a payment method. Please go back and
                    select a customer.
                  </p>
                </div>
              </div>
            )}

            {/* Offline Warning */}
            {!isOnline && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Offline Mode</p>
                  <p>
                    This sale will be queued and synced when connection is restored.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep('customer')}
                disabled={isProcessing}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCompleteSale}
                disabled={remaining > 0 || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Spinner className="mr-2" />
                    Processing...
                  </>
                ) : (
                  'Complete Sale'
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'receipt' && completedTransaction && (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Sale Completed!</p>
                <p className="text-sm text-green-700">
                  Receipt #{completedTransaction.receipt_number}
                </p>
              </div>
            </div>

            {/* Receipt Preview */}
            <ReceiptPreview transaction={completedTransaction} />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={handleNewSale} className="flex-1">
                New Sale
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <CustomerSelector
          isOpen={showCustomerSelector}
          onClose={() => setShowCustomerSelector(false)}
          onSelect={handleCustomerSelected}
          shopId={profile?.shop_id || ''}
        />
      )}
    </Modal>
  );
}
