import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout/AuthLayout';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to request reset');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={`If an account exists for ${email}, we sent a password reset code.`}
        footerText="Remember your password?"
        footerLinkText="Sign in"
        footerLinkTo="/login"
      >
        <Button 
          fullWidth 
          onClick={() => navigate('/reset-password', { state: { email } })}
        >
          Enter Reset Code
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email to receive a password reset code."
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Email address"
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com"
          required
        />
        
        {error && <div className="error-text" style={{ fontSize: '14px' }}>{error}</div>}

        <Button type="submit" fullWidth isLoading={isLoading} style={{ marginTop: '8px' }}>
          Send Reset Code
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
