import React, { useState } from 'react';
import { 
  Bell, 
  Wallet as WalletIcon, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert, 
  User, 
  PlusCircle, 
  Sparkles,
  ChevronDown,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { EggIllustration } from './FarmIllustrations';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { currentUser, userProfile, role, isOwner, isAdmin, logout } = useAuth();
  const { wallet, notifications } = useFarm();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-500 to-emerald-700 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full bg-emerald-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              <EggIllustration size={28} color="#fbbf24" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider text-white font-['Outfit']">
                EGGS <span className="text-emerald-400">NAVA</span>
              </span>
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/80 font-medium tracking-wide uppercase">
              Digital Poultry Farm
            </p>
          </div>
        </div>

        {/* Desktop Quick Stats when logged in */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-3">
            {/* Balance Chip */}
            <div 
              onClick={() => setCurrentTab('deposit')}
              className="bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-full px-3.5 py-1.5 flex items-center gap-2.5 cursor-pointer transition shadow-sm"
              title="Click to Deposit"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                Rs
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-semibold text-emerald-300 block -mb-0.5">
                  Confirmed Balance
                </span>
                <span className="font-extrabold text-sm text-white font-['Outfit']">
                  {(wallet?.balance || 0).toLocaleString()} <span className="text-xs font-normal text-emerald-400">PKR</span>
                </span>
              </div>
              <PlusCircle className="w-4 h-4 text-emerald-400 hover:text-emerald-300 ml-1" />
            </div>

            {/* Egg Counter Chip */}
            <div 
              onClick={() => setCurrentTab('redeem')}
              className="bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 cursor-pointer transition shadow-sm"
              title="Click to Sell/Redeem Eggs"
            >
              <EggIllustration size={22} color="#fef3c7" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-semibold text-amber-300 block -mb-0.5">
                  Available Eggs
                </span>
                <span className="font-extrabold text-sm text-white font-['Outfit']">
                  {(wallet?.availableEggs || 0).toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                REDEEM
              </span>
            </div>
          </div>
        )}

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-500/30 flex items-center justify-center text-slate-200 transition relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center border-2 border-emerald-950 animate-pulse">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 bg-emerald-950/90 border-b border-emerald-500/20 flex items-center justify-between">
                      <span className="font-bold text-sm text-white font-['Outfit']">Notifications</span>
                      <span className="text-xs text-emerald-400 font-semibold">{notifications.length} Total</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No notifications yet. You will receive updates on deposits, harvests, and payouts here.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-3 hover:bg-slate-800/60 transition text-xs space-y-1">
                            <div className="flex items-center justify-between text-slate-200 font-semibold">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-400 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Role Pill */}
              <div 
                onClick={() => setCurrentTab('profile')}
                className="flex items-center gap-2 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 cursor-pointer transition"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white max-w-[100px] truncate">
                      {userProfile?.username || 'Farmer'}
                    </span>
                    {role === 'OWNER' && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 font-black px-1.5 rounded">
                        OWNER
                      </span>
                    )}
                    {role === 'ADMIN' && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/40 font-black px-1.5 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner and Admin Buttons */}
              {isOwner && (
                <button
                  onClick={() => setCurrentTab('owner')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    currentTab === 'owner'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>OWNER PANEL</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    currentTab === 'admin'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>ADMIN PANEL</span>
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-slate-200 md:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <button
              onClick={openAuthModal}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-emerald-500/20 p-4 space-y-3 animate-in slide-in-from-top-4 duration-200">
          {currentUser && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div 
                onClick={() => { setCurrentTab('deposit'); setMobileMenuOpen(false); }}
                className="bg-emerald-900/40 border border-emerald-500/30 p-2.5 rounded-xl text-center"
              >
                <span className="text-[10px] text-emerald-300 uppercase block font-semibold">Balance</span>
                <span className="font-extrabold text-sm text-white">{(wallet?.balance || 0).toLocaleString()} PKR</span>
              </div>
              <div 
                onClick={() => { setCurrentTab('redeem'); setMobileMenuOpen(false); }}
                className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl text-center"
              >
                <span className="text-[10px] text-amber-300 uppercase block font-semibold">Available Eggs</span>
                <span className="font-extrabold text-sm text-white">{(wallet?.availableEggs || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {[
              { id: 'home', label: 'Home' },
              { id: 'plans', label: 'Buy Hens' },
              { id: 'my-farm', label: 'My Farm' },
              { id: 'collect', label: 'Collect Eggs' },
              { id: 'redeem', label: 'Sell / Redeem' },
              { id: 'deposit', label: 'Deposit' },
              { id: 'withdraw', label: 'Withdraw' },
              { id: 'team', label: 'Team / Referral' },
              { id: 'rewards', label: 'Daily Rewards' },
              { id: 'history', label: 'Activity Logs' },
              { id: 'profile', label: 'My Profile' },
              { id: 'support', label: 'Help & Support' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setCurrentTab(tab.id); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-left transition ${
                  currentTab === tab.id 
                    ? 'bg-emerald-500 text-slate-950 font-bold' 
                    : 'bg-slate-900/80 text-slate-300 hover:bg-emerald-900/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isOwner && (
            <button
              onClick={() => { setCurrentTab('owner'); setMobileMenuOpen(false); }}
              className="w-full mt-2 p-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-slate-950" />
              <span>Open OWNER Panel (/owner)</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
              className="w-full mt-1.5 p-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-slate-950" />
              <span>Open ADMIN Panel (/admin)</span>
            </button>
          )}

          {currentUser && (
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="w-full p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-950/80 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Account</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
