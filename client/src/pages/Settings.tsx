import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMoon, FiSun, FiType, FiUser, FiShield, FiBell, FiDownload } from 'react-icons/fi';
import { ParticleBackground } from '../components/ParticleBackground';
import { Button } from '../components/ui/button-enhanced';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Appearance',
      icon: <FiMoon />,
      settings: [
        {
          label: 'Dark Mode',
          description: 'Use dark theme for better readability',
          control: (
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
          )
        },
        {
          label: 'Font Size',
          description: 'Adjust text size for better readability',
          control: (
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          )
        }
      ]
    },
    {
      title: 'Notifications',
      icon: <FiBell />,
      settings: [
        {
          label: 'Push Notifications',
          description: 'Receive notifications for processing updates',
          control: (
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          )
        }
      ]
    },
    {
      title: 'Data & Privacy',
      icon: <FiShield />,
      settings: [
        {
          label: 'Auto-save Sessions',
          description: 'Automatically save your chat sessions',
          control: (
            <Switch
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          )
        },
        {
          label: 'Export Data',
          description: 'Download all your data and chat history',
          control: (
            <Button variant="outline" size="sm" icon={<FiDownload size={16} />}>
              Export
            </Button>
          )
        }
      ]
    }
  ];

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
              <h1 className="text-xl font-semibold text-vectra-text-primary">Settings</h1>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-primary">{section.icon}</div>
                <h2 className="text-lg font-medium text-vectra-text-primary">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-4">
                {section.settings.map((setting, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-vectra-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-vectra-text-primary mb-1">
                        {setting.label}
                      </h3>
                      <p className="text-sm text-vectra-text-secondary">
                        {setting.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {setting.control}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-lg font-medium text-vectra-text-primary mb-6 flex items-center space-x-3">
              <FiUser className="text-primary" />
              <span>Account</span>
            </h2>

            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                Delete Account
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;