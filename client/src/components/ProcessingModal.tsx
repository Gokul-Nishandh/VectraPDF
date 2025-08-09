import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiFileText, FiTarget } from 'react-icons/fi';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from './ui/modal';
import { Button } from './ui/button-enhanced';

interface ProcessingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onViewResults: () => void;
  fileName?: string;
  persona?: string;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  onOpenChange,
  onViewResults,
  fileName,
  persona
}) => {
  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", duration: 0.5 }}
              >
                <FiCheck size={32} className="text-primary" />
              </motion.div>
            </motion.div>
          </div>
          
          <ModalTitle className="text-center">
            PDF Processing Complete!
          </ModalTitle>
          
          <ModalDescription className="text-center">
            Your PDF has been successfully analyzed and insights have been extracted.
          </ModalDescription>
        </ModalHeader>

        {(fileName || persona) && (
          <div className="space-y-3 py-4">
            {fileName && (
              <div className="flex items-center space-x-3 p-3 bg-vectra-surface/30 rounded-lg">
                <FiFileText className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-vectra-text-primary">
                    File Processed
                  </p>
                  <p className="text-xs text-vectra-text-secondary truncate">
                    {fileName}
                  </p>
                </div>
              </div>
            )}
            
            {persona && (
              <div className="flex items-center space-x-3 p-3 bg-vectra-surface/30 rounded-lg">
                <FiTarget className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-vectra-text-primary">
                    Persona Applied
                  </p>
                  <p className="text-xs text-vectra-text-secondary line-clamp-2">
                    {persona}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <ModalFooter className="flex justify-center space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={onViewResults}>
            View Results
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};