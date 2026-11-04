import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SCORM } from '../scorm/config';

/**
 * Student, teacher or self-learner: a preference stored on the device, not an account.
 * Teachers get the Teacher Guide; self-learners are also offered the level test and a next-book suggestion on the home page.
 */
export type UserRole = 'student' | 'teacher' | 'self';

const STORAGE_KEY = 'app_user_role';

const readStoredRole = (): UserRole | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'student' || value === 'teacher' || value === 'self') return value;
    // The SCORM edition skips the role choice: an LMS learner is a student.
    return SCORM ? 'student' : null;
  } catch {
    return SCORM ? 'student' : null;
  }
};

interface UserRoleContextValue {
  role: UserRole | null;
  isTeacher: boolean;
  isSelfLearner: boolean;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
}

const UserRoleContext = createContext<UserRoleContextValue | null>(null);

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole | null>(readStoredRole);

  useEffect(() => {
    try {
      if (role) localStorage.setItem(STORAGE_KEY, role);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable; the choice then lasts for the session only.
    }
  }, [role]);

  const setRole = useCallback((next: UserRole) => setRoleState(next), []);
  const clearRole = useCallback(() => setRoleState(null), []);

  const value = useMemo(
    () => ({ role, isTeacher: role === 'teacher', isSelfLearner: role === 'self', setRole, clearRole }),
    [role, setRole, clearRole],
  );

  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) throw new Error('useUserRole must be used within UserRoleProvider');
  return context;
};
