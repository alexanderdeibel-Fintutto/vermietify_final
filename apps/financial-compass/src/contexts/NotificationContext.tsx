import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { useCompany } from '@/contexts/CompanyContext';

interface NotificationContextType {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { companies, businessCompanies, loading: companiesLoading } = useCompany();
  const { addNotification, notifications } = useNotifications();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState(false);

  // Check if onboarding should be shown - only when companies have finished loading
  // Onboarding now guides to creating a business company (personal is auto-created)
  useEffect(() => {
    if (!user || companiesLoading) return;
    
    const completed = localStorage.getItem('onboarding_completed');
    
    if (businessCompanies.length > 0) {
      // User already has business companies, mark onboarding as done
      if (!completed) {
        localStorage.setItem('onboarding_completed', 'true');
      }
      setShowOnboarding(false);
    } else if (!completed) {
      // No business companies yet — show onboarding to create one
      setShowOnboarding(true);
    }
  }, [user, businessCompanies, companiesLoading]);

  // Send welcome notifications on first login
  useEffect(() => {
    if (user && !welcomeSent && notifications.length === 0) {
      const hasSeenWelcome = localStorage.getItem(`welcome_sent_${user.id}`);
      if (!hasSeenWelcome) {
        // Add demo notifications
        setTimeout(() => {
          addNotification({
            type: 'success',
            title: 'Willkommen zurück!',
            message: 'Schön, dass Sie wieder da sind.',
          });
        }, 1000);

        setTimeout(() => {
          addNotification({
            type: 'warning',
            title: '3 Rechnungen überfällig',
            message: 'Sie haben offene Rechnungen, die das Fälligkeitsdatum überschritten haben.',
            link: '/rechnungen',
          });
        }, 2000);

        setTimeout(() => {
          addNotification({
            type: 'info',
            title: 'Neue Buchung importiert',
            message: 'Eine neue Transaktion wurde von FinAPI importiert.',
            link: '/buchungen',
          });
        }, 3000);

        localStorage.setItem(`welcome_sent_${user.id}`, 'true');
        setWelcomeSent(true);
      }
    }
  }, [user, welcomeSent, notifications.length, addNotification]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    window.location.reload();
  };

  return (
    <NotificationContext.Provider value={{ showOnboarding, setShowOnboarding }}>
      {children}
      <OnboardingWizard open={showOnboarding} onComplete={handleOnboardingComplete} />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
