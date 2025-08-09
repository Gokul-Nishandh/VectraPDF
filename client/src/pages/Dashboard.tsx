import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiFileText, FiUser, FiLogOut, FiSettings, FiTarget, FiDownload, FiVolume2, FiEye, FiClock } from 'react-icons/fi';
import { ParticleBackground } from '../components/ParticleBackground';
import { Button } from '../components/ui/button-enhanced';
import { useToast } from '../hooks/use-toast';
import { ProcessingModal } from '../components/ProcessingModal';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [persona, setPersona] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = (files: File[]) => {
    const validFiles = files.filter(file => file.type === 'application/pdf');
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: `${invalidFiles.length} file(s) were not PDF format and were skipped.`,
        variant: "destructive"
      });
    }
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded",
        description: `${validFiles.length} PDF file(s) uploaded successfully.`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files));
    }
  };

  const handleProcess = () => {
    if (uploadedFiles.length === 0 || !persona.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload at least one PDF and provide a persona/task.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockResults = [
        "Key Insight 1: Combined analysis shows important financial projections for Q4 2024.",
        "Key Insight 2: Revenue is expected to increase by 15% compared to the previous quarter.",
        "Key Insight 3: The marketing budget allocation shows a focus on digital channels.",
        "Key Insight 4: Customer acquisition costs have decreased by 8% year-over-year.",
        "Key Insight 5: Documents highlight three strategic initiatives for market expansion.",
        "Key Insight 6: Cross-document analysis reveals consistent growth trends.",
        "Key Insight 7: Risk factors are well-documented across multiple sources."
      ];
      
      setResults(mockResults);
      setIsProcessing(false);
      setShowProcessingModal(true);
    }, 3000);
  };

  const speakResults = () => {
    if ('speechSynthesis' in window && results.length > 0) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const text = results.join('. ');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
      
      toast({
        title: "Reading results",
        description: "Text-to-speech is reading your insights aloud.",
      });
    } else {
      toast({
        title: "Speech not supported",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive"
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
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
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-gradient">Vpdf</h1>
              <Button variant="ghost" size="sm" icon={<FiClock size={18} />} onClick={() => navigate('/history')}>
                History
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" icon={<FiSettings size={18} />} onClick={() => navigate('/settings')}>
                Settings
              </Button>
              <div className="flex items-center space-x-2 px-3 py-2 glass rounded-lg cursor-pointer" onClick={() => navigate('/profile')}>
                <FiUser size={18} className="text-vectra-text-secondary" />
                <span className="text-sm text-vectra-text-primary">John Doe</span>
              </div>
              <Button variant="ghost" size="sm" icon={<FiLogOut size={18} />} onClick={() => navigate('/login')}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                
                <h2 className="text-xl font-semibold text-vectra-text-primary mb-2">
                  Upload PDF Documents
                </h2>
                <p className="text-sm text-vectra-text-secondary">
                  Upload multiple PDF files to extract AI-powered insights
                </p>
              </div>
              
              {uploadedFiles.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<FiEye size={16} />}
                  onClick={() => navigate('/pdf-preview')}
                >
                  Preview ({uploadedFiles.length})
                </Button>
              )}
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-vectra-border hover:border-primary/50'
              } ${uploadedFiles.length > 0 ? 'bg-vectra-surface/30' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              {uploadedFiles.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <FiFileText size={48} className="mx-auto text-primary" />
                  <div>
                    <p className="font-medium text-vectra-text-primary">
                      {uploadedFiles.length} PDF file{uploadedFiles.length > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-vectra-text-secondary">
                      {uploadedFiles.map(f => f.name).join(', ')}
                    </p>
                    <p className="text-xs text-vectra-text-secondary mt-1">
                      Total: {(uploadedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFiles([])}
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/pdf-preview')}
                    >
                      Preview Files
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <FiUpload size={48} className="mx-auto text-vectra-text-secondary mb-4" />
                  <div className="space-y-2">
                    <p className="text-vectra-text-primary font-medium">
                      Drop your PDF file here, or click to browse
                    </p>
                    <p className="text-sm text-vectra-text-secondary">
                      Maximum file size: 50MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="primary" size="lg" className="mt-4" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            {/* Persona Input */}
            <div>
              <label className="block text-sm font-medium text-vectra-text-primary mb-2">
                <FiTarget className="inline mr-2" />
                Persona / Task Description
              </label>
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Describe your role or the specific task you want to accomplish with this PDF (e.g., 'Summarize for a student', 'Extract marketing insights', 'Prepare executive summary')"
                className="w-full h-32 p-4 rounded-lg bg-vectra-surface/50 border border-vectra-border text-vectra-text-primary placeholder:text-vectra-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              />  
            </div>

            {/* Process Button */}
            <Button
              variant="primary"
              size="xl"
              className="w-full"
              onClick={handleProcess}
              loading={isProcessing}
              disabled={uploadedFiles.length === 0 || !persona.trim()}
            >
              {isProcessing ? 'Processing PDF...' : 'Extract Insights'}
            </Button>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-vectra-text-primary mb-2">
                Extracted Insights
              </h2>
              <p className="text-sm text-vectra-text-secondary">
                AI-powered insights tailored to your persona
              </p>
            </div>

            {/* Results Display */}
            <div className="glass rounded-xl p-6 min-h-[400px]">
              {isProcessing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full space-y-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                  />
                  <p className="text-vectra-text-secondary">
                    Processing your PDF with AI...
                  </p>
                </motion.div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-vectra-text-primary">
                      Key Insights ({results.length})
                    </h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" icon={<FiVolume2 size={16} />} onClick={speakResults}>
                        Listen
                      </Button>
                      <Button variant="outline" size="sm" icon={<FiDownload size={16} />}>
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="p-4 bg-vectra-surface/30 rounded-lg border border-vectra-border/50 hover:border-primary/30 transition-colors"
                      >
                        <p className="text-vectra-text-primary text-sm leading-relaxed">
                          {result}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <FiFileText size={48} className="text-vectra-text-secondary/50" />
                  <div>
                    <p className="text-vectra-text-secondary mb-2">
                      No insights yet
                    </p>
                    <p className="text-sm text-vectra-text-secondary/70">
                      Upload PDF files and provide a persona to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      <ProcessingModal
        isOpen={showProcessingModal}
        onOpenChange={setShowProcessingModal}
        onViewResults={() => {
          setShowProcessingModal(false);
          // Results are already visible, could scroll to them
        }}
        fileName={uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : undefined}
        persona={persona}
      />
    </div>
  );
};

export default Dashboard;