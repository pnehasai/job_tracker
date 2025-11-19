import React, { useState } from 'react';
import { mockApiService } from '../services/mockApiService';

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInterviewAdded: () => void;
  applicationId: number;
}

const InterviewModal: React.FC<InterviewModalProps> = ({
  isOpen,
  onClose,
  onInterviewAdded,
  applicationId,
}) => {
  const [interviewDate, setInterviewDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [interviewMode, setInterviewMode] = useState<'Online' | 'Offline'>(
    'Online'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!interviewDate) {
      setError('Interview date is required.');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ normalize to MySQL date format YYYY-MM-DD
      const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(interviewDate)
        ? interviewDate
        : new Date(interviewDate).toISOString().slice(0, 10);

      console.log('Submitting interview:', {
        applicationId,
        formattedDate,
        interviewMode,
      });

      const res = await mockApiService.addInterview(
        applicationId,
        formattedDate,
        interviewMode,
        'Pending'
      );

      console.log('✅ addInterview response:', res);

      if (res && (res.interview || res.application)) {
        onInterviewAdded?.();
        onClose?.();
      } else {
        setError(res?.error || 'Server did not return expected response.');
      }
    } catch (err: any) {
      console.error('❌ InterviewModal submit error:', err);
      setError(
        err?.message ||
          err?.response?.data?.error ||
          'Failed to add interview details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Add Interview Details
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interview Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Interview Date
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Interview Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Interview Mode
            </label>
            <select
              value={interviewMode}
              onChange={(e) =>
                setInterviewMode(e.target.value as 'Online' | 'Offline')
              }
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          {/* Error message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Adding...' : 'Add Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewModal;
