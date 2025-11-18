import React from 'react';
import AdminCreateAgentPredictionForm from './AdminCreateAgentPredictionForm';

interface AdminCreateAgentPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AdminCreateAgentPredictionModal: React.FC<AdminCreateAgentPredictionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <AdminCreateAgentPredictionForm onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
};

export default AdminCreateAgentPredictionModal;
