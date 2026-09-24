'use client';

import React, { useState } from 'react';
import {
  X,
  TreePine,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  isDemo: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState('Shruti Thakur');
  const [email, setEmail] = useState('shruti@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [confirmPassword, setConfirmPassword] = useState('••••••••••••');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onSuccess({
        name: 'Shruti Thakur (Judge Demo)',
        email: 'judge.demo@urban-compiler.ai',
        role: 'Chief Urban Resilience Director',
        isDemo: true
      });
      setLoading(false);
    }, 400);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onSuccess({
        name: 'Google Planner User',
        email: 'planner.user@gmail.com',
        role: 'Municipal Spatial Analyst',
        isDemo: true
      });
      setLoading(false);
    }, 500);
  };

  const handleGithubLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onSuccess({
        name: 'GitHub Geospatial Developer',
        email: 'dev@github.com',
        role: 'Open-Source GIS Contributor',
        isDemo: true
      });
      setLoading(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onSuccess({
        name: fullName || 'Urban Planner',
        email: email || 'planner@city.gov',
        role: 'Environmental Officer',
        isDemo: false
      });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Left Side: Form ── */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between max-w-lg mx-auto w-full">
          <div>
            {/* Header Brand */}
            <div className="flex items-center space-x-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                <TreePine className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                Urban Ecology Compiler
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              {mode === 'signup'
                ? 'Start planning greener, more resilient cities'
                : 'Continue planning a greener tomorrow'}
            </p>

            {/* Instant Demo Account Action (Hackathon Quick Access) */}
            <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">Hackathon Judge Demo</div>
                  <div className="text-[10px] text-emerald-700">Enter full workspace instantly without signing up</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 transition shadow-sm"
              >
                Try Demo Account →
              </button>
            </div>

            {/* Social Auth Buttons */}
            <div className="space-y-2 mb-5">
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-3 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-3 transition"
              >
                <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-mono text-slate-400">
                or
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Shruti Thakur"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shruti@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {/* Extra checkboxes */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                {mode === 'signup' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="rounded accent-emerald-700 w-3.5 h-3.5"
                    />
                    <span>I agree to the Terms and Privacy Policy</span>
                  </label>
                ) : (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded accent-emerald-700 w-3.5 h-3.5"
                      />
                      <span>Remember me</span>
                    </label>
                    <a href="#forgot" className="text-emerald-800 hover:underline">
                      Forgot password?
                    </a>
                  </>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition"
              >
                {loading
                  ? 'Authenticating...'
                  : mode === 'signup'
                  ? 'Sign Up'
                  : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
            {mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="font-bold text-emerald-800 hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New here?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-bold text-emerald-800 hover:underline"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>

        {/* ── Right Side: Architectural Biophilic Image Split (Desktop) ── */}
        <div className="hidden md:block w-[360px] relative bg-slate-900 overflow-hidden">
          <img
            src="/images/biophilic_building.jpg"
            alt="Biophilic architectural green city"
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-8 text-white">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold mb-1">
              Design Cities that Breathe
            </span>
            <p className="text-sm italic font-serif leading-relaxed text-slate-200">
              "AI can help us not just understand our cities, but reimagine them."
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="w-2 h-2 rounded-full bg-white/40"></span>
              <span className="w-2 h-2 rounded-full bg-white/40"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
