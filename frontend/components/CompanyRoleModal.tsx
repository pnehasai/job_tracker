
import React, { useState } from 'react';
import { Company } from '../types';
import { mockApiService } from '../services/mockApiService';

interface CompanyRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataAdded: () => void;
  companies: Company[];
}

type FormType = 'company' | 'role';

const CompanyRoleModal: React.FC<CompanyRoleModalProps> = ({ isOpen, onClose, onDataAdded, companies }) => {
  const [formType, setFormType] = useState<FormType>('company');
  
  // Company state
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');

  // Role state
  const [companyId, setCompanyId] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [jobType, setJobType] = useState('');
  const [description, setDescription] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (formType === 'company') {
        await mockApiService.addCompany(companyName, location);
      } else {
        await mockApiService.addJobRole(Number(companyId), roleTitle, jobType, description);
      }
      onDataAdded();
      onClose();
    } catch (err) {
      setError(`Failed to add ${formType}.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  
  const getTabClass = (tabName: FormType) => 
    `w-full py-2 text-sm font-medium focus:outline-none ${
      formType === tabName 
        ? 'bg-indigo-600 text-white rounded-t-md' 
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setFormType('company')} className={getTabClass('company')}>Add Company</button>
            <button onClick={() => setFormType('role')} className={getTabClass('role')}>Add Job Role</button>
        </div>
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {formType === 'company' ? 'Add New Company' : 'Add New Job Role'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
            {formType === 'company' ? (
                <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="mt-1 block w-full input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="mt-1 block w-full input" />
                </div>
                </>
            ) : (
                <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                    <select value={companyId} onChange={e => setCompanyId(e.target.value)} required className="mt-1 block w-full input">
                        <option value="">Select a company</option>
                        {companies.map(c => <option key={c.companyID} value={c.companyID}>{c.companyName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Title</label>
                    <input type="text" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} required className="mt-1 block w-full input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Type</label>
                    <input type="text" value={jobType} onChange={e => setJobType(e.target.value)} required className="mt-1 block w-full input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full input" />
                </div>
                </>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
                {isLoading ? 'Adding...' : `Add ${formType}`}
                </button>
            </div>
            </form>
        </div>
      </div>
      <style>{`
          .input {
             px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
          }
      `}</style>
    </div>
  );
};

export default CompanyRoleModal;
