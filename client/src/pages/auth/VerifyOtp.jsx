import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout/AuthLayout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const email = location.state?.email;
  
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
      await verifyOtp(email, otpString);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email);
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3">
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
              className={`
                w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl outline-none transition-all
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                border-2 focus:ring-4 focus:ring-brand-500/20
                ${error 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500'}
              `}
            />
          ))}
        </div>

        {error && (
          <div className="flex justify-center items-center text-red-600 dark:text-red-400 text-sm font-medium">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <Button type="submit" fullWidth isLoading={isLoading} className="mt-4">
          Verify Email
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Didn't receive the code?{' '}
        <button 
          onClick={handleResend}
          className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 transition-colors"
        >
          Click to resend
        </button>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
