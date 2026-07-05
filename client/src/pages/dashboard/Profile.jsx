import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';

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
    
    // Preview validation
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
    <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <h2 style={{ marginBottom: '24px' }}>My Profile</h2>
      
      <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Avatar Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div 
            style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'var(--bg-surface-hover)', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={handleAvatarClick}
            title="Click to change avatar"
          >
            {isUploading ? (
              <span className="btn-spinner" style={{ borderColor: 'var(--primary)' }} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '32px', color: 'var(--text-muted)' }}>{user?.name?.charAt(0).toUpperCase()}</span>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileChange}
            />
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Avatar</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 12px 0' }}>
              Upload a picture to personalize your account.
            </p>
            <Button variant="secondary" size="sm" onClick={handleAvatarClick} isLoading={isUploading}>
              Change Avatar
            </Button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0' }} />

        {/* Profile Info Section */}
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Email address"
            value={user?.email || ''}
            disabled
            helperText={user?.authProvider === 'GOOGLE' ? 'Managed by Google' : ''}
          />
          <Input 
            label="Full name"
            value={formData.name}
            onChange={handleNameChange}
            required
          />

          {message && <div style={{ color: 'var(--success)', fontSize: '14px', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: '4px' }}>{message}</div>}
          {error && <div className="error-text" style={{ fontSize: '14px' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="submit" isLoading={isUpdating}>
              Save changes
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Profile;
