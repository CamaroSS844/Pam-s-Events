/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, User, CheckCircle2, ArrowLeft, Send, ShieldCheck, Eye, EyeOff, KeyRound } from 'lucide-react';
import { mockApi } from '../../services/mockApi';
import { User as UserModel } from '../../types';

type AuthView = 'login' | 'register' | 'forgot_password' | 'reset_password' | 'verify';

interface AuthPagesProps {
  initialView?: AuthView;
  onAuthSuccess: (user: UserModel) => void;
  toast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialView = 'login',
  onAuthSuccess,
  toast
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quotes and pictures on the left
  const splitContent = {
    login: {
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000",
      quote: "Pam's Events transformed how we coordinated our wedding. Our guests couldn’t stop talking about the beautiful countdown and custom RSVP links.",
      author: "Evelyn & Arthur"
    },
    register: {
      image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1000",
      quote: "Creating my Gatsby Gala website took less than ten minutes. The device preview worked flawlessly, and managing RSVPs was an absolute joy.",
      author: "Benjamin Carter"
    },
    forgot_password: {
      image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=1000",
      quote: "Secured with professional-grade encryption, ensuring your family’s contact sheets and meal spreadsheets are safe and private.",
      author: "Pam's Events Security Team"
    },
    reset_password: {
      image: "https://images.unsplash.com/photo-1507504038482-76210062ece1?auto=format&fit=crop&q=80&w=1000",
      quote: "Instantly update credentials to maintain seamless access to your upcoming invitation dashboards.",
      author: "Platform Systems"
    },
    verify: {
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000",
      quote: "Just one quick verification code to shield your wedding registry and invite cards from robotic scrapers.",
      author: "Pam's Events Security Team"
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (view === 'login') {
        if (!email || !password) {
          toast("Please enter your email and password.", "error");
          setIsSubmitting(false);
          return;
        }
        const user = await mockApi.login(email, password);
        toast(`Welcome back, ${user.name}!`, "success");
        onAuthSuccess(user);
      } else if (view === 'register') {
        if (!email || !password || !name) {
          toast("Please fill in all registration fields.", "error");
          setIsSubmitting(false);
          return;
        }
        await mockApi.createUser(name, email, 'client', 3, password);
        toast("Registration successful! Code sent.", "success");
        setView('verify');
      } else if (view === 'forgot_password') {
        if (!email) {
          toast("Please enter your email address.", "error");
          setIsSubmitting(false);
          return;
        }
        toast("Password recovery code sent to your email.", "success");
        setView('verify');
      } else if (view === 'verify') {
        if (!verificationCode) {
          toast("Please enter the 6-digit code.", "error");
          setIsSubmitting(false);
          return;
        }
        toast("Identity verified successfully.", "success");
        setView('reset_password');
      } else if (view === 'reset_password') {
        if (!newPassword) {
          toast("Please enter a new secure password.", "error");
          setIsSubmitting(false);
          return;
        }
        try {
          const usersStr = localStorage.getItem('event_platform_users') || '[]';
          let users: UserModel[] = JSON.parse(usersStr);
          const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
          if (idx !== -1) {
            users[idx].password = newPassword;
            localStorage.setItem('event_platform_users', JSON.stringify(users));
          }
          toast("Password has been reset successfully. Please log in.", "success");
          setView('login');
        } catch (e) {
          toast("Failed to update password.", "error");
        }
      }
    } catch (err: any) {
      toast(err.message || "Authentication failed. Please check your credentials.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeContent = splitContent[view] || splitContent.login;

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans selection:bg-stone-900 selection:text-white">
      {/* 50/50 Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full min-h-screen">
        
        {/* Left Side: Photography & Branding */}
        <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-stone-950 flex-col justify-between p-12 text-white">
          <div className="absolute inset-0 z-0">
            <img 
              src={activeContent.image} 
              alt="Event Visual" 
              className="w-full h-full object-cover opacity-60 scale-100 transition-transform duration-1000 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-950/20" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3 bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/30">
              <img 
                src="/logo.jpg" 
                alt="Pam's Events Logo" 
                className="w-7 h-7 rounded-full object-cover border border-amber-400/50"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-serif font-semibold tracking-wide text-amber-200">Pam's Events Studio</span>
            </div>
          </div>

          <div className="relative z-10 max-w-lg my-auto py-12">
            <div className="mb-4 inline-flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event Excellence</span>
            </div>
            <p className="text-2xl xl:text-3xl font-serif italic leading-relaxed text-stone-100 mb-8 font-light">
              "{activeContent.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-0.5 w-8 bg-amber-400" />
              <span className="text-xs font-mono tracking-widest uppercase font-bold text-amber-300">
                {activeContent.author}
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-sans">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> 7 Luxury Themes</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Live RSVP & Guestbook</span>
            </div>
            <span className="font-mono text-[10px] text-stone-500">PAM'S EVENTS © 2026</span>
          </div>
        </div>

        {/* Right Side: Authentication Forms */}
        <div className="col-span-1 lg:col-span-6 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white relative">
          
          <div className="w-full max-w-md flex flex-col gap-8 text-left">
            
            {/* Header Title */}
            <div>
              <div className="flex items-center gap-2 lg:hidden mb-4">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full border border-amber-400" />
                <span className="font-serif font-bold text-stone-900 text-sm">Pam's Events Studio</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight mb-2">
                {view === 'login' && "Sign in to Pam's Events"}
                {view === 'register' && "Create client profile"}
                {view === 'forgot_password' && "Forgot your password?"}
                {view === 'verify' && "Verify code sent"}
                {view === 'reset_password' && "Reset your password"}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                {view === 'login' && "Welcome back! Enter your credentials to manage your digital event microsite."}
                {view === 'forgot_password' && "Enter your email address to receive a secure identity confirmation code."}
                {view === 'verify' && "Check your email inbox for the 6-digit secure verification sequence."}
                {view === 'reset_password' && "Configure a new strong password to protect your account access."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-5">
              {(view === 'login' || view === 'forgot_password') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all bg-stone-50/50"
                    />
                  </div>
                </div>
              )}

              {view === 'login' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Password</label>
                    <button 
                      type="button"
                      onClick={() => setView('forgot_password')}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all bg-stone-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {view === 'verify' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">6-Digit Verification Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
                    <input 
                      type="text"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      className="w-full pl-11 pr-4 py-3 text-sm font-mono tracking-widest rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all bg-stone-50/50"
                    />
                  </div>
                </div>
              )}

              {view === 'reset_password' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Configure New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all bg-stone-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                <span>
                  {isSubmitting ? "Authenticating..." : ""}
                  {!isSubmitting && view === 'login' && "Sign In"}
                  {!isSubmitting && view === 'forgot_password' && "Send Verification Link"}
                  {!isSubmitting && view === 'verify' && "Verify Code"}
                  {!isSubmitting && view === 'reset_password' && "Update Password"}
                </span>
                {!isSubmitting && <Send className="w-4 h-4 text-amber-400" />}
              </button>
            </form>

            {/* Alternators and Navigation */}
            {(view === 'forgot_password' || view === 'verify' || view === 'reset_password') && (
              <div className="text-center text-xs text-stone-500 font-medium pt-2">
                <button 
                  onClick={() => setView('login')}
                  className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
