export interface GarbageReport {
  id: string;
  address: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  description: string;
  category: string;
  status: "Pending" | "Assigned" | "Cleaned";
  severity: "Low" | "Medium" | "High";
  pointsReward: number;
  reportedBy: string;
  reportedAt: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  aiAnalysis?: {
    detectedCategory: string;
    severity: string;
    confidence: number;
    pointsReward: number;
    summary: string;
    educationalTip: string;
    actionSteps: string[];
    isMock?: boolean;
  };
}

export interface VolunteerTask {
  id: string;
  reportId: string;
  title: string;
  description: string;
  address: string;
  points: number;
  status: "Assigned" | "In Progress" | "Completed";
  assignedVolunteerId: string;
  assignedVolunteerName: string;
  assignedAt: string;
  completedAt?: string;
  proofPhotoUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "Citizen" | "Volunteer" | "Admin";
  points: number;
  level: number;
  unlockedBadgeIds: string[];
  joinedAt: string;
  reportsSubmitted: number;
  reportsCleaned: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string; // Lucide icon name
  category: "reporting" | "cleaning" | "education" | "milestone";
  unlockedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface CleanlinessEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  pointsReward: number;
  volunteerCount: number;
  maxVolunteers: number;
  joinedUserIds: string[];
}
