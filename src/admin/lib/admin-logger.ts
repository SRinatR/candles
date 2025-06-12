
"use client";

// Simple client-side logger using localStorage

const LOGS_STORAGE_KEY = 'askimAdminLogs';
const MAX_LOG_ENTRIES = 100; // Cap the number of log entries

export interface AdminLogEntry {
  timestamp: string;
  userEmail: string;
  action: string;
  details?: Record<string, any>;
}

export function logAdminAction(userEmail: string, action: string, details?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  const newLogEntry: AdminLogEntry = {
    timestamp: new Date().toISOString(),
    userEmail,
    action,
    details,
  };

  try {
    const existingLogsRaw = localStorage.getItem(LOGS_STORAGE_KEY);
    let logs: AdminLogEntry[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    
    logs.unshift(newLogEntry); // Add new log to the beginning

    if (logs.length > MAX_LOG_ENTRIES) {
      logs = logs.slice(0, MAX_LOG_ENTRIES); // Keep only the latest X entries
    }

    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to write admin log to localStorage:", error);
  }
}

export function getAdminLogs(): AdminLogEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const logsRaw = localStorage.getItem(LOGS_STORAGE_KEY);
    return logsRaw ? JSON.parse(logsRaw) : [];
  } catch (error) {
    console.error("Failed to read admin logs from localStorage:", error);
    return [];
  }
}

export function clearAdminLogs(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
    console.log("Admin logs cleared from localStorage.");
  } catch (error) {
    console.error("Failed to clear admin logs from localStorage:", error);
  }
}
