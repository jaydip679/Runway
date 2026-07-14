import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Camera, Mail, User, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ name: user?.name || '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleNameChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');
    setError('');
    
    try {
      const res = await apiClient.patch('/users/me', { name: formData.name });
      setUser(res.data.data);
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    try {
      const res = await apiClient.post('/users/me/avatar', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data.data);
      setMessage('Avatar updated successfully');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${user.avatarUrl}`) 
    : null;

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Profile Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your identity and contact information.</p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {/* Avatar Section */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div 
            className="relative w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer group shrink-0 shadow-sm"
            onClick={handleAvatarClick}
            title="Click to change avatar"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            ) : avatarUrl ? (
              <>
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </>
            ) : (
              <>
                <span className="text-4xl font-heading font-semibold text-gray-400 dark:text-gray-500">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center dark:bg-white/5">
                  <UploadCloud className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>
              </>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden"
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">Profile Avatar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Upload a picture to personalize your account. Recommended size: 256x256px.
            </p>
            <Button variant="secondary" size="sm" onClick={handleAvatarClick} isLoading={isUploading}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Change Avatar
            </Button>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-800"></div>

        {/* Profile Info Section */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                  Email address
                </label>
                <Input 
                  value={user?.email || ''}
                  disabled
                  helperText={user?.authProvider === 'GOOGLE' ? 'Managed securely by Google' : ''}
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <User className="w-4 h-4 mr-1.5 text-gray-400" />
                  Full name
                </label>
                <Input 
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {message && (
              <div className="flex items-center p-4 rounded-lg bg-finance-50 dark:bg-finance-900/30 text-finance-700 dark:text-finance-400 border border-finance-100 dark:border-finance-800/50">
                <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}
            
            {error && (
              <div className="flex items-center p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="submit" isLoading={isUpdating}>
                Save changes
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
