import React from 'react';
import { motion } from 'framer-motion';
import { ParticleBackground } from '../ParticleBackground';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-vectra-dark relative overflow-hidden">
      <ParticleBackground />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Vectra PDF
            </h1>
            <div className="w-16 h-1 bg-gradient-primary mx-auto rounded-full"></div>
          </motion.div>

          {/* Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-2xl p-8 backdrop-blur-xl"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-vectra-text-primary mb-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-vectra-text-secondary text-sm">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-6 text-xs text-vectra-text-secondary"
          >
            <p>© 2024 Vectra PDF. Powered by AI.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};