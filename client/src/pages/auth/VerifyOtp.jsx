import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout/AuthLayout';
import Button from '../../components/ui/Button/Button';
import { useAuth } from '../../context/AuthContext';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const email = location.state?.email;
  const userId = location.state?.userId;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    if (error) setError('');

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(userId, otpString);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(userId);
      alert('A new code has been sent.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to resend code');
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              style={{
                width: '45px',
                height: '55px',
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: '600',
                borderRadius: '8px',
                border: `1px solid ${error ? 'var(--error)' : 'var(--border-subtle)'}`,
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? 'var(--error)' : 'var(--border-subtle)';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        {error && <div className="error-text" style={{ fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <Button type="submit" fullWidth isLoading={isLoading}>
          Verify
        </Button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
        Didn't receive the code?{' '}
        <button 
          onClick={handleResend}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
        >
          Resend
        </button>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
