
import React, { useState } from 'react';
import { FullJobApplication, ApplicationStatus } from '../types';
import { STATUS_COLORS, APPLICATION_STATUSES } from '../constants';
import TrashIcon from './icons/TrashIcon';
import InterviewModal from './InterviewModal';

interface ApplicationCardProps {
  application: FullJobApplication;
  onStatusUpdate: (applicationId: number, newStatus: ApplicationStatus) => void;
  onInterviewAdded: () => void;
  onDelete: (applicationId: number) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onStatusUpdate, onInterviewAdded, onDelete }) => {
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  
  const daysSinceApplied = Math.floor((new Date().getTime() - new Date(application.applicationDate).getTime()) / (1000 * 3600 * 24));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105 duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{application.roleTitle}</h3>
                <p className="text-md text-gray-600 dark:text-gray-400">{application.companyName}</p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[application.status]}`}
            >
              {application.status}
            </span>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>Applied On: <span className="font-medium text-gray-700 dark:text-gray-300">{application.applicationDate}</span> ({daysSinceApplied} days ago)</p>
            <p>Deadline: <span className="font-medium text-gray-700 dark:text-gray-300">{application.deadline}</span></p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <select
                value={application.status}
                onChange={(e) => onStatusUpdate(application.applicationID, e.target.value as ApplicationStatus)}
                className="flex-grow w-full sm:w-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
                {APPLICATION_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
             <button
                onClick={() => setIsInterviewModalOpen(true)}
                className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
                Add Interview
            </button>
            <button
                onClick={() => onDelete(application.applicationID)}
                className="p-2 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800"
                aria-label="Delete application"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
       {isInterviewModalOpen && (
        <InterviewModal
          isOpen={isInterviewModalOpen}
          onClose={() => setIsInterviewModalOpen(false)}
          onInterviewAdded={onInterviewAdded}
          applicationId={application.applicationID}
        />
      )}
    </div>
  );
};

export default ApplicationCard;
