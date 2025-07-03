import React from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export function ResetPasswordPage() {
  // Extract token from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
          <p className="text-gray-300">No reset token provided</p>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}