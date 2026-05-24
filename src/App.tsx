import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  Users, FileText, Award, TrendingUp, Clock, DollarSign, CheckCircle,
  XCircle, Eye, Plus, LogOut, Search, ArrowRight, Image as ImageIcon, X, Edit,
  View
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { i } from 'framer-motion/client';

import GoogleTranslate from "./assets/GoogleTranslate";

// Types
type Role = 'buyer' | 'supplier' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  profileImage?: string; // optional base64 avatar
}

interface RFQ {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  budget: number;
  buyerId: string;
  buyerName: string;
  status: 'open' | 'closed';
  createdAt: string;
  image?: string; // optional base64 data URL
}

interface Quotation {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  price: number;
  deliveryTime: string;
  note: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  image?: string; // optional base64 data URL
}

// Toast Type
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// JFKL Loader Component
const JFKLLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'text-xl gap-1.5',
    md: 'text-3xl gap-2',
    lg: 'text-5xl gap-3'
  };
  return (
    <div className={`jfkl-loader ${sizes[size]}`}>
      {['b', 'e', 'l', 't'].map((letter, index) => (
        <motion.span
          key={index}
          className="jfkl-letter font-black tracking-tighter text-blue-600"
          animate={{ y: [0, -12, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.12, ease: "easeInOut" }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
};

// Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> =
  ({ isOpen, onClose, title, children, size = 'lg' }) => {
    const sizes = { md: 'max-w-md', lg: 'max-w-xl md:max-w-3xl', xl: 'max-w-xl md:max-w-6xl' };

    if (!isOpen) return null;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} overflow-hidden modal`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <XCircle size={22} />
              </button>
            </div>
            <div className="p-5 md:p-6 max-h-[80vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

// Toast Component
const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-[60] space-y-3">
    <AnimatePresence>
      {toasts.map(toast => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          className={`toast flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl text-white max-w-sm ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-slate-800'
            }`}
        >
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
            <XCircle size={18} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// Main App Component
function RFQPlatform() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'buyer' | 'supplier' | 'admin' | 'profile'>('home');

  // Data States
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // UI States
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPostRFQ, setShowPostRFQ] = useState(false);
  const [showSubmitQuote, setShowSubmitQuote] = useState(false);
  const [showRFQDetails, setShowRFQDetails] = useState(false);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [rfqForQuote, setRfqForQuote] = useState<RFQ | null>(null);

  // Form States
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', phone: '', password: '', role: 'buyer' as Role });
  const [postRFQForm, setPostRFQForm] = useState({ title: '', description: '', category: 'Electronics', deadline: '', budget: '', image: '' as string | null });
  const [submitQuoteForm, setSubmitQuoteForm] = useState({ price: '', deliveryTime: '', note: '', image: '' as string | null });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', profileImage: '' as string | null });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingRFQId, setEditingRFQId] = useState<string | null>(null);
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const categories = ['Electronics', 'Manufacturing', 'Logistics', 'Services', 'Raw Materials', 'IT Services'];

  // Load from localStorage
  useEffect(() => {
    const savedRfqs = localStorage.getItem('rfqs');
    const savedQuotations = localStorage.getItem('quotations');
    const savedUsers = localStorage.getItem('users');
    const savedUser = localStorage.getItem('currentUser');

    if (savedRfqs) setRfqs(JSON.parse(savedRfqs));
    if (savedQuotations) setQuotations(JSON.parse(savedQuotations));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    // Seed initial demo data if empty disable when APIs are ready
    // if (!savedRfqs || JSON.parse(savedRfqs).length === 0) {
    //   seedDemoData();      
    // }
    getAndUpdateData(); // Fetch real data from APIs enable when APIs are ready
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('rfqs', JSON.stringify(rfqs));
  }, [rfqs]);

  useEffect(() => {
    localStorage.setItem('quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      setProfileForm({
        name: currentUser.name,
        email: currentUser.email,
        profileImage: currentUser.profileImage || null
      });
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Getting & Refreshing actual Data from APIs enable when APIs are ready
  const getAndUpdateData = async () => {
    try {
      const rfqsResponse = await fetch('http://188.245.80.22:8000/api/v1/rfqs'); // api/rfqs
      const rfqsFound = await rfqsResponse.json();
      const quotationsResponse = await fetch('http://188.245.80.22:8000/api/v1/quotations'); // api/quotations
      const quotationsFound = await quotationsResponse.json();
      // const usersResponse = await fetch('https://example.com/api/users');
      setRfqs(rfqsFound.data);
      console.log('RFQs:', rfqs); // to test if we got the rfqs right
      setQuotations(quotationsFound.data);
      console.log('Quotations:', quotations); // to test if we got the quotations right
      // setUsers((await usersResponse.json()));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Seed Demo Data. Disable when APIs are ready
  // const seedDemoData = () => {
  //   const demoUsers: User[] = [
  //     { id: 'u1', name: 'Sarah Chen', email: 'sarah@buyer.com' , phone: '123456789' , password: 'password', role: 'buyer', profileImage: undefined },
  //     { id: 'u2', name: 'Marcus Rivera', email: 'marcus@supplier.com', phone: '987654321', password: 'password', role: 'supplier', profileImage: undefined },
  //     { id: 'u3', name: 'Elena Rodriguez', email: 'elena@supplier.com', phone: '555555555', password: 'password', role: 'supplier', profileImage: undefined },
  //     { id: 'u4', name: 'David Kim', email: 'david@admin.com', phone: '111111111', password: 'password', role: 'admin', profileImage: undefined },
  //   ];
  //   setUsers(demoUsers);

  //   const demoRFQs: RFQ[] = [
  //     {
  //       id: 'r1', title: 'Industrial CNC Machine Procurement', description: 'We need 4 high-precision CNC milling machines for our new production line. Must support 5-axis machining and have a minimum spindle speed of 12,000 RPM.',
  //       category: 'Manufacturing', deadline: '2025-02-28', budget: 245000, buyerId: 'u1', buyerName: 'Sarah Chen', status: 'open', createdAt: '2025-01-15'
  //     },
  //     {
  //       id: 'r2', title: 'Enterprise Cloud Migration Services', description: 'Complete migration of 120 servers and 40TB of data to AWS. Includes security audits, training for 18 staff members and 12-month support contract.',
  //       category: 'IT Services', deadline: '2025-03-10', budget: 89000, buyerId: 'u1', buyerName: 'Sarah Chen', status: 'open', createdAt: '2025-01-18'
  //     },
  //     {
  //       id: 'r3', title: 'High-Grade Titanium Alloy Supply', description: 'Monthly supply of Grade 5 Titanium alloy bars (Ti-6Al-4V) - 2.8 tons per month for 18 months. Strict quality certifications required.',
  //       category: 'Raw Materials', deadline: '2025-02-20', budget: 156000, buyerId: 'u1', buyerName: 'Sarah Chen', status: 'open', createdAt: '2025-01-20'
  //     },
  //   ];
  //   setRfqs(demoRFQs);

  //   const demoQuotes: Quotation[] = [
  //     { id: 'q1', rfqId: 'r1', supplierId: 'u2', supplierName: 'Marcus Rivera', supplierPhone: '987654321', price: 231000, deliveryTime: '10 weeks', note: 'Full 3-year warranty included. Installation and staff training provided at no additional cost.', status: 'pending', submittedAt: '2025-01-19' },
  //     { id: 'q2', rfqId: 'r1', supplierId: 'u3', supplierName: 'Elena Rodriguez', supplierPhone: '555555555', price: 219800, deliveryTime: '8 weeks', note: 'Premium European brand. Includes 24/7 remote monitoring and free spare parts kit.', status: 'pending', submittedAt: '2025-01-20' },
  //     { id: 'q3', rfqId: 'r2', supplierId: 'u2', supplierName: 'Marcus Rivera', supplierPhone: '987654321', price: 78500, deliveryTime: '6 weeks', note: 'Comprehensive migration plan with zero downtime guarantee. All staff training included.', status: 'pending', submittedAt: '2025-01-21' },
  //   ];
  //   setQuotations(demoQuotes);
  // };

  // Toast Handler
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4200);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Authentication
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpForm.name || !signUpForm.email || !signUpForm.phone) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const newUser: User = {
      // id: 'u' + Date.now(),  // ID will be generated by backend when posted to API dissable when APIs are ready
      name: signUpForm.name,
      email: signUpForm.email,
      phone: signUpForm.phone,
      password: signUpForm.password,
      role: signUpForm.role,
      profileImage: undefined
    };

    // Posting to API enable when APIs are ready
    const responce = await fetch('http://188.245.80.22:8000/api/v1/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser)
    });
    if (responce.status === 201 || responce.status === 200) {
      // setCurrentUser(newUser);  // We'll do direct login later
      setShowSignUp(false);
      setSignUpForm({ name: '', email: '', phone: '', password: '', role: 'buyer' });

      // setCurrentPage(newUser.role === 'buyer' ? 'buyer' : newUser.role === 'supplier' ? 'supplier' : 'admin');
      // showToast(`Welcome to belt RFQ, ${newUser.name}!`, 'success');  
      showToast(`Registration successful! Please sign in`, 'success');
    } else {
      showToast('Something went wrong', 'error');
    }

    // Local signUp without API. Dissable when APIs are ready
    // setUsers(prev => [...prev, newUser]);
    // setCurrentUser(newUser);
    // setShowSignUp(false);
    // setSignUpForm({ name: '', email: '', phone: '', password: '', role: 'buyer' });

    // setCurrentPage(newUser.role === 'buyer' ? 'buyer' : newUser.role === 'supplier' ? 'supplier' : 'admin');
    // showToast(`Welcome to belt RFQ, ${newUser.name}!`, 'success');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Fetching from API enable when APIs are ready
    const responce = await fetch('http://188.245.80.22:8000/api/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signInForm)
    });
    const result = await responce.json(); // await responce.data
    const foundUser = result.user;
    if (responce.status === 201 || responce.status === 200) {
      localStorage.setItem('token', result.token); // Save token for authenticated requests  2|BjvhN9XuTjtqPlr5wu7uMnHx7s9MGPB1fD7UtF363d68820c
      console.log('Logged in user:', foundUser); // to test if we got the user data right
      console.log('Token:', result.token);
      setCurrentUser(foundUser);
      setShowSignIn(false);
      setSignInForm({ email: '', password: '' });
      setCurrentPage(foundUser.role === 'buyer' ? 'buyer' : foundUser.role === 'supplier' ? 'supplier' : 'admin');
      showToast(`Welcome back, ${foundUser.name}!`, 'success');
    } else {
      showToast('Invalid email or password', 'error');
    }

    // Local signIn without API. Dissable when APIs are ready
    // const foundUser = users.find(u => u.email.toLowerCase() === signInForm.email.toLowerCase());
    // if (foundUser) {
    //   setCurrentUser(foundUser);
    //   setShowSignIn(false);
    //   setSignInForm({ email: '', password: '' });
    //   setCurrentPage(foundUser.role === 'buyer' ? 'buyer' : foundUser.role === 'supplier' ? 'supplier' : 'admin');
    //   showToast(`Welcome back, ${foundUser.name}!`, 'success');
    // } else {
    //   // Demo fallback: allow any email as demo buyer
    //   const demoUser: User = { id: 'demo', name: 'Demo User', email: signInForm.email, phone: '0712345678', password: signInForm.password, role: 'buyer' };
    //   setCurrentUser(demoUser);
    //   setShowSignIn(false);
    //   setCurrentPage('buyer');
    //   showToast('Invalid email or password', 'error');
    //   setSignInForm({ email: '', password: '' });
    // }
  };

  const handleLogout = async () => {
    const responce = await fetch('http://188.245.80.22:8000/api/v1/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ email: currentUser?.email })
    });
    if (responce.status === 200) {
      localStorage.removeItem('token'); // Remove token on logout
      setCurrentUser(null);
      setCurrentPage('home');
      setSearchTerm('');
      showToast('Logged out successfully', 'info');
    }

  };

  const quickLogin = (role: Role) => {
    const demoUser = users.find(u => u.role === role) ||
      { id: 'quick', name: role === 'buyer' ? 'Quick Buyer' : role === 'supplier' ? 'Quick Supplier' : 'Quick Admin', email: `${role}@belt.com`, phone: '0712345678', password: 'password', role };
    setCurrentUser(demoUser);
    setCurrentPage(role === 'buyer' ? 'buyer' : role === 'supplier' ? 'supplier' : 'admin');
    showToast(`Logged in as ${demoUser.name}`, 'success');
  };

  // Optional Image Upload Handler (Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, formType: 'rfq' | 'quote') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast('Image must be under 4MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (formType === 'rfq') {
        setPostRFQForm(prev => ({ ...prev, image: base64 }));
      } else {
        setSubmitQuoteForm(prev => ({ ...prev, image: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (formType: 'rfq' | 'quote') => {
    if (formType === 'rfq') {
      setPostRFQForm(prev => ({ ...prev, image: null }));
    } else {
      setSubmitQuoteForm(prev => ({ ...prev, image: null }));
    }
  };

  // Profile Image Upload Handler
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Profile image must be under 3MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfileForm(prev => ({ ...prev, profileImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setProfileForm(prev => ({ ...prev, profileImage: null }));
  };

  // RFQ Editing (Buyers only before any quotes)
  const openEditRFQ = (rfq: RFQ) => {
    const quotes = getQuotationsForRFQ(rfq.id);
    if (quotes.length > 0) {
      showToast('Cannot edit RFQ after quotations have been submitted', 'error');
      return;
    }
    setEditingRFQId(rfq.id);
    setPostRFQForm({
      title: rfq.title,
      description: rfq.description,
      category: rfq.category,
      deadline: rfq.deadline,
      budget: rfq.budget.toString(),
      image: rfq.image || null
    });
    setShowPostRFQ(true);
  };

  // Quotation Editing (Suppliers only if pending)
  const openEditQuotation = (quote: Quotation) => {
    if (quote.status !== 'pending') {
      showToast('Cannot edit quotation after it has been selected', 'error');
      return;
    }
    setEditingQuotationId(quote.id);
    setSubmitQuoteForm({
      price: quote.price.toString(),
      deliveryTime: quote.deliveryTime,
      note: quote.note,
      image: quote.image || null
    });
    const relatedRFQ = rfqs.find(r => r.id === quote.rfqId);
    setRfqForQuote(relatedRFQ || null);
    setShowSubmitQuote(true);
  };

  // Save Profile Changes
  const saveProfile = () => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      name: profileForm.name.trim() || currentUser.name,
      email: profileForm.email.trim() || currentUser.email,
      profileImage: profileForm.profileImage || undefined
    };

    // Update current user
    setCurrentUser(updatedUser);

    // Update in users list
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    showToast('Profile updated successfully!', 'success');
  };

  // RFQ Management
  const postNewRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'buyer') return;

    setIsLoading(true);

    setTimeout(async () => {
      if (editingRFQId) {
        // Updating to API enable when APIs are ready
        const responce = await fetch(`http://188.245.80.22:8000/api/v1/rfqs/${editingRFQId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            id: editingRFQId,
            title: postRFQForm.title,
            description: postRFQForm.description,
            category: postRFQForm.category,
            deadline: postRFQForm.deadline,
            budget: parseInt(postRFQForm.budget),
            buyerId: currentUser.id,
            buyerName: currentUser.name,
            status: 'open',
            image: postRFQForm.image || undefined
          })
        });
        if (responce.status === 200 || responce.status === 201) {
          getAndUpdateData(); // Refresh data from API after update
          showToast('RFQ updated successfully!', 'success');
        }

        // Update existing RFQ in local rfqs. Disable when APIs are ready
        // setRfqs(prev => prev.map(rfq => 
        //   rfq.id === editingRFQId 
        //     ? { 
        //         ...rfq, 
        //         title: postRFQForm.title,
        //         description: postRFQForm.description,
        //         category: postRFQForm.category,
        //         deadline: postRFQForm.deadline,
        //         budget: parseInt(postRFQForm.budget),
        //         image: postRFQForm.image || undefined
        //       } 
        //     : rfq
        // ));
        showToast('RFQ updated successfully!', 'success');
      } else {
        // Create new RFQ
        const newRFQ: RFQ = {
          // id: 'r' + Date.now(), ID will be generated by backend when posted to API dissable when APIs are ready
          title: postRFQForm.title,
          description: postRFQForm.description,
          category: postRFQForm.category,
          deadline: postRFQForm.deadline,
          budget: parseInt(postRFQForm.budget),
          buyerId: currentUser.id,
          buyerName: currentUser.name,
          status: 'open',
          // createdAt: new Date().toISOString().split('T')[0],
          image: postRFQForm.image || undefined
        };

        // Posting to API enable when APIs are ready
        const responce = await fetch('http://188.245.80.22:8000/api/v1/rfqs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(newRFQ)
        });
        if (responce.status === 201 || responce.status === 200) {
          getAndUpdateData(); // Refresh data from API after creation 
          showToast('RFQ posted successfully!', 'success');
        } else {
          showToast('Failed to post RFQ', 'error');
        }

        // setRfqs(prev => [newRFQ, ...prev]);
        // showToast('RFQ posted successfully!', 'success');
      }

      setShowPostRFQ(false);
      setPostRFQForm({ title: '', description: '', category: 'Electronics', deadline: '', budget: '', image: null });
      setEditingRFQId(null);
      setIsLoading(false);
      setCurrentPage('buyer');
    }, 650);
  };

  // Quotation Submission
  const submitQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !rfqForQuote || currentUser.role !== 'supplier') return;

    setIsLoading(true);

    setTimeout(async () => {
      if (editingQuotationId) {
        // Updating to API enable when APIs are ready
        const responce = await fetch(`http://188.245.80.22:8000/api/v1/quotations/${editingQuotationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            rfqId: rfqForQuote.id,
            supplierId: currentUser.id,
            supplierName: currentUser.name,
            supplierPhone: currentUser.phone,
            price: parseInt(submitQuoteForm.price),
            deliveryTime: submitQuoteForm.deliveryTime,
            note: submitQuoteForm.note,
            status: 'pending',
            image: submitQuoteForm.image || undefined
          })
        });
        if (responce.status === 200 || responce.status === 201) {
          getAndUpdateData(); // Refresh data from API after update
          showToast('Quotation updated successfully!', 'success');
        }

        // Update existing quotation locally. Disable when APIs are ready
        // setQuotations(prev => prev.map(quote => 
        //   quote.id === editingQuotationId 
        //     ? { 
        //         ...quote, 
        //         price: parseInt(submitQuoteForm.price),
        //         deliveryTime: submitQuoteForm.deliveryTime,
        //         note: submitQuoteForm.note,
        //         image: submitQuoteForm.image || undefined
        //       } 
        //     : quote
        // ));
        showToast('Quotation updated successfully!', 'success');
      } else {
        // Create new quotation
        const newQuote: Quotation = {
          // id: 'q' + Date.now(),
          rfqId: rfqForQuote.id,
          supplierId: currentUser.id,
          supplierName: currentUser.name,
          supplierPhone: currentUser.phone,
          price: parseInt(submitQuoteForm.price),
          deliveryTime: submitQuoteForm.deliveryTime,
          note: submitQuoteForm.note,
          status: 'pending',
          // submittedAt: new Date().toISOString().split('T')[0],
          image: submitQuoteForm.image || undefined
        };
        console.log('Submitting quotation:', newQuote); // to test if we created the quotation data right

        // Posting to API enable when APIs are ready
        const responce = await fetch('http://188.245.80.22:8000/api/v1/quotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(newQuote)
        });
        if (responce.status === 201 || responce.status === 200) {
          getAndUpdateData(); // Refresh data from API after submission. Enable when APIs are ready
          showToast('Quotation submitted successfully!', 'success');
        } else {
          showToast('Failed to submit quotation', 'error');
        }

        // setQuotations(prev => [...prev, newQuote]); // Posting new quotation locally. Disable when APIs are ready
        // showToast('Quotation submitted successfully!', 'success');

      }

      setShowSubmitQuote(false);
      setSubmitQuoteForm({ price: '', deliveryTime: '', note: '', image: null });
      setRfqForQuote(null);
      setEditingQuotationId(null);
      setIsLoading(false);
    }, 620);
  };

  // Accept Quotation (Buyer Action)
  const acceptQuotation = (quote: Quotation) => {
    if (!currentUser || !selectedRFQ) return;

    // Update quotation status
    const updatedQuotations = quotations.map(q =>
      q.rfqId === quote.rfqId
        ? { ...q, status: q.id === quote.id ? 'accepted' as const : 'rejected' as const }
        : q
    );

    // Send update to API enable when APIs are ready

    // updatedQuotations.forEach(async q => {
    //   await fetch(`https://jsonplaceholder.typicode.com/posts/${q.id}`, {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(q)
    //   });
    // });

    // Alrenatively, send only the accepted quotation and handle the rest of the labling('pending'->'rejected') on server side. Saves on API calls and is more efficient :) 

    updatedQuotations.forEach(async (q) => {
      if (q.rfqId === quote.rfqId && q.id === quote.id) {
        await fetch(`http://188.245.80.22:8000/api/v1/quotations/${q.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(q)
        });
      }
    });

    setQuotations(updatedQuotations);

    // Close the RFQ. Disable when APIs are ready and handle it on server side
    // const updatedRfqs = rfqs.map(r => 
    //   r.id === selectedRFQ.id ? { ...r, status: 'closed' as const } : r
    // );
    // setRfqs(updatedRfqs);
    getAndUpdateData(); // Refresh data from API after update. Enable when APIs are ready.

    setShowComparison(false);
    setShowRFQDetails(false);
    setSelectedRFQ(null);

    showToast(`Quotation from ${quote.supplierName} accepted! RFQ is now closed.`, 'success');
  };

  // View Functions
  const openRFQDetails = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
    setShowRFQDetails(true);
  };

  const openQuoteDetails = (quote: Quotation) => {
    setSelectedQuotation(quote);
    setShowQuoteDetails(true);
  };

  const openComparison = (rfq: RFQ) => {
    setSelectedRFQ(rfq);
    setShowComparison(true);
    setShowRFQDetails(false);
  };

  const openSubmitQuoteModal = (rfq: RFQ) => {
    if (!currentUser) {
      setShowSignIn(true);
      return;
    }
    setRfqForQuote(rfq);
    setShowSubmitQuote(true);
  };

  // Filtered Data
  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || rfq.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || rfq.status === statusFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const myRFQs = rfqs.filter(r => currentUser && r.buyerId === currentUser.id);
  const openRFQs = rfqs.filter(r => r.status === 'open');
  const myQuotations = quotations.filter(q => currentUser && q.supplierId === currentUser.id);

  // Get Quotations for RFQ
  const getQuotationsForRFQ = (rfqId: string) => quotations.filter(q => q.rfqId === rfqId);

  // Get Accepted Quote for RFQ
  const getAcceptedQuote = (rfqId: string) => quotations.find(q => q.rfqId === rfqId && q.status === 'accepted');

  // Render Full RFQ Details
  const renderRFQDetails = () => {
    if (!selectedRFQ) return null;
    const rfqQuotes = getQuotationsForRFQ(selectedRFQ.id);
    const accepted = getAcceptedQuote(selectedRFQ.id);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-slate-500 mb-1">CATEGORY</div>
            <div className="font-semibold text-lg text-slate-900">{selectedRFQ.category}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">BUDGET</div>
            <div className="font-semibold text-2xl text-emerald-600">${selectedRFQ.budget.toLocaleString()}</div>
          </div>
        </div>

        {/* Optional RFQ Image */}
        {selectedRFQ.image && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <img src={selectedRFQ.image} alt="RFQ Reference" className="w-full max-h-[340px] object-cover" />
          </div>
        )}

        <div>
          <div className="text-sm text-slate-500 mb-2">DESCRIPTION</div>
          <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">{selectedRFQ.description}</p>
        </div>

        <div className="flex flex-wrap gap-8 text-sm">
          <div><span className="text-slate-500">Deadline:</span> <span className="font-medium">{selectedRFQ.deadline}</span></div>
          <div><span className="text-slate-500">Posted by:</span> <span className="font-medium">{selectedRFQ.buyerName}</span></div>
          <div><span className="text-slate-500">Status:</span> <span className={`status-badge ${selectedRFQ.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{selectedRFQ.status.toUpperCase()}</span></div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg">Submitted Quotations ({rfqQuotes.length})</div>
            {currentUser?.role === 'buyer' && selectedRFQ.status === 'open' && rfqQuotes.length === 0 && (
              <button onClick={() => { setShowRFQDetails(false); openEditRFQ(selectedRFQ); }} className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-all active:scale-[0.985]">
                <Edit size={18} /> Edit RFQ
              </button>
            )}
            {currentUser?.role === 'buyer' && selectedRFQ.status === 'open' && rfqQuotes.length > 0 && (
              <button onClick={() => openComparison(selectedRFQ)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all active:scale-[0.985]">
                <Award size={18} /> Compare &amp; Select
              </button>
            )}
          </div>

          {rfqQuotes.length > 0 ? (
            <div className="space-y-3">
              {rfqQuotes.map(quote => (
                <div key={quote.id} onClick={() => openQuoteDetails(quote)} className="flex justify-between items-center p-4 border rounded-2xl hover:bg-slate-50 cursor-pointer group">
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{quote.supplierName}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{quote.deliveryTime} • Submitted {quote.submittedAt}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-xl text-emerald-600">${quote.price.toLocaleString()}</div>
                    <div className={`status-badge inline-block mt-1 ${quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : quote.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {quote.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-2xl">No quotations submitted yet.</div>
          )}
        </div>
      </div>
    );
  };

  // Render Comparison Page/Modal
  const renderComparison = () => {
    if (!selectedRFQ) return null;
    const rfqQuotes = getQuotationsForRFQ(selectedRFQ.id).filter(q => q.status === 'pending');

    return (
      <div>
        <div className="mb-6">
          <div className="font-semibold text-xl mb-1">{selectedRFQ.title}</div>
          <div className="text-slate-500">Budget: ${selectedRFQ.budget.toLocaleString()} • Deadline: {selectedRFQ.deadline}</div>
        </div>

        <div className="comparison-table overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="font-semibold text-left text-sm text-slate-600">SUPPLIER</th>
                <th className="font-semibold text-left text-sm text-slate-600 w-20">IMAGE</th>
                <th className="font-semibold text-left text-sm text-slate-600">PRICE</th>
                <th className="font-semibold text-left text-sm text-slate-600">DELIVERY</th>
                <th className="font-semibold text-left text-sm text-slate-600">NOTES</th>
                <th className="font-semibold w-36 text-center text-sm text-slate-600">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rfqQuotes.length > 0 ? rfqQuotes.map((quote, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td><div className="font-semibold text-slate-900">{quote.supplierName}</div><div className="text-xs text-slate-500 mt-px">Submitted {quote.submittedAt}</div></td>
                  <td>
                    {quote.image ? (
                      <img src={quote.image} alt="Quote" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400"><ImageIcon size={20} /></div>
                    )}
                  </td>
                  <td><div className="font-bold text-2xl text-emerald-600">${quote.price.toLocaleString()}</div></td>
                  <td><div className="font-medium text-slate-700">{quote.deliveryTime}</div></td>
                  <td><div className="text-sm text-slate-600 pr-4 line-clamp-3">{quote.note}</div></td>
                  <td className="text-center">
                    {/* <a href={`https://wa.me/${quote.supplierPhone}`}> */}
                    <button
                      onClick={() => acceptQuotation(quote)}
                      className="inline-flex items-center gap-2 px-7 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl transition-all"
                    >
                      <CheckCircle size={16} /> ACCEPT
                    </button>
                    {/* </a> */}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-14 text-slate-500">No pending quotations available to compare.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-7 flex justify-end text-sm text-slate-500">Selecting one quotation will automatically reject the others and close this RFQ.</div>
      </div>
    );
  };

  // Render Quotation Details
  const renderQuoteDetails = () => {
    if (!selectedQuotation) return null;
    const relatedRFQ = rfqs.find(r => r.id === selectedQuotation.rfqId);

    return (
      <div className="space-y-7">
        {relatedRFQ && <div className="px-5 py-3 bg-blue-50 text-blue-700 rounded-2xl text-sm font-medium">For RFQ: {relatedRFQ.title}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-50 rounded-2xl p-5">
            <div className="uppercase tracking-[1px] text-xs text-slate-500 mb-1">PRICE</div>
            <div className="font-bold text-4xl text-emerald-600">${selectedQuotation.price.toLocaleString()}</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-5">
            <div className="uppercase tracking-[1px] text-xs text-slate-500 mb-1">DELIVERY TIME</div>
            <div className="font-bold text-3xl text-slate-900 mt-1">{selectedQuotation.deliveryTime}</div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-5">
            <div className="uppercase tracking-[1px] text-xs text-slate-500 mb-1">STATUS</div>
            <div className={`inline-block mt-1 status-badge text-base ${selectedQuotation.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : selectedQuotation.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {selectedQuotation.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Optional Quotation Image */}
        {selectedQuotation.image && (
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <img src={selectedQuotation.image} alt="Quotation Reference" className="w-full max-h-80 object-cover" />
          </div>
        )}

        <div>
          <div className="text-sm font-semibold text-slate-600 mb-2">SUPPLIER NOTES</div>
          <div className="bg-white border p-5 rounded-2xl text-slate-700 leading-relaxed">{selectedQuotation.note}</div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-500">Submitted on {selectedQuotation.submittedAt} by {selectedQuotation.supplierName}</div>
          {currentUser?.role === 'supplier' && selectedQuotation.status === 'pending' && (
            <button onClick={() => { setShowQuoteDetails(false); openEditQuotation(selectedQuotation); }} className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 transition">
              <Edit size={16} /> Edit Quotation
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-3xl font-black tracking-[-2.5px] text-white">
              <img src="/images/Belt_Logo_Fn-02.png" alt="Logo" className="w-20 h-20" />
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold tracking-tight text-lg">RFQ PLATFORM</div>
              <div className="text-[10px] text-blue-500 -mt-1">DIGITIZE YOUR OPERATIONS</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 text-sm font-medium">
            <button onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} className={`px-5 py-2 rounded-xl transition-all ${currentPage === 'home' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Home</button>

            {currentUser && (
              <>
                {currentUser.role === 'buyer' && (
                  <button onClick={() => { setCurrentPage('buyer'); setMobileMenuOpen(false); }} className={`px-5 py-2 rounded-xl transition-all ${currentPage === 'buyer' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Dashboard</button> // Buyers
                )}
                {currentUser.role === 'supplier' && (
                  <button onClick={() => { setCurrentPage('supplier'); setMobileMenuOpen(false); }} className={`px-5 py-2 rounded-xl transition-all ${currentPage === 'supplier' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Dashboard</button> // Suppliers 
                )}
                {/* {currentUser.role !== 'admin' && (
                  <button onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }} className={`px-5 py-2 rounded-xl transition-all ${currentPage === 'profile' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Profile</button>
                )} */}
                {currentUser.role === 'admin' && (
                  <button onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }} className={`px-5 py-2 rounded-xl transition-all ${currentPage === 'admin' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Dashboard</button> // Admin 
                )}

              </>
            )}

            {!currentUser ? (
              <div className="flex gap-2 ml-3 pl-4 border-l border-slate-800">
                <button onClick={() => setShowSignIn(true)} className="px-6 py-2.5 bg-white text-slate-950 rounded-2xl font-semibold hover:bg-slate-100 transition">Sign In</button>
                <button onClick={() => setShowSignUp(true)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-semibold transition">Sign Up</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4 pl-5 border-l border-slate-800">
                <div className="flex items-center gap-3 pr-1" onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }}>
                  {currentUser.profileImage ? (
                    <img src={currentUser.profileImage} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">{currentUser.name[0]}</div>
                  )}
                  <div className="text-right text-sm">
                    <div className="font-medium">{currentUser.name}</div>
                    <div className="text-blue-400 text-xs capitalize">{currentUser.role}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition"><LogOut size={15} /> Logout</button>
              </div>
            )}
            <GoogleTranslate />
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <div className="space-y-1.5"><span className="block w-6 h-0.5 bg-white"></span><span className="block w-6 h-0.5 bg-white"></span><span className="block w-6 h-0.5 bg-white"></span></div>}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-6 text-sm font-medium">
            <div className="flex flex-col gap-1">
              <button onClick={() => { setCurrentPage('home'); setMobileMenuOpen(false); }} className={`px-4 py-3 text-left rounded-xl ${currentPage === 'home' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Home</button>

              {currentUser && (
                <>

                  {currentUser.role === 'buyer' && (
                    <button onClick={() => { setCurrentPage('buyer'); setMobileMenuOpen(false); }} className={`px-4 py-3 text-left rounded-xl ${currentPage === 'buyer' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Dashboard</button>
                  )}
                  {currentUser.role === 'supplier' && (
                    <button onClick={() => { setCurrentPage('supplier'); setMobileMenuOpen(false); }} className={`px-4 py-3 text-left rounded-xl ${currentPage === 'supplier' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Dashboard</button>
                  )}
                  {/* {currentUser.role !== 'admin' && (
                    <button onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }} className={`px-4 py-3 text-left rounded-xl ${currentPage === 'profile' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Profile</button>
                  )} */}
                  {currentUser.role === 'admin' && (
                    <button onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }} className={`px-4 py-3 text-left rounded-xl ${currentPage === 'admin' ? 'bg-white text-slate-950' : 'hover:bg-slate-900'}`}>Admin</button>
                  )}

                </>
              )}

              {!currentUser ? (
                <div className="pt-3 mt-2 border-t border-slate-800 flex flex-col gap-2">
                  <button onClick={() => { setShowSignIn(true); setMobileMenuOpen(false); }} className="px-4 py-3 bg-white text-slate-950 rounded-2xl font-semibold">Sign In</button>
                  <button onClick={() => { setShowSignUp(true); setMobileMenuOpen(false); }} className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-semibold">Sign Up</button>
                </div>
              ) : (
                <div className="pt-3 mt-2 border-t border-slate-800">
                  <div className="px-4 py-3 flex items-center gap-3" onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }}>
                    {currentUser.profileImage ? (
                      <img src={currentUser.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">{currentUser.name[0]}</div>
                    )}
                    <div>
                      <div className="font-medium">{currentUser.name}</div>
                      <div className="text-blue-400 text-xs capitalize">{currentUser.role}</div>
                    </div>
                  </div>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-900 rounded-xl">Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* HOME PAGE */}
      {currentPage === 'home' && (
        <div>
          {/* Hero Section */}
          <div className="relative h-[94vh] flex items-center justify-center bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_0.8px,transparent_1px)] bg-[length:4px_4px]" />
            {/* <img src="/images/AfricanBoardroom.png" alt="Business Professionals" className="absolute inset-0 w-full h-full object-cover opacity-35" /> */}
            <video
              src="/images/Lagos_Day.mp4"
              loop
              muted
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />

            <div className="relative z-10 max-w-4xl px-6 text-center">
              <div className="inline-block px-4 py-1 rounded-full bg-blue-600/10 text-blue-400 text-xs font-semibold tracking-[3px] mb-4">PROFESSIONAL PROCUREMENT PLATFORM</div>
              <h1 className="text-white text-5xl sm:text-6xl md:text-7xl font-black tracking-[-3.5px] md:tracking-[-4.2px] leading-none mb-4">Request.<br />Quote.<br />Connect.</h1>
              <p className="max-w-md mx-auto text-lg sm:text-xl text-slate-300 mb-10">The seamless platform for Buyers, &amp; Suppliers to manage RFQs and quotations efficiently.<br /><br /> <strong>Africa Roles on BELT!</strong> </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                {!currentUser ? (
                  <>
                    <button onClick={() => setShowSignUp(true)} className="w-full sm:w-auto group px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-lg sm:text-xl font-semibold text-slate-950 rounded-3xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-[0.985]">Get Started <ArrowRight className="group-hover:translate-x-0.5 transition" /></button>
                    <button onClick={() => setShowSignIn(true)} className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 border border-white/40 hover:bg-white/5 text-white text-lg sm:text-xl font-medium rounded-3xl transition-all">Sign In</button>
                  </>
                ) : (
                  <button onClick={() => setCurrentPage(currentUser.role === 'buyer' ? 'buyer' : currentUser.role === 'supplier' ? 'supplier' : 'admin')} className="w-full sm:w-auto group px-8 sm:px-10 py-3.5 sm:py-4 bg-blue-600 text-lg sm:text-xl font-semibold text-white rounded-3xl flex items-center justify-center gap-3 hover:bg-blue-500">Go to Dashboard <ArrowRight /></button>
                )}
              </div>

              <div className="mt-16 flex justify-center gap-12 text-sm text-slate-400">
                <div className="flex items-center gap-2"><Users size={17} /> 2,840+ Users</div>
                <div className="flex items-center gap-2"><FileText size={17} /> 19k RFQs Posted</div>
                <div className="flex items-center gap-2"><Award size={17} /> $184M in Quotes Won</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-7xl mx-auto px-8 py-20">
            <div className="text-center mb-12">
              <div className="font-semibold tracking-[2px] text-xs text-blue-500 mb-3">POWERFUL FEATURES</div>
              <div className="text-5xl font-bold tracking-tight">Built for seamless RFQ workflows</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <FileText />, title: "Post & Manage RFQs", desc: "Buyers can easily create detailed RFQs with deadlines, budgets and specifications." },
                { icon: <Award />, title: "Competitive Quotations", desc: "Suppliers submit detailed quotes. Buyers compare side-by-side and accept the best." },
                { icon: <TrendingUp />, title: "Admin Oversight", desc: "Full visibility for administrators with analytics, user management & platform insights." }
              ].map((feat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                  <div className="inline-block p-3 bg-blue-950 text-blue-400 rounded-2xl mb-6">{feat.icon}</div>
                  <div className="font-semibold text-2xl mb-3 tracking-tight">{feat.title}</div>
                  <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Demo Access */}
          <div className="bg-slate-900 py-14 border-y border-slate-800">
            {/* <div className="max-w-4xl mx-auto px-6 text-center">
              <div className="text-blue-400 text-sm font-semibold mb-3">TRY INSTANTLY</div>
              <div className="text-3xl font-bold tracking-tight mb-6">Login instantly as a demo user</div>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                <button onClick={() => quickLogin('buyer')} className="px-8 py-3 bg-white text-slate-950 rounded-2xl font-semibold">Login as Buyer</button>
                <button onClick={() => quickLogin('supplier')} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold">Login as Supplier</button>
                <button onClick={() => quickLogin('admin')} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold">Login as Admin</button>
              </div>
            </div> */}
          </div>
        </div>
      )}

      {/* BUYER PAGE */}
      {currentPage === 'buyer' && currentUser && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-9 gap-4">
            <div>
              <div className="uppercase tracking-[3px] text-blue-400 text-xs">FOR BUYERS</div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-2px] md:tracking-[-2.4px]">Your RFQs &amp; Quotes</div>
            </div>
            <button onClick={() => setShowPostRFQ(true)} className="flex items-center justify-center gap-3 px-7 py-3.5 md:px-8 md:py-4 bg-white text-slate-950 font-semibold rounded-2xl active:scale-[0.985] transition w-full md:w-auto">
              <Plus size={19} /> POST NEW RFQ
            </button>
          </div>

          {/* My RFQs */}
          <div className="mb-9">
            <div className="flex justify-between mb-4 px-1">
              <div className="font-semibold text-2xl">My Posted RFQs <span className="text-slate-500 font-normal">({myRFQs.length})</span></div>
            </div>

            {myRFQs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myRFQs.map(rfq => {
                  const quotes = getQuotationsForRFQ(rfq.id);
                  const accepted = getAcceptedQuote(rfq.id);
                  return (
                    <div key={rfq.id} className="rfq-card bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col">
                      <div className="flex justify-between mb-4">
                        <span className={`status-badge ${rfq.status === 'open' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'}`}>{rfq.status}</span>
                        <span className="text-xs text-slate-400">{rfq.createdAt}</span>
                      </div>
                      {rfq.image && <img src={rfq.image} alt="RFQ" className="w-full h-36 object-cover rounded-2xl mb-4 border border-slate-800" />}
                      <h3 className="font-semibold text-xl tracking-tight mb-2 line-clamp-2">{rfq.title}</h3>
                      <div className="text-emerald-400 font-medium mb-3">${rfq.budget.toLocaleString()}</div>
                      <div className="text-sm text-slate-400 line-clamp-3 mb-auto flex-1">{rfq.description}</div>

                      <div className="flex items-center justify-between pt-5 mt-auto border-t border-slate-800">
                        <div>
                          <div className="text-xs text-slate-500">QUOTES RECEIVED</div>
                          <div className="font-semibold text-xl">{quotes.length}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openRFQDetails(rfq)} className="px-4 py-2 text-sm flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition"><Eye size={16} /> Details</button>
                          {quotes.length === 0 && rfq.status === 'open' && (
                            <button onClick={() => openEditRFQ(rfq)} className="px-4 py-2 text-sm flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 rounded-xl transition"><Edit size={16} /> Edit</button>
                          )}
                          {quotes.length > 0 && rfq.status === 'open' && (
                            <button onClick={() => openComparison(rfq)} className="px-4 py-2 text-sm flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition"><Award size={16} /> Compare</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900 py-16 text-center rounded-3xl border border-slate-800">No RFQs posted yet. Start by posting your first request.</div>
            )}
          </div>
        </div>
      )}

      {/* SUPPLIER PAGE */}
      {currentPage === 'supplier' && currentUser && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-20">
          <div className="mb-10">
            <div className="uppercase tracking-[3px] text-blue-400 text-xs">FOR SUPPLIERS</div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-2px] md:tracking-[-2.4px]">Browse RFQs &amp; Submit Quotes</div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-4 text-slate-400" size={19} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search RFQs by title or keyword..." className="input-field w-full pl-12 py-3.5 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-2xl placeholder:text-slate-500" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field bg-slate-900 border border-slate-700 px-6 py-3.5 rounded-2xl">
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field bg-slate-900 border border-slate-700 px-6 py-3.5 rounded-2xl">
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Available RFQs */}
          <div className="mb-12">
            <div className="font-semibold text-2xl mb-5 px-1">Available RFQs ({openRFQs.length})</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRFQs.filter(r => r.status === 'open').map(rfq => (
                <div key={rfq.id} className="rfq-card bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="status-badge bg-emerald-600 text-white">OPEN</span>
                    <div className="font-medium text-emerald-400">${rfq.budget.toLocaleString()}</div>
                  </div>
                  {rfq.image && <img src={rfq.image} alt="RFQ" className="w-full h-32 object-cover rounded-2xl mb-4 border border-slate-800" />}
                  <div className="font-semibold text-[21px] tracking-tight mb-2 pr-4">{rfq.title}</div>
                  <div className="text-sm text-slate-400 mb-4 line-clamp-3 flex-1">{rfq.description}</div>

                  <div className="text-xs text-slate-500 mb-5">Deadline: {rfq.deadline} • {rfq.category}</div>

                  <div className="flex gap-2.5">
                    <button onClick={() => openRFQDetails(rfq)} className="flex-1 py-[13px] border border-slate-700 rounded-2xl hover:bg-slate-800 font-medium transition">View Details</button>
                    <button onClick={() => openSubmitQuoteModal(rfq)} className="flex-1 py-[13px] bg-blue-600 rounded-2xl font-semibold active:bg-blue-700 transition">Submit Quote</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Quotations */}
          <div>
            <div className="font-semibold text-2xl mb-5 px-1">My Submitted Quotations ({myQuotations.length})</div>
            {myQuotations.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                {myQuotations.map(quote => {
                  const rfq = rfqs.find(r => r.id === quote.rfqId);
                  return (
                    <div key={quote.id} onClick={() => openQuoteDetails(quote)} className="flex items-center justify-between px-8 py-6 border-b border-slate-800 hover:bg-slate-800/60 cursor-pointer last:border-none group">
                      <div className="flex items-center gap-4">
                        {quote.image && <img src={quote.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-700" />}
                        <div>
                          <div className="font-semibold text-lg group-hover:text-blue-400 transition">{rfq?.title}</div>
                          <div className="text-sm text-slate-400 mt-px">Submitted {quote.submittedAt}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-2xl text-emerald-400">${quote.price.toLocaleString()}</div>
                        <div className="text-xs uppercase tracking-widest text-slate-400">{quote.deliveryTime}</div>
                      </div>
                      <div><span className={`status-badge ${quote.status === 'accepted' ? 'bg-emerald-500 text-white' : quote.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}>{quote.status}</span></div>
                      {quote.status === 'pending' ? (
                        <button onClick={(e) => { e.stopPropagation(); openEditQuotation(quote); }} className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center gap-1 transition ml-3"><Edit size={13} /> Edit</button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); openQuoteDetails(quote); }} className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-xl flex items-center gap-1 transition ml-3"><View size={13} /> View </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">You have not submitted any quotations yet.</div>}
          </div>
        </div>
      )}

      {/* ADMIN PAGE */}
      {currentPage === 'admin' && currentUser && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-20">
          <div className="mb-10">
            <div className="uppercase text-xs tracking-[3px] text-blue-400">SYSTEM ADMINISTRATION</div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-2px] md:tracking-[-2.4px]">Platform Overview</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-12">
            {[
              { label: "Total RFQs", value: rfqs.length, icon: <FileText /> },
              { label: "Open RFQs", value: rfqs.filter(r => r.status === 'open').length, icon: <Clock /> },
              { label: "Total Quotations", value: quotations.length, icon: <Award /> },
              { label: "Registered Users", value: users.length, icon: <Users /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div><div className="text-sm text-slate-400 mb-px">{stat.label}</div><div className="text-5xl font-semibold tracking-tighter">{stat.value}</div></div>
                  <div className="text-blue-500/60">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* All RFQs Table */}
          <div className="mb-10">
            <div className="font-semibold text-2xl mb-5 px-1">All RFQs</div>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-700"><tr className="text-left text-xs uppercase tracking-wider text-slate-400"><th className="pl-8 py-4">RFQ</th><th>BUYER</th><th>CATEGORY</th><th>BUDGET</th><th>QUOTES</th><th>STATUS</th><th></th></tr></thead>
                <tbody>
                  {rfqs.map(rfq => (
                    <tr key={rfq.id} className="border-b border-slate-800 hover:bg-slate-950/70 last:border-none">
                      <td className="pl-8 py-5 pr-2 font-semibold text-base">{rfq.title}</td>
                      <td>{rfq.buyerName}</td>
                      <td><span className="text-xs px-3 py-px bg-slate-800 rounded-full">{rfq.category}</span></td>
                      <td className="font-semibold">${rfq.budget.toLocaleString()}</td>
                      <td>{getQuotationsForRFQ(rfq.id).length}</td>
                      <td><span className={`status-badge ${rfq.status === 'open' ? 'bg-emerald-500 text-white' : 'bg-slate-600'}`}>{rfq.status}</span></td>
                      <td className="pr-6"><button onClick={() => openRFQDetails(rfq)} className="text-blue-400 hover:underline">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Quotations */}
          <div>
            <div className="font-semibold text-2xl mb-5 px-1">Recent Quotations</div>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-700"><tr className="text-left text-xs uppercase tracking-wider text-slate-400"><th className="pl-8 py-4">SUPPLIER</th><th>RFQ</th><th>PRICE</th><th>DELIVERY</th><th>STATUS</th><th></th></tr></thead>
                <tbody>
                  {quotations.slice(0, 8).map(q => {
                    const r = rfqs.find(rf => rf.id === q.rfqId);
                    return (
                      <tr key={q.id} className="border-b border-slate-800 hover:bg-slate-950/70 last:border-none">
                        <td className="pl-8 py-5 font-medium">{q.supplierName}</td>
                        <td className="text-xs pr-4 text-slate-400">{r?.title.substring(0, 42)}...</td>
                        <td className="font-semibold text-emerald-400">${q.price.toLocaleString()}</td>
                        <td>{q.deliveryTime}</td>
                        <td><span className={`status-badge ${q.status === 'accepted' ? 'bg-emerald-500' : q.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400 text-black'}`}>{q.status}</span></td>
                        <td><button onClick={() => openQuoteDetails(q)} className="text-blue-400 hover:underline">View</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE PAGE - For Buyers & Suppliers */}
      {currentPage === 'profile' && currentUser && currentUser.role !== 'admin' && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-10 pb-20">
          <div className="mb-9">
            <div className="uppercase tracking-[3px] text-blue-400 text-xs mb-1">ACCOUNT SETTINGS</div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-2px] md:tracking-[-2.4px]">My Profile</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
            {/* Profile Card */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 h-fit">
              <div className="flex flex-col items-center text-center">
                {profileForm.profileImage ? (
                  <img src={profileForm.profileImage} alt="Avatar" className="w-28 h-28 rounded-full object-cover border-4 border-blue-600 mb-5" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-6xl font-black mb-5">{currentUser.name[0]}</div>
                )}

                <div className="font-bold text-3xl tracking-tight">{profileForm.name}</div>
                <div className="text-blue-400 mt-0.5 capitalize">{currentUser.role} Account</div>

                {/* Profile Picture Upload */}
                <div className="mt-6 w-full">
                  <label className="text-xs font-medium tracking-widest text-slate-400 mb-2 block">PROFILE PHOTO</label>
                  {profileForm.profileImage ? (
                    <button onClick={removeProfileImage} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5 mx-auto transition">Remove Photo <X size={15} /></button>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-6 py-2.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-2xl cursor-pointer transition">
                      <ImageIcon size={16} /> Upload Photo
                      <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Form + Stats */}
            <div className="md:col-span-3 space-y-8">
              {/* Editable Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="font-semibold text-xl tracking-tight mb-6">Personal Information</div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
                    <input
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="input-field w-full bg-slate-950 border border-slate-700 px-5 py-3.5 rounded-2xl text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="input-field w-full bg-slate-950 border border-slate-700 px-5 py-3.5 rounded-2xl text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Account Type</label>
                    <div className="px-5 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-lg capitalize text-blue-400 font-medium">{currentUser.role}</div>
                  </div>
                </div>

                <button onClick={saveProfile} className="mt-8 w-full py-4 bg-white text-slate-950 font-semibold rounded-2xl active:bg-slate-200 transition flex justify-center items-center gap-2">
                  SAVE PROFILE CHANGES
                </button>
              </div>

              {/* Role-Specific Stats */}
              <div>
                <div className="font-semibold text-xl tracking-tight mb-4 px-1">Activity Summary</div>
                {currentUser.role === 'buyer' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'RFQs Posted', value: myRFQs.length },
                      { label: 'Open RFQs', value: myRFQs.filter(r => r.status === 'open').length },
                      { label: 'Quotations Received', value: myRFQs.reduce((sum, r) => sum + getQuotationsForRFQ(r.id).length, 0) },
                      { label: 'RFQs Closed', value: myRFQs.filter(r => r.status === 'closed').length },
                    ].map((stat, index) => (
                      <div key={index} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                        <div className="text-4xl font-bold tracking-tighter">{stat.value}</div>
                        <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Quotes Submitted', value: myQuotations.length },
                      { label: 'Accepted Quotes', value: myQuotations.filter(q => q.status === 'accepted').length },
                      { label: 'Total Quote Value', value: '$' + myQuotations.reduce((sum, q) => sum + q.price, 0).toLocaleString() },
                      { label: 'Win Rate', value: myQuotations.length > 0 ? Math.round((myQuotations.filter(q => q.status === 'accepted').length / myQuotations.length) * 100) + '%' : '0%' },
                    ].map((stat, index) => (
                      <div key={index} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                        <div className="text-4xl font-bold tracking-tighter">{stat.value}</div>
                        <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="font-semibold text-xl tracking-tight mb-5">Recent Activity</div>
                {currentUser.role === 'buyer' ? (
                  myRFQs.length > 0 ? (
                    <div className="space-y-3">
                      {myRFQs.slice(0, 4).map(rfq => (
                        <div key={rfq.id} onClick={() => { openRFQDetails(rfq); setCurrentPage('buyer'); }} className="flex justify-between items-center p-4 bg-slate-950 hover:bg-slate-800 cursor-pointer rounded-2xl transition">
                          <div>
                            <div className="font-medium">{rfq.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{rfq.createdAt} • {rfq.category}</div>
                          </div>
                          <div className={`status-badge ${rfq.status === 'open' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'}`}>{rfq.status}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-sm text-slate-400 py-6">You haven’t posted any RFQs yet.</div>
                ) : (
                  myQuotations.length > 0 ? (
                    <div className="space-y-3">
                      {myQuotations.slice(0, 4).map(quote => {
                        const rfq = rfqs.find(r => r.id === quote.rfqId);
                        return (
                          <div key={quote.id} onClick={() => { openQuoteDetails(quote); setCurrentPage('supplier'); }} className="flex justify-between items-center p-4 bg-slate-950 hover:bg-slate-800 cursor-pointer rounded-2xl transition">
                            <div>
                              <div className="font-medium line-clamp-1">{rfq?.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5">Submitted {quote.submittedAt}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-emerald-400">${quote.price.toLocaleString()}</div>
                              <div className={`status-badge text-xs mt-1 ${quote.status === 'accepted' ? 'bg-emerald-500' : quote.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 text-black'}`}>{quote.status}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <div className="text-sm text-slate-400 py-6">No quotations submitted yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-9 text-sm text-center text-slate-500">© 2026 <strong>belt</strong> RFQ Platform. All Rights Reserved. Built for seamless procurement.</footer>

      {/* SIGN UP MODAL */}
      <Modal isOpen={showSignUp} onClose={() => setShowSignUp(false)} title="Create Your Account" size="md">
        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">User Name</label>
            <input type="text" value={signUpForm.name} onChange={e => setSignUpForm({ ...signUpForm, name: e.target.value })} className="input-field w-full bg-slate-900 border border-slate-700 px-5 py-3.5 rounded-2xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">Email Address</label>
            <input type="email" value={signUpForm.email} onChange={e => setSignUpForm({ ...signUpForm, email: e.target.value })} className="input-field w-full bg-slate-900 border border-slate-700 px-5 py-3.5 rounded-2xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">Phone Number</label>
            <input type="tel" value={signUpForm.phone} onChange={e => setSignUpForm({ ...signUpForm, phone: e.target.value })} className="input-field w-full bg-slate-900 border border-slate-700 px-5 py-3.5 rounded-2xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">Password</label>
            <input type="password" value={signUpForm.password} onChange={e => setSignUpForm({ ...signUpForm, password: e.target.value })} className="input-field w-full bg-slate-900 border border-slate-700 px-5 py-3.5 rounded-2xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">Select Your Role</label>
            <div className="flex gap-2">
              {/* , 'admin' */}
              {(['buyer', 'supplier'] as Role[]).map(r => (
                <button type="button" key={r} onClick={() => setSignUpForm({ ...signUpForm, role: r })} className={`flex-1 py-3 rounded-2xl capitalize text-sm font-semibold border ${signUpForm.role === r ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 hover:bg-slate-900'}`}>{r}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full mt-3 py-4 bg-blue-600 font-semibold rounded-2xl active:bg-blue-700 transition">Create Account &amp; Continue</button>
        </form>
      </Modal>

      {/* SIGN IN MODAL */}
      <Modal isOpen={showSignIn} onClose={() => setShowSignIn(false)} title="Sign In to belt RFQ" size="md">
        <form onSubmit={handleSignIn} className="space-y-5 pt-1">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">Email Address</label>
            <input type="email" value={signInForm.email} onChange={e => setSignInForm({ ...signInForm, email: e.target.value })} className="input-field w-full bg-slate-900 border border-slate-700 px-5 py-3.5 rounded-2xl" placeholder="demo@buyer.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300">Password</label>
            <input type="password" value={signInForm.password} onChange={e => setSignInForm({ ...signInForm, password: e.target.value })} className="input-field w-full bg-slate-900 border border-slate-700 px-5 py-3.5 rounded-2xl" placeholder="Any password works in demo" />
          </div>
          <button type="submit" className="mt-4 w-full py-4 bg-white text-slate-950 font-semibold rounded-2xl hover:bg-slate-100 transition">Sign In</button>
          <div className="text-center text-xs text-slate-500 pt-2">Demo accounts available: Try any email or use Quick Login on homepage.</div>
        </form>
      </Modal>

      {/* POST RFQ MODAL */}
      <Modal isOpen={showPostRFQ} onClose={() => { setShowPostRFQ(false); setEditingRFQId(null); setPostRFQForm({ title: '', description: '', category: 'Electronics', deadline: '', budget: '', image: null }); }} title={editingRFQId ? "Edit Request for Quote" : "Post New Request for Quote"} size="lg">
        <form onSubmit={postNewRFQ} className="space-y-6">

          <div>
            <label className="text-sm font-medium text-slate-400">RFQ Title</label>
            <input value={postRFQForm.title} onChange={e => setPostRFQForm({ ...postRFQForm, title: e.target.value })} required className="input-field mt-1.5 w-full bg-slate-900 px-5 py-3 rounded-2xl border border-slate-700" placeholder="e.g. High-Precision Laser Cutters" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-400">Detailed Description</label>
            <textarea value={postRFQForm.description} onChange={e => setPostRFQForm({ ...postRFQForm, description: e.target.value })} required rows={4} className="input-field mt-1.5 w-full bg-slate-900 px-5 py-3 rounded-2xl border border-slate-700 resize-y" placeholder="Describe the product or service in detail..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-sm font-medium text-slate-400">Category</label>
              <select value={postRFQForm.category} onChange={e => setPostRFQForm({ ...postRFQForm, category: e.target.value })} className="input-field mt-1.5 w-full bg-slate-900 px-5 py-3 rounded-2xl border border-slate-700">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400">Deadline</label>
              <input type="date" value={postRFQForm.deadline} onChange={e => setPostRFQForm({ ...postRFQForm, deadline: e.target.value })} required className="input-field mt-1.5 w-full bg-slate-900 px-5 py-3 rounded-2xl border border-slate-700" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400">Budget (USD)</label>
              <input type="number" value={postRFQForm.budget} onChange={e => setPostRFQForm({ ...postRFQForm, budget: e.target.value })} required className="input-field mt-1.5 w-full bg-slate-900 px-5 py-3 rounded-2xl border border-slate-700" placeholder="185000" />
            </div>
          </div>

          {/* Optional Image Upload for RFQ */}
          <div>
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-1.5">
              <ImageIcon size={15} /> Reference Image <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            {postRFQForm.image ? (
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-700">
                <img src={postRFQForm.image} alt="RFQ reference" className="w-full h-auto max-h-48 object-cover" />
                <button type="button" onClick={() => removeImage('rfq')} className="absolute top-3 right-3 bg-black/70 p-1.5 rounded-full text-white hover:bg-red-600 transition">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl py-9 cursor-pointer bg-slate-900/60 transition">
                <ImageIcon size={28} className="mb-3 text-slate-400" />
                <span className="text-sm text-slate-400">Click to upload product / spec image</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'rfq')} className="hidden" />
              </label>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="mt-4 w-full py-[17px] font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-2xl flex items-center justify-center gap-3 transition disabled:opacity-60">
            {isLoading ? <JFKLLoader size="sm" /> : <>POST RFQ TO PLATFORM</>}
          </button>
        </form>
      </Modal>

      {/* SUBMIT QUOTATION MODAL */}
      <Modal isOpen={showSubmitQuote} onClose={() => { setShowSubmitQuote(false); setRfqForQuote(null); setEditingQuotationId(null); setSubmitQuoteForm({ price: '', deliveryTime: '', note: '', image: null }); }} title={editingQuotationId ? `Edit Quotation for: ${rfqForQuote?.title}` : rfqForQuote ? `Submit Quotation for: ${rfqForQuote.title}` : ''} size="lg">
        {rfqForQuote && (
          <form onSubmit={submitQuotation} className="space-y-6">
            <div className="text-sm bg-blue-950 text-blue-300 px-5 py-3.5 rounded-2xl">Budget: ${rfqForQuote.budget.toLocaleString()} • Deadline: {rfqForQuote.deadline}</div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="font-medium text-sm text-slate-400">Your Quote Price (USD)</label>
                <input type="number" value={submitQuoteForm.price} onChange={e => setSubmitQuoteForm({ ...submitQuoteForm, price: e.target.value })} required className="input-field mt-2 w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-3xl font-semibold" placeholder="175000" />
              </div>
              <div>
                <label className="font-medium text-sm text-slate-400">Delivery Time</label>
                <input value={submitQuoteForm.deliveryTime} onChange={e => setSubmitQuoteForm({ ...submitQuoteForm, deliveryTime: e.target.value })} required placeholder="e.g. 6 weeks" className="input-field mt-2 w-full px-5 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl" />
              </div>
            </div>

            <div>
              <label className="font-medium text-sm text-slate-400">Additional Notes &amp; Terms</label>
              <textarea value={submitQuoteForm.note} onChange={e => setSubmitQuoteForm({ ...submitQuoteForm, note: e.target.value })} rows={4} required className="input-field mt-2 w-full px-5 py-4 bg-slate-900 border border-slate-700 rounded-2xl" placeholder="Include warranty information, payment terms, and any value-added services..." />
            </div>

            {/* Optional Image Upload for Quotation */}
            <div>
              <label className="font-medium text-sm text-slate-400 flex items-center gap-2 mb-1.5">
                <ImageIcon size={15} /> Supporting Image / Catalog Photo <span className="text-xs text-slate-500">(Optional)</span>
              </label>
              {submitQuoteForm.image ? (
                <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-700">
                  <img src={submitQuoteForm.image} alt="Quotation reference" className="w-full h-auto max-h-48 object-cover" />
                  <button type="button" onClick={() => removeImage('quote')} className="absolute top-3 right-3 bg-black/70 p-1.5 rounded-full text-white hover:bg-red-600 transition">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl py-8 cursor-pointer bg-slate-900/60 transition">
                  <ImageIcon size={26} className="mb-2 text-slate-400" />
                  <span className="text-sm text-slate-400">Upload product sample / spec sheet image</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'quote')} className="hidden" />
                </label>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="mt-2 w-full py-4 font-semibold bg-blue-600 hover:bg-blue-700 rounded-2xl flex justify-center items-center transition">
              {isLoading ? <JFKLLoader size="sm" /> : 'SUBMIT QUOTATION'}
            </button>
          </form>
        )}
      </Modal>

      {/* RFQ DETAILS MODAL */}
      <Modal isOpen={showRFQDetails} onClose={() => { setShowRFQDetails(false); setSelectedRFQ(null); }} title="RFQ Full Details" size="xl">
        {renderRFQDetails()}
      </Modal>

      {/* QUOTATION DETAILS MODAL */}
      <Modal isOpen={showQuoteDetails} onClose={() => { setShowQuoteDetails(false); setSelectedQuotation(null); }} title="Quotation Details" size="lg">
        {renderQuoteDetails()}
      </Modal>

      {/* COMPARISON MODAL - The Key Buyer Comparison Page */}
      <Modal isOpen={showComparison} onClose={() => { setShowComparison(false); setSelectedRFQ(null); }} title="Compare Quotations" size="xl">
        {renderComparison()}
      </Modal>

      {/* Global Loader Overlay */}
      <AnimatePresence>
        {isLoading && (
          <div className="fixed inset-0 z-[70] bg-slate-950/90 flex items-center justify-center">
            <div className="text-center">
              <JFKLLoader size="lg" />
              <div className="mt-8 text-blue-400 tracking-[4px] text-sm font-medium">PROCESSING YOUR REQUEST</div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// Root App with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<RFQPlatform />} />
      </Routes>
    </Router>
  );
}

export default App;
