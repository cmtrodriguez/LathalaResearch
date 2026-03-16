/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  Menu, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Filter,
  Calendar as CalendarIcon,
  FileUp,
  History,
  FileCheck,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  X
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type Role = 'admin' | 'researcher' | 'evaluator';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  department?: string;
}

interface Research {
  id: number;
  hru_number: string;
  title: string;
  description: string;
  registration_date: string;
  hra_alignment: string;
  department: string;
  status_trb: string;
  status_rec: string;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick: () => void, collapsed?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative group",
      active ? "bg-brand-navy text-white shadow-xl shadow-brand-navy/20" : "text-brand-navy/60 hover:bg-brand-navy/5",
      collapsed && "justify-center px-0"
    )}
    title={collapsed ? label : undefined}
  >
    <Icon size={22} className={cn("shrink-0 transition-transform", active ? "scale-110" : "group-hover:scale-110")} />
    {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
    {active && !collapsed && (
      <motion.div 
        layoutId="active-pill"
        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-tan"
      />
    )}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color, trend }: { label: string, value: string | number, icon: any, color: string, trend?: string }) => (
  <div className="card group">
    <div className="flex items-start justify-between mb-4">
      <div className={cn("stat-icon-container text-white", color)}>
        <Icon size={22} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'info', key?: any }) => {
  const variants = {
    default: 'bg-brand-navy/5 text-brand-navy',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-700',
    info: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight", variants[variant])}>
      {children}
    </span>
  );
};

// --- Form Components ---

