import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, isAuthorizedOwnerEmail } from './context/AuthContext';
import { FarmProvider, useFarm } from './context/FarmContext';
import { auth } from './firebase';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';

// Views
import { HomeView } from './views/HomeView';
import { PlansView } from './views/PlansView';
import { MyFarmView } from './views/MyFarmView';
import { CollectView } from './views/CollectView';
import { RedeemView } from './views/RedeemView';
import { DepositView } from './views/DepositView';
import { WithdrawView } from './views/WithdrawView';
import { TeamView } from './views/TeamView';
import { RewardsView } from './views/RewardsView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import { SupportView } from './views/SupportView';
import { AdminView } from './views/AdminView';
import { AdminLoginView } from './views/AdminLoginView';
import { OwnerView } from './views/OwnerView';
import { OwnerLoginView } from './views/OwnerLoginView';

const MainAppContent: React.FC = () => {
  const { currentUser, userProfile, isAdmin, isOwner, role } = useAuth();
  const { settings } = useFarm();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [refCode, setRefCode] = useState('');

  // Handle URL referral and path routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const tabParam = params.get('tab')?.toLowerCase();

    if (ref) {
      setRefCode(ref.toUpperCase());
      setAuthMode('register');
      setAuthModalOpen(true);
    } else if (tabParam === 'owner' || path.includes('/owner') || hash.includes('owner')) {
      setCurrentTab('owner');
    } else if (tabParam === 'admin' || path.includes('/admin') || hash.includes('admin')) {
      setCurrentTab('admin');
    } else if (path.includes('/user/register') || hash.includes('register')) {
      setAuthMode('register');
      setAuthModalOpen(true);
    } else if (path.includes('/user/login') || hash.includes('login')) {
      setAuthMode('login');
      setAuthModalOpen(true);
    }
  }, []);

  const openAuth = (mode: 'login' | 'register' = 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    // Role-based redirection after login
    const email = (auth.currentUser?.email || '').toLowerCase().trim();
    if (isAuthorizedOwnerEmail(email) || role === 'OWNER') {
      setCurrentTab('owner');
    } else if (role === 'ADMIN') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('home');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        openAuthModal={() => openAuth('register')} 
      />

      {/* Main View Switcher */}
      <main className="flex-1 pt-4">
        {currentTab === 'home' && (
          <HomeView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'plans' && (
          <PlansView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'my-farm' && (
          <MyFarmView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'collect' && (
          <CollectView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'redeem' && (
          <RedeemView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'deposit' && (
          <DepositView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'withdraw' && (
          <WithdrawView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'team' && (
          <TeamView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'rewards' && (
          <RewardsView setCurrentTab={setCurrentTab} openAuthModal={() => openAuth('register')} />
        )}
        {currentTab === 'history' && (
          <HistoryView />
        )}
        {currentTab === 'profile' && (
          <ProfileView setCurrentTab={setCurrentTab} />
        )}
        {currentTab === 'support' && (
          <SupportView />
        )}
        {currentTab === 'admin' && (
          isAdmin ? (
            <AdminView />
          ) : (
            <AdminLoginView 
              onSuccess={() => setCurrentTab('admin')} 
              onNavigateHome={() => setCurrentTab('home')} 
              onNavigateOwnerLogin={() => setCurrentTab('owner')}
            />
          )
        )}
        {currentTab === 'owner' && (
          isOwner ? (
            <OwnerView />
          ) : (
            <OwnerLoginView 
              onSuccess={() => setCurrentTab('owner')} 
              onNavigateHome={() => setCurrentTab('home')} 
            />
          )
        )}
      </main>

      {/* Mobile Bottom Dock Navigation */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        initialRefCode={refCode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onNavigatePortal={(portal) => setCurrentTab(portal)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FarmProvider>
        <MainAppContent />
      </FarmProvider>
    </AuthProvider>
  );
}
