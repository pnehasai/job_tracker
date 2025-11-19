import React, { useState } from 'react';
import { mockApiService } from '../services/mockApiService';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleID: number | null;
  onApplied: (application?: any) => void;
  userID?: number | null;
}

/**
 * Modal that collects a deadline and optional note before applying to a role.
 */
const ApplyModal: React.FC<ApplyModalProps> = ({ isOpen, onClose, roleID, onApplied, userID }) => {
  const [deadline, setDeadline] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roleID) {
      setError('Invalid role selected.');
      return;
    }

    // require userID
    if (!userID) {
      setError('User not logged in.');
      return;
    }

    setLoading(true);
    try {
      // payload shape expected by backend: { userID, applicationDate, deadline }
      const payload = {
        userID,
        applicationDate: new Date().toISOString(),
        // deadline may be empty — server handles null
        deadline: deadline || null,
        notes: notes || ''
      };

      const res = await mockApiService.addApplication(roleID, payload);
      // mockApiService.addApplication returns { application } or an object; normalize:
      const application = res?.application ? res.application : res;
      if (application && !application.error) {
        onApplied(application);
        onClose();
      } else {
        setError(res?.error || 'Failed to apply.');
      }
    } catch (err: any) {
      console.error('ApplyModal submit error', err);
      setError(err?.message || 'Failed to apply.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-3">Apply for Role</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md"
              placeholder="Cover letter, resume link or notes"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
              {loading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;