const SubmissionForm = ({ user, onCancel, onSuccess }: { user: User, onCancel: () => void, onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hra_alignment: '',
    department: user.department || '',
    co_authors: [] as string[],
  });
  const [newAuthor, setNewAuthor] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, researcher_id: user.id })
    });
    if (res.ok) onSuccess();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 z-50"
    >
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-brand-navy p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold">New Research Submission</h3>
            <p className="text-white/60 text-sm font-medium">Step {step} of 3</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold mb-4">Basic Information</h4>
              <div>
                <label className="block text-sm font-bold mb-1">Research Title</label>
                <input 
                  className="input-field" 
                  placeholder="Enter full research title"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Abstract / Description</label>
                <textarea 
                  className="input-field min-h-[120px]" 
                  placeholder="Briefly describe your research goals"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold mb-4">Categorization & Authors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">HRA Alignment</label>
                  <select 
                    className="input-field"
                    value={formData.hra_alignment}
                    onChange={e => setFormData({...formData, hra_alignment: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    <option value="Health Systems">Health Systems</option>
                    <option value="Clinical Research">Clinical Research</option>
                    <option value="Public Health">Public Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Department</label>
                  <input 
                    className="input-field" 
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Co-Authors</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    className="input-field" 
                    placeholder="Add co-author name"
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      if (newAuthor) {
                        setFormData({...formData, co_authors: [...formData.co_authors, newAuthor]});
                        setNewAuthor('');
                      }
                    }}
                    className="btn-primary"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.co_authors.map((author, i) => (
                    <Badge key={i} variant="info">
                      {author}
                      <button 
                        onClick={() => setFormData({...formData, co_authors: formData.co_authors.filter((_, idx) => idx !== i)})}
                        className="ml-2 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold mb-4">Document Upload</h4>
              <div className="border-2 border-dashed border-brand-navy/10 rounded-2xl p-10 text-center hover:border-brand-navy/30 transition-colors cursor-pointer">
                <FileUp className="mx-auto text-brand-navy/20 mb-4" size={48} />
                <p className="font-bold text-brand-navy">Click to upload or drag and drop</p>
                <p className="text-sm text-brand-navy/40 mt-1">PDF, Excel, or PowerPoint (Max 10MB)</p>
              </div>
              <div className="bg-brand-cream/50 p-4 rounded-xl">
                <p className="text-xs font-bold uppercase text-brand-navy/40 mb-2">Summary</p>
                <p className="text-sm font-bold">{formData.title || 'Untitled Research'}</p>
                <p className="text-xs text-brand-navy/60 mt-1">{formData.co_authors.length} Co-authors listed</p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-10">
            <button 
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 font-bold text-brand-navy/40 hover:text-brand-navy disabled:opacity-0"
            >
              <ArrowLeft size={18} /> Back
            </button>
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="btn-primary flex items-center gap-2 px-8"
              >
                Next <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="btn-primary flex items-center gap-2 px-8 bg-emerald-600 hover:bg-emerald-700"
              >
                Submit Research <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ReviewPanel = ({ research, user, onCancel, onSuccess }: { research: Research, user: User, onCancel: () => void, onSuccess: () => void }) => {
  const [reviewData, setReviewData] = useState({
    review_type: 'TRB' as 'TRB' | 'REC',
    comments: '',
    status: 'Under Review'
  });

  const handleSubmit = async () => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...reviewData,
        research_id: research.id,
        reviewer_id: user.id
      })
    });
    if (res.ok) onSuccess();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col"
    >
      <div className="bg-brand-navy p-6 text-white flex justify-between items-center shrink-0">
        <h3 className="text-xl font-bold">Review Panel</h3>
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        <div>
          <p className="text-xs font-bold uppercase text-brand-navy/40 mb-1">Research Title</p>
          <p className="font-bold text-lg leading-tight">{research.title}</p>
          <p className="text-xs font-mono mt-1 opacity-60">{research.hru_number}</p>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div>
            <label className="block text-sm font-bold mb-1">Review Category</label>
            <div className="flex gap-2">
              {['TRB', 'REC'].map(type => (
                <button 
                  key={type}
                  onClick={() => setReviewData({...reviewData, review_type: type as any})}
                  className={cn(
                    "flex-1 py-2 rounded-lg border font-bold text-sm transition-all",
                    reviewData.review_type === type ? "bg-brand-navy text-white border-brand-navy" : "border-black/10 text-brand-navy/40"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Evaluation Status</label>
            <select 
              className="input-field"
              value={reviewData.status}
              onChange={e => setReviewData({...reviewData, status: e.target.value})}
            >
              <option value="Under Review">Under Review</option>
              <option value="Needs Revision">Needs Revision</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Reviewer Comments</label>
            <textarea 
              className="input-field min-h-[150px]" 
              placeholder="Provide detailed feedback for the researcher..."
              value={reviewData.comments}
              onChange={e => setReviewData({...reviewData, comments: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t bg-brand-cream/30">
        <button onClick={handleSubmit} className="w-full btn-primary py-3 text-lg font-bold">
          Submit Evaluation
        </button>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [researchList, setResearchList] = useState<Research[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResearchForReview, setSelectedResearchForReview] = useState<Research | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (user) {
      fetchResearch();
      fetchAnalytics();
      if (user.role === 'admin') fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsersList(data);
  };

  const fetchResearch = async () => {
    const res = await fetch(`/api/research?userId=${user?.id}&role=${user?.role}`);
    const data = await res.json();
    setResearchList(data);
  };

  const fetchAnalytics = async () => {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    setAnalytics(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data);
      setLoginModalOpen(false);
    } else {
      let errorMessage = 'Unknown error';
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || res.statusText || `Error ${res.status}`;
        } catch (e) {
          errorMessage = `JSON Parse Error: ${res.status} ${res.statusText}`;
        }
      } else {
        const text = await res.text();
        errorMessage = `Server Error (${res.status}): ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`;
      }
      alert(`Login failed: ${errorMessage}`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, role: 'researcher' })
    });

    if (res.ok) {
      alert("Registration successful! Please sign in.");
      setIsSignUp(false);
    } else {
      alert("Registration failed. Email might already exist.");
    }
  };

  if (isLoginModalOpen) {
    return (
      <div className="auth-split-layout">
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-brand-navy text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-brand-tan rounded-2xl flex items-center justify-center shadow-xl shadow-brand-tan/10">
                <FileText className="text-brand-navy" size={24} />
              </div>
              <span className="text-3xl font-serif font-bold tracking-tight">Lathala</span>
            </div>
            
            <div className="space-y-8 max-w-md">
              <h1 className="text-6xl font-serif font-bold leading-tight">
                Elevating <span className="text-brand-tan">Institutional</span> Research.
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">
                A comprehensive platform designed for academic excellence, ethics compliance, and streamlined research management.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-8">
            <div>
              <p className="text-4xl font-bold text-brand-tan">500+</p>
              <p className="text-sm text-white/40 font-bold uppercase tracking-widest mt-1">Research Projects</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-brand-tan">98%</p>
              <p className="text-sm text-white/40 font-bold uppercase tracking-widest mt-1">Compliance Rate</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-tan rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-brand-slate rounded-full blur-[120px]" />
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white">
          <motion.div 
            key={isSignUp ? 'signup' : 'login'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <span className="text-2xl font-serif font-bold">Lathala</span>
            </div>

            <div>
              <h2 className="text-4xl font-serif font-bold text-brand-navy">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-brand-navy/50 mt-2 font-medium">
                {isSignUp ? 'Join our research community today.' : 'Sign in to manage your research projects.'}
              </p>
            </div>
            
            {isSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-4">
                  {signUpStep === 1 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Full Name</label>
                        <input name="full_name" type="text" required className="input-field" placeholder="Dr. Jane Doe" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Email Address</label>
                        <input name="email" type="email" required className="input-field" placeholder="jane.doe@institution.edu" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Password</label>
                        <input name="password" type="password" required className="input-field" placeholder="••••••••••••" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Department</label>
                          <input name="department" type="text" required className="input-field" placeholder="Medicine" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Position</label>
                          <input name="position" type="text" required className="input-field" placeholder="Professor" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Contact</label>
                          <input name="phone" type="text" className="input-field" placeholder="+1..." />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Type</label>
                          <select name="type" className="input-field">
                            <option value="internal">Internal Researcher</option>
                            <option value="external">External Researcher</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3">
                  {signUpStep === 2 && (
                    <button type="button" onClick={() => setSignUpStep(1)} className="btn-secondary flex-1">
                      Back
                    </button>
                  )}
                  {signUpStep === 1 ? (
                    <button type="button" onClick={() => setSignUpStep(2)} className="btn-primary flex-1">
                      Next Step
                    </button>
                  ) : (
                    <button type="submit" className="btn-primary flex-1">
                      Complete Registration
                    </button>
                  )}
                </div>

                <p className="text-center text-sm font-medium text-brand-navy/40">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setIsSignUp(false)} className="text-brand-navy font-bold hover:underline">
                    Sign In
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Email Address</label>
                    <input name="email" type="email" required className="input-field" placeholder="admin@lathala.edu" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-1">Password</label>
                    <input name="password" type="password" required className="input-field" placeholder="••••••••••••" />
                  </div>
                  <p className="text-[10px] text-brand-navy/30 font-medium px-1">
                    Default Admin: admin@lathala.edu / admin123
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-brand-navy/60 font-medium">
                    <input type="checkbox" className="rounded border-black/10 text-brand-navy focus:ring-brand-navy" />
                    Remember me
                  </label>
                  <button type="button" className="text-brand-navy font-bold hover:underline">Forgot password?</button>
                </div>

                <button type="submit" className="w-full btn-primary">
                  Sign In to Dashboard
                </button>

                <p className="text-center text-sm font-medium text-brand-navy/40">
                  New to Lathala?{' '}
                  <button type="button" onClick={() => setIsSignUp(true)} className="text-brand-navy font-bold hover:underline">
                    Create Account
                  </button>
                </p>
              </form>
            )}

            <div className="pt-8 border-t border-black/5 text-center">
              <p className="text-xs text-brand-navy/30 font-medium">
                © 2024 Lathala Research Management System. <br className="sm:hidden" /> All rights reserved.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-brand-cream/30">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 100,
          x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        className={cn(
          "bg-white border-r border-black/[0.03] flex flex-col p-6 fixed lg:sticky top-0 h-screen z-50 transition-all duration-500 ease-in-out shadow-2xl lg:shadow-none",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="flex items-center justify-between mb-12 px-2 w-full">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-12 h-12 bg-brand-navy rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-xl shadow-brand-navy/20">
              <FileText className="text-white" size={24} />
            </div>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-serif font-bold tracking-tight text-brand-navy"
              >
                Lathala
              </motion.span>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 hover:bg-black/5 rounded-xl">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 w-full">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={FileText} 
            label="Research Inventory" 
            active={activeTab === 'research'} 
            onClick={() => { setActiveTab('research'); setIsMobileMenuOpen(false); }}
            collapsed={!isSidebarOpen}
          />
          {(user?.role === 'admin' || user?.role === 'evaluator') && (
            <SidebarItem 
              icon={Search} 
              label="Review Queue" 
              active={activeTab === 'review-queue'} 
              onClick={() => { setActiveTab('review-queue'); setIsMobileMenuOpen(false); }}
              collapsed={!isSidebarOpen}
            />
          )}
          {user?.role === 'admin' && (
            <SidebarItem 
              icon={Users} 
              label="User Management" 
              active={activeTab === 'users'} 
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              collapsed={!isSidebarOpen}
            />
          )}
          <SidebarItem 
            icon={History} 
            label="Activity Log" 
            active={activeTab === 'activity'} 
            onClick={() => { setActiveTab('activity'); setIsMobileMenuOpen(false); }}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={FileText} 
            label="System Specs" 
            active={activeTab === 'docs'} 
            onClick={() => { setActiveTab('docs'); setIsMobileMenuOpen(false); }}
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="pt-6 border-t border-black/5 space-y-2 w-full">
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            onClick={() => {}} 
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={LogOut} 
            label="Logout" 
            onClick={() => { setLoginModalOpen(true); setIsMobileMenuOpen(false); }} 
            collapsed={!isSidebarOpen}
          />
          
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-brand-navy/30 hover:text-brand-navy hover:bg-brand-navy/5 transition-all mt-4"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} className="mx-auto" />}
            {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-widest">Collapse Menu</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="glass-nav px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileMenuOpen(true);
                } else {
                  setSidebarOpen(!isSidebarOpen);
                }
              }} 
              className="p-2 hover:bg-black/5 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/30" size={18} />
              <input 
                type="text" 
                placeholder="Search research, authors..." 
                className="bg-brand-cream/50 pl-10 pr-4 py-2.5 rounded-xl w-64 focus:outline-none focus:ring-4 focus:ring-brand-navy/5 transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">{user?.full_name}</p>
              <p className="text-[10px] text-brand-navy/40 uppercase font-bold tracking-wider mt-1">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-brand-navy text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-brand-navy/20">
              {user?.full_name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence>
            {isSubmitting && (
              <SubmissionForm 
                user={user!} 
                onCancel={() => setIsSubmitting(false)} 
                onSuccess={() => {
                  setIsSubmitting(false);
                  fetchResearch();
                  fetchAnalytics();
                }} 
              />
            )}
            {selectedResearchForReview && (
              <ReviewPanel 
                research={selectedResearchForReview} 
                user={user!} 
                onCancel={() => setSelectedResearchForReview(null)} 
                onSuccess={() => {
                  setSelectedResearchForReview(null);
                  fetchResearch();
                  fetchAnalytics();
                }} 
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-[3rem] bg-brand-navy p-8 lg:p-16 text-white shadow-2xl group">
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div className="max-w-2xl space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-brand-tan animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-tan">System Online</span>
                      </div>
                      <h2 className="text-5xl lg:text-7xl font-serif font-bold leading-[1.1]">
                        {greeting}, <br />
                        <span className="text-brand-tan">{user?.full_name.split(' ')[0]}</span>
                      </h2>
                      <p className="text-white/60 text-xl font-medium leading-relaxed max-w-lg">
                        Your research portfolio is growing. You have <span className="text-white font-bold underline decoration-brand-tan underline-offset-8">{analytics?.stats?.under_review?.count || 0} projects</span> currently in the review pipeline.
                      </p>
                      <div className="flex flex-wrap gap-4 pt-4">
                        {user?.role === 'researcher' && (
                          <button onClick={() => setIsSubmitting(true)} className="bg-white text-brand-navy px-8 py-4 rounded-2xl font-bold text-sm hover:bg-brand-tan hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-white/5">
                            <Plus size={20} />
                            New Submission
                          </button>
                        )}
                        <button onClick={() => setActiveTab('research')} className="bg-white/5 backdrop-blur-xl text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-white/10 hover:scale-105 active:scale-95 transition-all border border-white/10 flex items-center gap-3">
                          Explore Inventory <ArrowRight size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="hidden xl:block relative">
                      <div className="w-64 h-64 bg-brand-tan/10 rounded-[3rem] border border-brand-tan/20 flex items-center justify-center backdrop-blur-3xl rotate-12 group-hover:rotate-6 transition-transform duration-700">
                        <div className="w-48 h-48 bg-brand-tan/20 rounded-[2.5rem] border border-brand-tan/30 flex items-center justify-center -rotate-12 group-hover:-rotate-3 transition-transform duration-700">
                          <FileText className="text-brand-tan" size={64} />
                        </div>
                      </div>
                      {/* Floating Stats */}
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl"
                      >
                        <p className="text-[10px] font-bold uppercase text-brand-tan">Active Reviewers</p>
                        <p className="text-2xl font-bold">12</p>
                      </motion.div>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-tan/5 to-transparent pointer-events-none" />
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-tan/10 rounded-full blur-[120px] pointer-events-none" />
                  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-slate/10 rounded-full blur-[120px] pointer-events-none" />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                  <StatCard label="Total Submissions" value={analytics?.stats?.total?.count || 0} icon={FileText} color="bg-brand-navy" trend="+12%" />
                  <StatCard label="Ongoing Projects" value={analytics?.stats?.under_review?.count || 0} icon={Clock} color="bg-brand-slate" />
                  <StatCard label="Approved" value={analytics?.stats?.approved?.count || 0} icon={CheckCircle} color="bg-emerald-600" trend="85%" />
                  <StatCard label="Rejected" value={analytics?.stats?.rejected?.count || 0} icon={AlertCircle} color="bg-rose-600" />
                  <StatCard label="Under Review" value={analytics?.stats?.under_review?.count || 0} icon={Search} color="bg-brand-tan text-brand-navy" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Chart */}
                  <div className="card lg:col-span-2 overflow-hidden flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                      <div>
                        <h3 className="text-2xl font-bold">Research Distribution</h3>
                        <p className="text-brand-navy/40 text-sm font-medium">Breakdown by current status and board</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="success">92% Approval Rate</Badge>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[400px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={[
                            { name: 'Approved', value: analytics?.stats?.approved?.count || 12, color: '#10b981' },
                            { name: 'Under Review', value: analytics?.stats?.under_review?.count || 4, color: '#2d334a' },
                            { name: 'Needs Revision', value: 3, color: '#f59e0b' },
                            { name: 'Rejected', value: analytics?.stats?.rejected?.count || 1, color: '#f43f5e' },
                            { name: 'Retracted', value: 2, color: '#8b5cf6' },
                            { name: 'Disapproved', value: 1, color: '#3b82f6' },
                          ]}
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            width={100}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#2d334a', opacity: 0.6 }}
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[0, 10, 10, 0]} 
                            barSize={32}
                          >
                            {[
                              { name: 'Approved', value: analytics?.stats?.approved?.count || 12, color: '#10b981' },
                              { name: 'Under Review', value: analytics?.stats?.under_review?.count || 4, color: '#2d334a' },
                              { name: 'Needs Revision', value: 3, color: '#f59e0b' },
                              { name: 'Rejected', value: analytics?.stats?.rejected?.count || 1, color: '#f43f5e' },
                              { name: 'Retracted', value: 2, color: '#8b5cf6' },
                              { name: 'Disapproved', value: 1, color: '#3b82f6' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Calendar Widget */}
                  <div className="card flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold">Calendar</h3>
                      <div className="p-2 bg-brand-cream rounded-xl">
                        <CalendarIcon size={20} className="text-brand-navy" />
                      </div>
                    </div>
                    <div className="space-y-6 flex-1">
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-brand-navy/30 uppercase mb-4">
                        {['S','M','T','W','T','F','S'].map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({length: 31}).map((_, i) => {
                          const isToday = i + 1 === new Date().getDate();
                          const hasEvent = [12, 18, 25].includes(i + 1);
                          return (
                            <div 
                              key={i} 
                              className={cn(
                                "aspect-square flex flex-col items-center justify-center text-xs rounded-xl transition-all cursor-pointer relative",
                                isToday ? "bg-brand-navy text-white font-bold shadow-lg shadow-brand-navy/20" : "hover:bg-brand-navy/5 text-brand-navy/60"
                              )}
                            >
                              {i + 1}
                              {hasEvent && !isToday && (
                                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-brand-tan" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-6 space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">Upcoming Deadlines</p>
                        <div className="space-y-3">
                          {[
                            { day: '12', title: 'TRB Review Deadline', sub: 'Project #HRU-2024-08', color: 'bg-brand-tan' },
                            { day: '18', title: 'REC Ethics Clearance', sub: 'Project #HRU-2024-15', color: 'bg-brand-slate' },
                          ].map((event, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-brand-cream/30 rounded-2xl border border-black/[0.02] hover:border-black/5 transition-all group cursor-pointer">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-110", event.color)}>
                                {event.day}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{event.title}</p>
                                <p className="text-[10px] text-brand-navy/40 font-medium truncate">{event.sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Submissions */}
                  <div className="card lg:col-span-2 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold">Recent Submissions</h3>
                        <p className="text-brand-navy/40 text-sm font-medium">Latest research added to the system</p>
                      </div>
                      <button onClick={() => setActiveTab('research')} className="btn-secondary py-2 px-4 text-xs">
                        View All
                      </button>
                    </div>
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="border-b border-black/5 text-[10px] uppercase tracking-widest text-brand-navy/40">
                            <th className="pb-4 font-bold">HRU Number</th>
                            <th className="pb-4 font-bold">Research Title</th>
                            <th className="pb-4 font-bold">Status</th>
                            <th className="pb-4 font-bold">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {researchList.slice(0, 5).map((item) => (
                            <tr key={item.id} className="group hover:bg-brand-cream/30 transition-all cursor-pointer">
                              <td className="py-5 font-mono text-[10px] opacity-40">{item.hru_number}</td>
                              <td className="py-5">
                                <p className="font-bold text-sm max-w-[250px] truncate group-hover:text-brand-navy transition-colors" title={item.title}>{item.title}</p>
                                <p className="text-[10px] text-brand-navy/40 font-medium truncate max-w-[250px]">{item.department}</p>
                              </td>
                              <td className="py-5">
                                <Badge variant={item.status_trb === 'Approved' ? 'success' : 'warning'}>
                                  {item.status_trb}
                                </Badge>
                              </td>
                              <td className="py-5 text-xs text-brand-navy/50 font-medium">
                                {new Date(item.registration_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Activity History */}
                  <div className="card flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold">Activity Log</h3>
                      <div className="p-2 bg-brand-cream rounded-xl">
                        <History size={20} className="text-brand-navy" />
                      </div>
                    </div>
                    <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-brand-navy/5 flex-1">
                      {[
                        { text: 'Research "AI Trends" approved by REC', time: '10m ago', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { text: 'New document uploaded for Project #82', time: '1h ago', icon: FileUp, color: 'text-brand-slate', bg: 'bg-brand-slate/10' },
                        { text: 'Review requested for "Climate Study"', time: '3h ago', icon: MessageSquare, color: 'text-brand-tan', bg: 'bg-brand-tan/20' },
                        { text: 'System maintenance completed', time: '5h ago', icon: Settings, color: 'text-brand-navy', bg: 'bg-brand-navy/5' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 relative z-10 group cursor-pointer">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 border border-white shadow-sm", item.bg, item.color)}>
                            <item.icon size={18} />
                          </div>
                          <div className="min-w-0 pt-1">
                            <p className="text-xs font-bold leading-snug group-hover:text-brand-navy transition-colors">{item.text}</p>
                            <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-wider mt-1">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-8 py-3 rounded-2xl border border-black/5 text-xs font-bold text-brand-navy/40 hover:bg-brand-cream/50 transition-all">
                      View Full Activity Log
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {(activeTab === 'research' || activeTab === 'review-queue') && (
              <motion.div 
                key="research-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold">{activeTab === 'research' ? 'Research Inventory' : 'Review Queue'}</h2>
                    <p className="text-brand-navy/50">Manage and track all institutional research projects.</p>
                  </div>
                  {user?.role === 'researcher' && (
                    <button onClick={() => setIsSubmitting(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
                      <Plus size={18} />
                      New Submission
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/30" size={18} />
                    <input type="text" placeholder="Search by title, author, or HRU number..." className="input-field pl-10" />
                  </div>
                  <button className="flex items-center gap-2 bg-white px-6 py-2 rounded-xl border border-black/5 font-bold text-sm justify-center">
                    <Filter size={18} />
                    Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {researchList.map((item) => (
                    <div key={item.id} className="card group hover:border-brand-navy/20 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="space-y-3 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="info">{item.hru_number}</Badge>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">
                              Submitted {new Date(item.registration_date).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold group-hover:text-brand-navy transition-colors truncate" title={item.title}>{item.title}</h3>
                          <p className="text-sm text-brand-navy/60 line-clamp-2 leading-relaxed">{item.description}</p>
                          
                          <div className="flex flex-wrap gap-x-8 gap-y-4 pt-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-1">TRB Status</span>
                              <Badge variant={item.status_trb === 'Approved' ? 'success' : 'warning'}>{item.status_trb}</Badge>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-1">REC Status</span>
                              <Badge variant={item.status_rec === 'Approved' ? 'success' : 'warning'}>{item.status_rec}</Badge>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-1">Department</span>
                              <span className="text-xs font-bold truncate max-w-[150px]">{item.department}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 shrink-0">
                          {user?.role === 'evaluator' && (
                            <button 
                              onClick={() => setSelectedResearchForReview(item)}
                              className="btn-primary flex items-center gap-2 py-2 px-6 text-sm flex-1 lg:flex-none justify-center"
                            >
                              <FileCheck size={16} /> Review
                            </button>
                          )}
                          <div className="flex gap-1">
                            <button className="p-2.5 hover:bg-brand-navy/5 rounded-xl text-brand-navy/40 hover:text-brand-navy transition-colors" title="Upload Files">
                              <FileUp size={20} />
                            </button>
                            <button className="p-2.5 hover:bg-brand-navy/5 rounded-xl text-brand-navy/40 hover:text-brand-navy transition-colors" title="Settings">
                              <Settings size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'docs' && (
              <motion.div 
                key="docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 max-w-4xl mx-auto"
              >
                <h2 className="text-3xl font-bold">System Design Specification</h2>
                
                <section className="card space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">1. System Roles & Responsibilities</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Admin:</strong> System configuration, user account creation (Researchers/Evaluators), global analytics monitoring, and oversight of all submissions.</li>
                    <li><strong>Researcher:</strong> Registration of projects, multi-author management, document uploads (PDF/Excel/PPT), and tracking approval progress (TRB/REC).</li>
                    <li><strong>Evaluator:</strong> Internal reviewers responsible for technical (TRB) and ethical (REC) assessments, providing feedback, and assigning final statuses.</li>
                  </ul>
                </section>

                <section className="card space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">2. User Flow</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-brand-navy/5 rounded-xl">
                      <p className="font-bold">Account</p>
                      <p className="text-xs">Admin creates credentials</p>
                    </div>
                    <div className="p-4 bg-brand-navy/5 rounded-xl">
                      <p className="font-bold">Submission</p>
                      <p className="text-xs">Researcher uploads docs</p>
                    </div>
                    <div className="p-4 bg-brand-navy/5 rounded-xl">
                      <p className="font-bold">Review</p>
                      <p className="text-xs">TRB/REC Evaluators assess</p>
                    </div>
                    <div className="p-4 bg-brand-navy/5 rounded-xl">
                      <p className="font-bold">Approval</p>
                      <p className="text-xs">Final status & HRU issued</p>
                    </div>
                  </div>
                </section>

                <section className="card space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">3. ERD (Entity Relationship Diagram)</h3>
                  <div className="font-mono text-sm bg-brand-navy text-white p-6 rounded-xl overflow-x-auto">
                    <pre>{`
[Users] 1 --- * [Research]
   |                |
   |                +--- * [Co-Authors]
   |                |
   |                +--- * [Documents]
   |                |
   +--- * [Reviews] <---+
                    `}</pre>
                    <p className="mt-4 text-xs opacity-60">Entities: Users (Admin/Res/Eval), Research (Title/Status), Co-Authors, Documents (PDF/XLS), Reviews (Comments/Status).</p>
                  </div>
                </section>

                <section className="card space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">4. Dashboard Metrics</h3>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Metric</th>
                        <th className="py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr><td className="py-2 font-medium">Total Submissions</td><td className="py-2">Cumulative count of all registered research.</td></tr>
                      <tr><td className="py-2 font-medium">Approval Rate</td><td className="py-2">Percentage of research passing both TRB and REC.</td></tr>
                      <tr><td className="py-2 font-medium">Reviewer Activity</td><td className="py-2">Monthly count of evaluations completed per reviewer.</td></tr>
                    </tbody>
                  </table>
                </section>

                <section className="card space-y-4">
                  <h3 className="text-xl font-bold border-b pb-2">5. Suggested Spreadsheet Structure</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border">
                      <thead className="bg-brand-navy text-white">
                        <tr>
                          <th className="p-2 border">Research Title</th>
                          <th className="p-2 border">Author</th>
                          <th className="p-2 border">Department</th>
                          <th className="p-2 border">HRU Number</th>
                          <th className="p-2 border">TRB Status</th>
                          <th className="p-2 border">REC Status</th>
                          <th className="p-2 border">Submission Date</th>
                          <th className="p-2 border">Approval Date</th>
                          <th className="p-2 border">Reviewer</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 border">Impact of AI in Rural Clinics</td>
                          <td className="p-2 border">Dr. Jane Doe</td>
                          <td className="p-2 border">Medicine</td>
                          <td className="p-2 border">HRU-2024-001</td>
                          <td className="p-2 border">Approved</td>
                          <td className="p-2 border">Pending</td>
                          <td className="p-2 border">2024-01-15</td>
                          <td className="p-2 border">-</td>
                          <td className="p-2 border">Prof. Smith</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">User Management</h2>
                    <p className="text-brand-navy/50">Manage institutional accounts and permissions.</p>
                  </div>
                  <button className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Add User
                  </button>
                </div>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-black/5 text-[10px] uppercase tracking-widest text-brand-navy/40">
                          <th className="pb-4 font-bold">Name</th>
                          <th className="pb-4 font-bold">Email</th>
                          <th className="pb-4 font-bold">Role</th>
                          <th className="pb-4 font-bold">Department</th>
                          <th className="pb-4 font-bold">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {usersList.map((u) => (
                          <tr key={u.id} className="group hover:bg-brand-cream/50 transition-all">
                            <td className="py-4 font-bold text-sm">{u.full_name}</td>
                            <td className="py-4 text-sm text-brand-navy/60">{u.email}</td>
                            <td className="py-4">
                              <Badge variant={u.role === 'admin' ? 'error' : u.role === 'evaluator' ? 'info' : 'default'}>
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-4 text-sm font-medium">{u.department || '-'}</td>
                            <td className="py-4">
                              <span className="text-[10px] font-bold uppercase opacity-40">{u.type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
