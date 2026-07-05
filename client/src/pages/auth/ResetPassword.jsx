import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout/AuthLayout';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const initialEmail = location.state?.email || '';

  const [formData, setFormData] = useState({ email: initialEmail, otp: '', newPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialEmail) {
      navigate('/forgot-password');
    }
  }, [initialEmail, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(formData.email, formData.otp, formData.newPassword);
      navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Enter your 6-digit reset code and a new secure password."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Email address"
          name="email"
          type="email"
          value={formData.email}
          disabled
          required
        />
        <Input
          label="Reset code"
          name="otp"
          type="text"
          maxLength={6}
          value={formData.otp}
          onChange={handleChange}
          placeholder="000000"
          required
        />
        <Input
          label="New Password"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="••••••••"
          helperText="Must be at least 8 characters with upper, lower, number, and symbol"
          required
        />

        {error && <div className="error-text" style={{ fontSize: '14px' }}>{error}</div>}

        <Button type="submit" fullWidth isLoading={isLoading} style={{ marginTop: '8px' }}>
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
