// frontend/src/components/UserDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { mockApiService } from '../services/mockApiService';
import { connectSocket, onNotification, disconnectSocket } from '../socket';
import ApplyModal from './ApplicationModal';

type JobRole = {
  roleID: number;
  companyName?: string;
  companyLocation?: string;
  roleTitle?: string;
  jobType?: string;
  description?: string;
};

type Application = {
  applicationID: number;
  roleID?: number;
  userID?: number;
  applicationDate?: string;
  deadline?: string | null;
  status?: string;
  roleTitle?: string;
  companyName?: string;
};

const NotificationPopup: React.FC<{ title: string; body?: string; onClose: () => void }> = ({ title, body, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed right-4 top-4 z-50 w-80">
      <div className="bg-white shadow-lg rounded p-4 border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-gray-800">{title}</div>
            {body && <div className="text-sm text-gray-600 mt-1">{body}</div>}
          </div>
          <button className="text-gray-500" onClick={onClose}>✕</button>
        </div>
      </div>
    </div>
  );
};

const UserDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<JobRole[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // notification popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPayload, setPopupPayload] = useState<{ title: string; body?: string } | null>(null);

  // Read logged user from localStorage (adjust if you store elsewhere)
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let parsedUser: any = null;
  try { parsedUser = storedUser ? JSON.parse(storedUser) : null; } catch { parsedUser = null; }
  const userID = parsedUser?.userID ?? parsedUser?.id ?? null;

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    setError(null);
    try {
      const res = await mockApiService.getAllJobRoles();
      const arr = Array.isArray(res) ? res : (res?.jobs || res);
      setJobs(arr || []);
    } catch (err: any) {
      console.error('fetchJobs error', err);
      setError('Failed to load jobs');
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchUserApplications = useCallback(async () => {
    if (!userID) {
      setApplications([]);
      return;
    }
    setLoadingApps(true);
    try {
      const res = await mockApiService.getUserApplications(userID);
      const arr = Array.isArray(res) ? res : (res?.applications || []);
      setApplications(arr || []);
    } catch (err: any) {
      console.error('fetchUserApplications error', err);
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  }, [userID]);

  useEffect(() => {
    fetchJobs();
    fetchUserApplications();
  }, [fetchJobs, fetchUserApplications]);

  // Socket setup: connect and listen for notifications
  useEffect(() => {
    if (!userID) return;
    const sock = connectSocket(userID);
    // ensure the socket knows this user
    sock.emit('identify', { userID });

    const off = onNotification((payload) => {
      console.log('Received notification via socket', payload);
      // Show popup and refresh applications immediately
      const title = payload?.type || 'Notification';
      const body = payload?.companyName ? `${payload.companyName} — ${payload.type}` : payload?.type;
      setPopupPayload({ title, body });
      setPopupVisible(true);
      // refresh applications so the user sees updated status
      fetchUserApplications();
    });

    return () => {
      off();
      disconnectSocket();
    };
  }, [userID, fetchUserApplications]);

  const openApplyModal = (roleID: number) => {
    setSelectedRoleId(roleID);
    setApplyModalOpen(true);
  };

  const onApplied = (application?: any) => {
    fetchUserApplications();
    if (application) {
      setPopupPayload({ title: 'Application submitted', body: `Applied to ${application.roleID || ''}` });
      setPopupVisible(true);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Notification popup */}
      {popupVisible && popupPayload && (
        <NotificationPopup
          title={popupPayload.title}
          body={popupPayload.body}
          onClose={() => { setPopupVisible(false); setPopupPayload(null); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <div>
          <button onClick={() => { fetchUserApplications(); fetchJobs(); }} className="px-3 py-2 bg-gray-200 rounded">Refresh</button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Applications</h2>
        {loadingApps ? <div>Loading applications...</div> : (
          <div className="space-y-4">
            {applications.length === 0 ? <div className="text-sm text-gray-600">No applications yet.</div> :
              applications.map((app) => (
                <div key={app.applicationID} className="p-4 bg-white rounded border border-gray-200">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-lg font-semibold">{app.companyName ? `${app.companyName} - ${app.roleTitle}` : app.roleTitle}</div>
                      <div className="text-sm text-gray-600">Status: <span className="font-medium">{app.status}</span></div>
                      <div className="text-sm text-gray-600">Applied on: {app.applicationDate}</div>
                      <div className="text-sm text-gray-600">Deadline: {app.deadline || '—'}</div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Open Roles</h2>
        {loadingJobs ? <div>Loading roles...</div> : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {jobs.length === 0 ? <div className="text-sm text-gray-600">No roles available.</div> :
              jobs.map(job => (
                <div key={job.roleID} className="p-4 bg-white rounded border border-gray-200 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold">{job.companyName ? `${job.companyName} - ${job.roleTitle}` : job.roleTitle}</div>
                      <div className="text-sm text-gray-600">{job.jobType} • {job.companyLocation || ''}</div>
                      <div className="text-sm text-gray-700 mt-2">{job.description}</div>
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-2">
                      <button
                        onClick={() => openApplyModal(job.roleID)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </section>

      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        roleID={selectedRoleId}
        userID={userID}
        onApplied={onApplied}
      />
    </div>
  );
};

export default UserDashboard;
