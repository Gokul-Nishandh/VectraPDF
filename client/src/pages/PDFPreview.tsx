import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiTrash2, FiEye, FiDownload, FiUpload } from 'react-icons/fi';
import { ParticleBackground } from '../components/ParticleBackground';
import { Button } from '../components/ui/button-enhanced';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

interface PDFFile {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  thumbnail?: string;
  pageCount?: number;
}

export const PDFPreview: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([
    {
      id: '1',
      name: 'Financial_Report_Q4_2024.pdf',
      size: 2048000,
      uploadDate: '2024-01-15',
      pageCount: 24
    },
    {
      id: '2',
      name: 'Marketing_Strategy_2024.pdf',
      size: 1536000,
      uploadDate: '2024-01-15',
      pageCount: 18
    },
    {
      id: '3',
      name: 'Research_Paper_Analysis.pdf',
      size: 3072000,
      uploadDate: '2024-01-15',
      pageCount: 42
    }
  ]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    toast({
      title: "File removed",
      description: "PDF file has been removed from the preview.",
    });
  };

  const processFiles = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file to process.",
        variant: "destructive"
      });
      return;
    }
    
    // Navigate to dashboard with selected files
    navigate('/dashboard', { state: { previewedFiles: files } });
  };

  const addMoreFiles = () => {
    // Simulate file upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const newFiles = Array.from(target.files).map((file, index) => ({
          id: `new_${Date.now()}_${index}`,
          name: file.name,
          size: file.size,
          uploadDate: new Date().toISOString().split('T')[0],
          pageCount: Math.floor(Math.random() * 50) + 5
        }));
        
        setFiles(prev => [...prev, ...newFiles]);
        toast({
          title: "Files added",
          description: `${newFiles.length} file(s) added to preview.`,
        });
      }
    };
    input.click();
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
              <h1 className="text-xl font-semibold text-vectra-text-primary">PDF Preview</h1>
              <span className="text-sm text-vectra-text-secondary">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={addMoreFiles}
                icon={<FiUpload size={16} />}
              >
                Add More
              </Button>
              <Button 
                variant="primary" 
                onClick={processFiles}
                disabled={files.length === 0}
              >
                Process Files
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <FiFileText size={64} className="mx-auto text-vectra-text-secondary/50 mb-4" />
            <h2 className="text-xl font-medium text-vectra-text-primary mb-2">
              No PDFs Selected
            </h2>
            <p className="text-vectra-text-secondary mb-6">
              Upload PDF files to preview them before processing
            </p>
            <Button variant="primary" onClick={addMoreFiles} icon={<FiUpload size={16} />}>
              Upload PDFs
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 group hover:border-primary/30 transition-colors"
              >
                {/* File Thumbnail */}
                <div className="aspect-[3/4] bg-vectra-surface/50 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-vectra-border/50">
                  {file.thumbnail ? (
                    <img 
                      src={file.thumbnail} 
                      alt={`${file.name} preview`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <FiFileText size={48} className="mx-auto text-vectra-text-secondary/50 mb-2" />
                      <p className="text-xs text-vectra-text-secondary">
                        {file.pageCount} pages
                      </p>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <h3 className="font-medium text-vectra-text-primary line-clamp-2" title={file.name}>
                    {file.name}
                  </h3>
                  
                  <div className="text-xs text-vectra-text-secondary space-y-1">
                    <p>Size: {formatFileSize(file.size)}</p>
                    <p>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-vectra-border/30">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<FiEye size={14} />}
                      title="Preview"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<FiDownload size={14} />}
                      title="Download"
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FiTrash2 size={14} />}
                    onClick={() => removeFile(file.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    title="Remove"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: files.length * 0.1 + 0.2 }}
            className="mt-8 glass rounded-xl p-6"
          >
            <h3 className="text-lg font-medium text-vectra-text-primary mb-4">
              Processing Summary
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{files.length}</p>
                <p className="text-sm text-vectra-text-secondary">Files</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {files.reduce((sum, f) => sum + (f.pageCount || 0), 0)}
                </p>
                <p className="text-sm text-vectra-text-secondary">Total Pages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
                </p>
                <p className="text-sm text-vectra-text-secondary">Total Size</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">~{Math.ceil(files.length * 1.5)}min</p>
                <p className="text-sm text-vectra-text-secondary">Est. Time</p>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default PDFPreview;