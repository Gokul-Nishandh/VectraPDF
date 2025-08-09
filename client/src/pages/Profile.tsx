import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiGithub } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import { ParticleBackground } from '../components/ParticleBackground';
import { Button } from '../components/ui/button-enhanced';
import { Input } from '../components/ui/input-enhanced';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

export const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    avatar: '',
    connectedAccounts: {
      google: true,
      github: false
    }
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const toggleConnection = (provider: 'google' | 'github') => {
    setProfile(prev => ({
      ...prev,
      connectedAccounts: {
        ...prev.connectedAccounts,
        [provider]: !prev.connectedAccounts[provider]
      }
    }));
    
    toast({
      title: `${provider === 'google' ? 'Google' : 'GitHub'} ${profile.connectedAccounts[provider] ? 'disconnected' : 'connected'}`,
      description: `Your ${provider} account has been ${profile.connectedAccounts[provider] ? 'disconnected' : 'connected'}.`,
    });
  };

  return (
    <div className="min-h-screen bg-vectra-dark relative overflow-hidden">
      <ParticleBackground />
      
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 glass border-b border-vectra-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                ← Back
              </Button>
              <h1 className="text-xl font-semibold text-vectra-text-primary">Profile</h1>
            </div>
            
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} icon={<FiSave size={16} />}>
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Picture Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass rounded-xl p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white hover:bg-primary/90 transition-colors">
                    <FiCamera size={16} />
                  </button>
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-vectra-text-primary mb-2">
                {profile.name}
              </h2>
              <p className="text-sm text-vectra-text-secondary">
                {profile.email}
              </p>
            </div>
          </motion.div>

          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            
            {/* Personal Information */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-medium text-vectra-text-primary mb-6 flex items-center space-x-2">
                <FiUser className="text-primary" />
                <span>Personal Information</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vectra-text-primary mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-vectra-surface/50 border-vectra-border"
                    />
                  ) : (
                    <p className="text-vectra-text-secondary">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-vectra-text-primary mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-vectra-surface/50 border-vectra-border"
                    />
                  ) : (
                    <p className="text-vectra-text-secondary">{profile.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-vectra-text-primary mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-vectra-surface/50 border-vectra-border"
                    />
                  ) : (
                    <p className="text-vectra-text-secondary">{profile.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-medium text-vectra-text-primary mb-6">
                Connected Accounts
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-vectra-border/30">
                  <div className="flex items-center space-x-3">
                    <FaGoogle className="text-red-500" size={20} />
                    <div>
                      <p className="font-medium text-vectra-text-primary">Google</p>
                      <p className="text-sm text-vectra-text-secondary">
                        {profile.connectedAccounts.google ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={profile.connectedAccounts.google ? "outline" : "primary"}
                    size="sm"
                    onClick={() => toggleConnection('google')}
                  >
                    {profile.connectedAccounts.google ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-vectra-border/30">
                  <div className="flex items-center space-x-3">
                    <FiGithub className="text-gray-400" size={20} />
                    <div>
                      <p className="font-medium text-vectra-text-primary">GitHub</p>
                      <p className="text-sm text-vectra-text-secondary">
                        {profile.connectedAccounts.github ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={profile.connectedAccounts.github ? "outline" : "primary"}
                    size="sm"
                    onClick={() => toggleConnection('github')}
                  >
                    {profile.connectedAccounts.github ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;