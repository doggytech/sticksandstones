import React from 'react';
import { Button } from './Button';

interface ConfirmationModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-lg p-6 z-10">
        {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{message}</p>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
