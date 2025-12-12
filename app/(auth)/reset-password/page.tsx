// app/(auth)/reset-password/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card from '@/components/ui/card';
import { requestPasswordReset } from '@/lib/supabase/auth';
import { isValidEmail } from '@/lib/utils';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Invalid email address');
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to send reset email. Please try again.');
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ShopManager</h1>
          </div>

          <Card className="p-6">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                We've sent a password reset link to:
              </p>
              <p className="text-sm font-medium text-gray-900 mb-6">{email}</p>
              <p className="text-sm text-gray-600 mb-6">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Send Another Email
                </Button>
                <Link href="/login">
                  <Button variant="secondary" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ShopManager</h1>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        {/* Reset Form Card */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="your@email.com"
                error={error}
                disabled={isLoading}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </Card>

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
