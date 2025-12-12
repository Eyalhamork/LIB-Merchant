// app/(dashboard)/customers/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useCustomer } from '@/hooks/use-customers';
import {
  updateCustomer,
  deactivateCustomer,
  activateCustomer,
} from '@/lib/supabase/customers';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import { CustomerForm } from '@/components/customers/customer-form';
import { CreditHistory } from '@/components/customers/credit-history';
import { RecordPaymentModal } from '@/components/customers/record-payment-modal';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  DollarSign,
  TrendingUp,
  UserX,
  UserCheck,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { profile } = useAuth();
  const customerId = params.id as string;
  const { customer, isLoading, refresh } = useCustomer(customerId);
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const hasCredit = customer && customer.credit_balance > 0;
  const isNearLimit =
    customer &&
    customer.credit_limit &&
    customer.credit_balance >= customer.credit_limit * 0.9;

  const handleToggleStatus = async () => {
    if (!customer || !profile?.shop_id) return;

    setIsUpdating(true);

    try {
      if (customer.is_active) {
        await deactivateCustomer(customer.id, profile.shop_id);
        toast.success('Customer deactivated');
      } else {
        await activateCustomer(customer.id, profile.shop_id);
        toast.success('Customer activated');
      }
      refresh();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Customer not found</p>
          <Link href="/customers">
            <Button variant="secondary">Back to Customers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                {!customer.is_active && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Inactive
                  </Badge>
                )}
                {hasCredit && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    Has Credit
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">Customer Details</p>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Edit Mode */}
        {isEditing && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Customer
            </h2>
            <CustomerForm
              shopId={profile!.shop_id}
              customer={customer}
              onSuccess={() => {
                setIsEditing(false);
                refresh();
              }}
              onCancel={() => setIsEditing(false)}
            />
          </Card>
        )}

        {/* View Mode */}
        {!isEditing && (
          <>
            {/* Credit Balance (if applicable) */}
            {hasCredit && (
              <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-700 font-medium">
                        Credit Balance
                      </p>
                      <p className="text-3xl font-bold text-amber-900">
                        {formatCurrency(customer.credit_balance)}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowPaymentModal(true)}>
                    Record Payment
                  </Button>
                </div>

                {customer.credit_limit && (
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-amber-200">
                    <span className="text-amber-700">Credit Limit</span>
                    <span className="font-medium text-amber-900">
                      {formatCurrency(customer.credit_limit)}
                    </span>
                  </div>
                )}

                {isNearLimit && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Customer is near credit limit</span>
                  </div>
                )}
              </Card>
            )}

            {/* Customer Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>

              <div className="space-y-4">
                {/* Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{customer.phone}</p>
                      </div>
                    </div>
                  )}

                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{customer.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {customer.address && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{customer.address}</p>
                    </div>
                  </div>
                )}

                {customer.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{customer.notes}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Purchase Statistics */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Purchase Statistics
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Total Purchases</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatCurrency(customer.total_purchases)}
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 font-medium">Credit Used</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">
                    {formatCurrency(customer.total_credit_used)}
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Credit Paid</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {formatCurrency(customer.total_credit_paid)}
                  </p>
                </div>
              </div>

              {/* Last Activity */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                {customer.last_purchase_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Purchase</span>
                    <span className="font-medium text-gray-900">
                      {formatRelativeTime(customer.last_purchase_at)}
                    </span>
                  </div>
                )}
                {customer.last_payment_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Payment</span>
                    <span className="font-medium text-gray-900">
                      {formatRelativeTime(customer.last_payment_at)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment History */}
            <CreditHistory customerId={customer.id} />

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

              <div className="flex flex-col gap-3">
                {customer.is_active ? (
                  <Button
                    variant="secondary"
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                    className="w-full sm:w-auto"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate Customer
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                    className="w-full sm:w-auto"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate Customer
                  </Button>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && customer && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          customer={customer}
          onSuccess={() => {
            refresh();
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}
