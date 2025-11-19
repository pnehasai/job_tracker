
export enum ApplicationStatus {
  Applied = 'Applied',
  Processing = 'Processing',
  Interview = 'Interview',
  Rejected = 'Rejected',
  Selected = 'Selected',
  NoResponse = 'No Response'
}

export interface User {
  userID: number;
  name: string;
  email: string;
  contact_info: string;
}

export interface Admin {
  adminID: number;
  name: string;
  email: string;
}

export interface Company {
  companyID: number;
  companyName: string;
  location: string;
}

export interface JobRole {
  roleID: number;
  companyID: number;
  roleTitle: string;
  jobType: string;
  description: string;
}

export interface FullJobRole extends JobRole {
  companyName: string;
  location: string;
}

export interface JobApplication {
  applicationID: number;
  userID: number;
  roleID: number;
  applicationDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  status: ApplicationStatus;
}

export interface FullJobApplication extends JobApplication {
  companyName: string;
  roleTitle: string;
  userName?: string;
}

export interface Interview {
  interviewID: number;
  applicationID: number;
  interviewDate: string; // YYYY-MM-DD
  interviewMode: 'Online' | 'Offline';
  result: 'Pending' | 'Passed' | 'Failed';
}

export interface Notification {
  notificationID: number;
  applicationID: number;
  type: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  companyName: string;
  roleTitle: string;
}
