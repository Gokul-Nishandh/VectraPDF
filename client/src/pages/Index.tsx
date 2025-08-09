import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiFileText, FiTarget, FiZap } from 'react-icons/fi';
import { ParticleBackground } from '../components/ParticleBackground';
import { Button } from '../components/ui/button-enhanced';

const Index = () => {
  return (
    <div className="min-h-screen bg-vectra-dark relative overflow-hidden">
      <ParticleBackground />
      
      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold text-gradient mb-6">
              Vectra PDF
            </h1>
            <p className="text-xl md:text-2xl text-vectra-text-secondary mb-8 max-w-2xl mx-auto">
              Transform your PDFs into actionable insights with AI-powered analysis tailored to your specific needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/signup">
              <Button variant="primary" size="xl" icon={<FiArrowRight />}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="glass" size="xl">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="glass rounded-xl p-6 hover-glow">
              <FiFileText size={32} className="text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-vectra-text-primary mb-2">
                Smart Upload
              </h3>
              <p className="text-sm text-vectra-text-secondary">
                Simply drag and drop your PDF files for instant processing
              </p>
            </div>

            <div className="glass rounded-xl p-6 hover-glow">
              <FiTarget size={32} className="text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-vectra-text-primary mb-2">
                Persona-Driven
              </h3>
              <p className="text-sm text-vectra-text-secondary">
                Get insights tailored to your specific role and objectives
              </p>
            </div>

            <div className="glass rounded-xl p-6 hover-glow">
              <FiZap size={32} className="text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-vectra-text-primary mb-2">
                AI-Powered
              </h3>
              <p className="text-sm text-vectra-text-secondary">
                Advanced AI extracts only the most relevant information
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
