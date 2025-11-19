import React, { useEffect, useState } from 'react';
import { mockApiService } from '../services/mockApiService';

// Minimal local types (adjust if you have shared types)
type AppRow = {
  applicationID: number;
  userID?: number;
  userName?: string;
  userEmail?: string;
  roleID?: number;
  roleTitle?: string;
  companyName?: string;
  applicationDate?: string;
  deadline?: string | null;
  status?: string;
};

type UserRow = {
  userID: number;
  name?: string;
  email?: string;
  contact_info?: string;
};

type Company = {
  companyID: number;
  companyName: string;
  location?: string;
};

type Role = {
  roleID: number;
  companyID?: number;
  roleTitle?: string;
  jobType?: string;
  description?: string;
};

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'applications'|'users'|'companies'>('applications');

  const [applications, setApplications] = useState<AppRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshToggle, setRefreshToggle] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<'company'|'role'>('company');

  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');

  const [roleCompanyId, setRoleCompanyId] = useState<number | null>(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [roleJobType, setRoleJobType] = useState('Full-time');
  const [roleDescription, setRoleDescription] = useState('');

  const [activeEditStatusFor, setActiveEditStatusFor] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const [addingInterviewFor, setAddingInterviewFor] = useState<number | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewMode, setInterviewMode] = useState<'Online'|'Offline'>('Online');

  // Loaders
  useEffect(() => { fetchAll(); }, [refreshToggle]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch
      const [appsRes, usersRes, companiesRes, rolesRes] = await Promise.allSettled([
        mockApiService.getAllApplications(),
        mockApiService.getAllUsers(),
        mockApiService.getAllCompanies(),
        mockApiService.getAllJobRoles()
      ]);

      if (appsRes.status === 'fulfilled') {
        const arr = Array.isArray(appsRes.value) ? appsRes.value : (appsRes.value?.applications || []);
        setApplications(arr);
      } else {
        console.error('apps error', appsRes.reason);
        setApplications([]);
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(Array.isArray(usersRes.value) ? usersRes.value : []);
      } else {
        console.error('users error', usersRes.reason);
        setUsers([]);
      }

      if (companiesRes.status === 'fulfilled') {
        setCompanies(Array.isArray(companiesRes.value) ? companiesRes.value : []);
      } else {
        console.error('companies error', companiesRes.reason);
        setCompanies([]);
      }

      if (rolesRes.status === 'fulfilled') {
        setRoles(Array.isArray(rolesRes.value) ? rolesRes.value : []);
      } else {
        console.error('roles error', rolesRes.reason);
        setRoles([]);
      }

    } catch (err: any) {
      console.error('fetchAll error', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Run interview reminders
  const handleRunReminders = async () => {
    try {
      const r = await mockApiService.runInterviewReminders();
      alert(`Interview reminders sent: ${r?.count ?? 0}`);
      setRefreshToggle(t => t+1);
    } catch (err: any) {
      console.error('runReminders error', err);
      alert('Failed to run reminders');
    }
  };

  // Add company
  const handleAddCompany = async () => {
    if (!companyName.trim()) return alert('Company name required');
    try {
      const res = await mockApiService.addCompany(companyName.trim(), companyLocation.trim());
      if (res?.error) return alert(res.error);
      setCompanyName(''); setCompanyLocation('');
      setShowAddModal(false);
      setRefreshToggle(t => t+1);
    } catch (err: any) {
      console.error('addCompany error', err);
      alert('Failed to add company');
    }
  };

  // Add role
  const handleAddRole = async () => {
    if (!roleCompanyId) return alert('Select company');
    if (!roleTitle.trim()) return alert('Role title required');
    try {
      const res = await mockApiService.addJobRole(roleCompanyId, roleTitle.trim(), roleJobType, roleDescription.trim());
      if (res?.error) return alert(res.error);
      setRoleCompanyId(null); setRoleTitle(''); setRoleDescription('');
      setShowAddModal(false);
      setRefreshToggle(t => t+1);
    } catch (err: any) {
      console.error('addRole error', err);
      alert('Failed to add role');
    }
  };

  // Delete application
  const handleDeleteApplication = async (appId: number) => {
    if (!confirm('Delete this application?')) return;
    try {
      // backend currently didn't implement delete; mockApiService.deleteApplication returns error.
      const res = await mockApiService.deleteApplication(appId);
      if (res?.error) {
        // if backend not implemented, fallback: call update status to "Deleted" if you want
        alert(res.error);
      } else {
        alert('Deleted');
      }
      setRefreshToggle(t => t+1);
    } catch (err: any) {
      console.error('deleteApp error', err);
      alert('Delete failed');
    }
  };

  // Begin edit status
  const beginEditStatus = (appId: number, currentStatus?: string) => {
    setActiveEditStatusFor(appId);
    setNewStatus(currentStatus || 'Applied');
  };

  // Save status
  const saveStatus = async (appId: number) => {
    try {
      if (!newStatus) return alert('Select status');
      const res = await mockApiService.updateApplicationStatus(appId, newStatus);
      if (res?.error) {
        alert(res.error || 'Update failed');
      } else {
        setActiveEditStatusFor(null);
        setRefreshToggle(t => t+1);
      }
    } catch (err: any) {
      console.error('saveStatus error', err);
      alert('Failed to update status');
    }
  };

  // Add interview
  const openAddInterview = (applicationID: number) => {
    setAddingInterviewFor(applicationID);
    setInterviewDate('');
    setInterviewMode('Online');
  };
  const submitInterview = async () => {
    if (!addingInterviewFor || !interviewDate) return alert('Date required');
    try {
      const res = await mockApiService.addInterview(addingInterviewFor, interviewDate, interviewMode);
      if (res?.error) {
        alert(res.error || 'Failed to add interview');
      } else {
        setAddingInterviewFor(null);
        setRefreshToggle(t => t+1);
      }
    } catch (err: any) {
      console.error('submitInterview error', err);
      alert('Failed to add interview');
    }
  };

  // utilities
  const formatDate = (s?: string|null) => s ? new Date(s).toISOString() : '—';

  // Render
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowAddModal(true)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">+ Add Company/Role</button>
          <button onClick={handleRunReminders} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Run Interview Reminders</button>
          <button onClick={() => setRefreshToggle(t => t+1)} className="bg-gray-200 px-3 py-2 rounded">Refresh</button>
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-4">
          <button className={`px-4 py-2 rounded ${tab==='applications' ? 'bg-indigo-600 text-white' : 'bg-white'}`} onClick={() => setTab('applications')}>All Applications</button>
          <button className={`px-4 py-2 rounded ${tab==='users' ? 'bg-indigo-600 text-white' : 'bg-white'}`} onClick={() => setTab('users')}>All Users</button>
          <button className={`px-4 py-2 rounded ${tab==='companies' ? 'bg-indigo-600 text-white' : 'bg-white'}`} onClick={() => setTab('companies')}>Companies & Roles</button>
        </nav>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {tab === 'applications' && (
        <div>
          {loading ? <div>Loading applications...</div> : (
            <div className="space-y-4">
              {(Array.isArray(applications) ? applications : []).map(app => (
                <div key={app.applicationID} className="p-4 rounded shadow bg-white border border-gray-200 flex justify-between">
                  <div>
                    <div className="text-xl font-semibold">
                      {app.companyName ? `${app.companyName} - ${app.roleTitle || 'Role'}` : (app.roleTitle || 'Role')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">User: <span className="font-medium">{app.userName || app.userEmail || `ID:${app.userID || '—'}`}</span></div>
                    <div className="text-sm text-gray-600 mt-1">Applied on: <span className="font-medium">{app.applicationDate || '—'}</span></div>
                    <div className="text-sm text-gray-600">Deadline: {app.deadline || '—'}</div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div>
                      {activeEditStatusFor === app.applicationID ? (
                        <div className="flex items-center space-x-2">
                          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="px-2 py-1 border rounded">
                            <option>Applied</option>
                            <option>Processing</option>
                            <option>Interview</option>
                            <option>Rejected</option>
                            <option>Selected</option>
                            <option>No Response</option>
                          </select>
                          <button onClick={() => saveStatus(app.applicationID)} className="px-3 py-1 bg-indigo-600 text-white rounded">Save</button>
                          <button onClick={() => setActiveEditStatusFor(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">Status: <span className="font-semibold">{app.status || '—'}</span></div>
                          <button onClick={() => beginEditStatus(app.applicationID, app.status)} className="px-2 py-1 bg-yellow-200 rounded">Edit</button>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button onClick={() => openAddInterview(app.applicationID)} className="px-3 py-1 bg-green-200 rounded">Add Interview</button>
                      <button onClick={() => handleDeleteApplication(app.applicationID)} className="px-3 py-1 bg-red-200 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div>
          {loading ? <div>Loading users...</div> : (
            <div className="space-y-2">
              {(Array.isArray(users) ? users : []).map(u => (
                <div key={u.userID} className="p-3 bg-white rounded border border-gray-200">
                  <div className="font-medium">{u.name || u.email}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                  <div className="text-sm text-gray-600">Contact: {u.contact_info || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'companies' && (
        <div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Companies</h3>
              <div className="space-y-2">
                {(Array.isArray(companies) ? companies : []).map(c => (
                  <div key={c.companyID} className="p-3 bg-white rounded border border-gray-200">
                    <div className="font-medium">{c.companyName}</div>
                    <div className="text-sm text-gray-600">{c.location}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Job Roles</h3>
              <div className="space-y-2">
                {(Array.isArray(roles) ? roles : []).map(r => (
                  <div key={r.roleID} className="p-3 bg-white rounded border border-gray-200">
                    <div className="font-medium">{r.roleTitle}</div>
                    <div className="text-sm text-gray-600">Type: {r.jobType}</div>
                    <div className="text-sm text-gray-600">Company ID: {r.companyID}</div>
                    <div className="text-sm text-gray-600">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Company/Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="w-full max-w-2xl bg-white rounded shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button onClick={() => setAddTab('company')} className={`px-4 py-2 rounded ${addTab==='company' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Add Company</button>
                <button onClick={() => setAddTab('role')} className={`px-4 py-2 rounded ${addTab==='role' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Add Job Role</button>
              </div>
              <button onClick={() => setShowAddModal(false)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
            </div>

            {addTab === 'company' && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Add Company</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm">Company Name</label>
                    <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm">Location</label>
                    <input value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    <button onClick={handleAddCompany} className="px-4 py-2 bg-indigo-600 text-white rounded">Add company</button>
                  </div>
                </div>
              </div>
            )}

            {addTab === 'role' && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Add Job Role</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm">Company</label>
                    <select value={roleCompanyId ?? ''} onChange={e => setRoleCompanyId(Number(e.target.value) || null)} className="w-full px-3 py-2 border rounded">
                      <option value="">Select company</option>
                      {(Array.isArray(companies) ? companies : []).map(c => <option key={c.companyID} value={c.companyID}>{c.companyName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Role Title</label>
                    <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm">Job Type</label>
                    <input value={roleJobType} onChange={e => setRoleJobType(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm">Description</label>
                    <textarea value={roleDescription} onChange={e => setRoleDescription(e.target.value)} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    <button onClick={handleAddRole} className="px-4 py-2 bg-indigo-600 text-white rounded">Add role</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Interview Modal */}
      {addingInterviewFor && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="w-full max-w-md bg-white rounded shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Add Interview</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm">Interview Date</label>
                <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm">Mode</label>
                <select value={interviewMode} onChange={e => setInterviewMode(e.target.value as any)} className="w-full px-3 py-2 border rounded">
                  <option>Online</option>
                  <option>Offline</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setAddingInterviewFor(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={submitInterview} className="px-4 py-2 bg-indigo-600 text-white rounded">Add interview</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
