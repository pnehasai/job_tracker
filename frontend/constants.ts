import { ApplicationStatus } from './types';

export const STATUS_COLORS: { [key in ApplicationStatus]: string } = {
  [ApplicationStatus.Applied]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [ApplicationStatus.Processing]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [ApplicationStatus.Interview]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [ApplicationStatus.Selected]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [ApplicationStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [ApplicationStatus.NoResponse]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export const APPLICATION_STATUSES = Object.values(ApplicationStatus);
