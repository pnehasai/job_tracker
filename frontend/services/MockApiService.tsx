// frontend/src/services/mockApiService.ts
const BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:4000';
const API = (p: string) => `${BASE.replace(/\/$/,'')}/api${p.startsWith('/') ? p : '/'+p}`;

async function fetchJson(path: string, opts?: RequestInit) {
  const res = await fetch(API(path), opts);
  const body = await res.json().catch(()=>null);

  if (!res.ok) {
    // Normalize error object so callers can read .status and .message
    const err: any = {};
    err.status = res.status;
    // body might be { error: '...' } or any shape
    if (body && typeof body === 'object') {
      // prefer body.error or body.message
      err.message = body.error || body.message || JSON.stringify(body);
      err.body = body;
    } else {
      err.message = res.statusText || `HTTP ${res.status}`;
      err.body = body;
    }
    throw err;
  }

  return body;
}

async function postJson(path: string, body: any) {
  return await fetchJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export const mockApiService = {
  // --- AUTH ---
  async loginUser(email: string, password: string) {
    return await postJson('/auth/login', { email, password });
  },

  async registerUser(name: string, email: string, contact: string, password: string) {
    return await postJson('/auth/register', { name, email, contact, password });
  },

  async loginAdmin(email: string, password: string) {
    return await postJson('/admin/login', { email, password });
  },

  // --- USER-SPECIFIC ---
  async getUserApplications(userID: number) {
    const res = await fetch(API(`/users/${userID}/applications`));
    return res.json().catch(()=>[]);
  },

  async addApplication(roleID: number, payload: { userID:number; resume?:string; coverLetter?:string; deadline?:string }) {
    return await postJson(`/jobs/${roleID}/apply`, payload);
  },

  async updateApplicationStatus(applicationID: number, status: string) {
    const res = await fetch(API(`/applications/${applicationID}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json().catch(()=>({}));
  },

  async deleteApplication(applicationID: number) {
    throw new Error('deleteApplication not implemented on backend');
  },

  async addInterview(applicationID: number, interviewDate: string, interviewMode: 'Online'|'Offline', interviewTime?: string, result?: string) {
    return await postJson('/interviews', { applicationID, interviewDate, interviewMode, interviewTime, result });
  },

  async getUserNotifications(userID: number) {
    const res = await fetch(API(`/notifications/${userID}`));
    return res.json().catch(()=>[]);
  },

  // --- ADMIN-SPECIFIC ---
  async getAllUsers() {
    const res = await fetch(API('/users'));
    return res.json().catch(()=>[]);
  },

  /**async getAllApplications() {
    const res = await fetch(API('/admin/overview'));
    return res.json().catch(()=>[]);
  },**/

  async getAllJobRoles() {
    const res = await fetch(API('/jobs'));
    return res.json().then(r => r.jobs || r).catch(()=>[]);
  },

  async addCompany(companyName: string, location: string) {
    return await postJson('/companies', { companyName, location });
  },

  async addJobRole(companyID: number, roleTitle: string, jobType: string, description: string) {
    return await postJson('/roles', { companyID, roleTitle, jobType, description });
  },

  async getAllCompanies() {
    const res = await fetch(API('/companies'));
    return res.json().catch(()=>[]);
  },


   async getAllApplications() {

    let res = await fetch(API('/admin/overview'));
    if (!res.ok) {
      // fallback to public applications listing endpoint used by other server builds
      res = await fetch(API('/applications'));
    }
    return res.json().catch(()=>[]);
   },


  async runInterviewReminders() {
    return { count: 0 };
  }
};
