import React from 'react';
import AdminCreatePredictionForm from './AdminCreatePredictionForm';

interface AdminCreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AdminCreatePredictionModal: React.FC<AdminCreatePredictionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <AdminCreatePredictionForm onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
};

export default AdminCreatePredictionModal;
