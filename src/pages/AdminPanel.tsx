import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, CheckCircle, XCircle, Trash2, Clock, BookOpen, User, 
  BarChart3, Users, MessageSquare, Heart, Eye, Download, AlertTriangle, 
  Ban, CheckSquare, ChevronRight, Settings, Sparkles
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { sendNotification } from '../lib/notificationService';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import storyPlaceholder from '../assets/images/story_cover_placeholder_1790797553347.jpg';

type AdminTab = 'dashboard' | 'stories' | 'users' | 'reports' | 'settings';

export default function AdminPanel() {
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    pendingStories: 0,
    publishedStories: 0,
    totalComments: 0,
    totalLikes: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalReports: 0,
  });
  const [stories, setStories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  // Filters
  const [storyFilter, setStoryFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!isAdmin) return;
    
    async function fetchAdminData() {
      setLoading(true);
      try {
        const storiesRef = collection(db, 'stories');
        const usersRef = collection(db, 'users');
        const reportsRef = collection(db, 'reports');

        // Fetch All Stories
        const storiesSnap = await getDocs(storiesRef);
        const storiesList = storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStories(storiesList);

        // Fetch Users
        const usersSnap = await getDocs(usersRef);
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);

        // Fetch Reports
        const reportsSnap = await getDocs(query(reportsRef, orderBy('createdAt', 'desc')));
        setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Calculate Stats
        let views = 0, likes = 0, downloads = 0, published = 0, pending = 0;
        storiesList.forEach((s: any) => {
          views += (Number(s.views) || 0);
          likes += (Number(s.likes) || 0);
          downloads += (Number(s.downloadCount) || 0);
          if (s.status === 'approved') published++;
          if (s.status === 'pending') pending++;
        });

        setStats({
          totalUsers: usersList.length,
          totalStories: storiesList.length,
          pendingStories: pending,
          publishedStories: published,
          totalComments: 0, // Would need deep query or separate counter
          totalLikes: likes,
          totalViews: views,
          totalDownloads: downloads,
          totalReports: reportsSnap.size,
        });

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, [isAdmin]);

  const handleStoryStatus = async (story: any, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'stories', story.id), { status });
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, status } : s));
      
      // Notify Author
      await sendNotification({
        userId: story.authorId,
        type: status === 'approved' ? 'approval' : 'rejection',
        title: status === 'approved' ? 'গল্প অনুমোদিত!' : 'গল্প প্রত্যাখ্যাত',
        message: status === 'approved' 
          ? `আপনার "${story.title}" গল্পটি অ্যাডমিন দ্বারা অনুমোদিত হয়েছে।` 
          : `দুঃখিত, আপনার "${story.title}" গল্পটি নীতিমালা পরিপন্থী হওয়ায় প্রত্যাখ্যাত হয়েছে।`,
        link: status === 'approved' ? `/story/${story.id}` : ''
      });
      
      alert(`গল্পটি ${status === 'approved' ? 'অনুমোদন' : 'প্রত্যাখ্যান'} করা হয়েছে।`);
    } catch (error) {
      console.error('Error updating story status:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('গল্পটি মুছতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  const handleUserStatus = async (userId: string, status: 'active' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      
      if (status === 'suspended') {
        await sendNotification({
          userId,
          type: 'moderation',
          title: 'অ্যাকাউন্ট স্থগিত',
          message: 'আপনার অ্যাকাউন্টটি নীতিমালা ভঙ্গের কারণে স্থগিত করা হয়েছে।',
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  if (!isAdmin) {
    return <div className="container mx-auto px-4 py-20 text-center">আপনার এই পেজটি দেখার অনুমতি নেই।</div>;
  }

  const filteredStories = stories.filter(s => storyFilter === 'all' ? true : s.status === storyFilter);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <SEO title="অ্যাডমিন প্যানেল" noindex={true} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/20">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-serif">অ্যাডমিন প্যানেল</h1>
            <p className="text-slate-500">স্বাগতম! প্ল্যাটফর্মের সবকিছু এখান থেকে নিয়ন্ত্রণ করুন।</p>
          </div>
        </div>

        <nav className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: BarChart3 },
            { id: 'stories', label: 'গল্পসমূহ', icon: BookOpen },
            { id: 'users', label: 'ব্যবহারকারী', icon: Users },
            { id: 'reports', label: 'রিপোর্ট', icon: AlertTriangle },
            { id: 'settings', label: 'সেটিংস', icon: Settings },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium font-serif">তথ্য লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'মোট ব্যবহারকারী', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'মোট গল্প', value: stats.totalStories, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'অপেক্ষমান গল্প', value: stats.pendingStories, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'মোট ভিউ', value: stats.totalViews, icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                  { label: 'মোট লাইক', value: stats.totalLikes, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                  { label: 'ডাউনলোড', value: stats.totalDownloads, icon: Download, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
                  { label: 'রিপোর্ট', value: stats.totalReports, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40' },
                  { label: 'প্রকাশিত', value: stats.publishedStories, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                  >
                    <div className={`p-3 rounded-2xl w-fit mb-4 ${item.bg} ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{item.label}</p>
                    <h3 className="text-3xl font-bold font-mono">{item.value}</h3>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Stories Tab */}
          {activeTab === 'stories' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                {['all', 'pending', 'approved', 'rejected'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setStoryFilter(f as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${storyFilter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                  >
                    {f === 'all' ? 'সব' : f === 'pending' ? 'অপেক্ষমান' : f === 'approved' ? 'প্রকাশিত' : 'প্রত্যাখ্যাত'}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">গল্প ও লেখক</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">বিভাগ</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">স্ট্যাটাস</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStories.map(story => (
                      <tr key={story.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                              <img src={story.coverImage || storyPlaceholder} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{story.title}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <User size={12} /> {story.authorName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400">
                            {story.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                            story.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                            story.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30'
                          }`}>
                            {story.status === 'approved' ? 'প্রকাশিত' : story.status === 'pending' ? 'অপেক্ষমান' : 'প্রত্যাখ্যাত'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {story.status === 'pending' && (
                              <>
                                <button onClick={() => handleStoryStatus(story, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl" title="Approve"><CheckCircle size={20} /></button>
                                <button onClick={() => handleStoryStatus(story, 'rejected')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl" title="Reject"><XCircle size={20} /></button>
                              </>
                            )}
                            <button onClick={() => handleDeleteStory(story.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl" title="Delete"><Trash2 size={20} /></button>
                            <button onClick={() => navigate(`/story/${story.id}`)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><ChevronRight size={20} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-300">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ব্যবহারকারী</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ইমেইল</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">রোল</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">স্ট্যাটাস</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                            {u.photoURL ? <img src={u.photoURL} className="h-full w-full object-cover" /> : <User size={20} className="w-full h-full p-2 text-slate-400" />}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{u.displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {u.status === 'suspended' ? 'স্থগিত' : 'সক্রিয়'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.id !== currentUser?.uid && u.role !== 'admin' && (
                            <>
                              <button 
                                onClick={() => handleUserStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended')} 
                                className={`p-2 rounded-xl transition-colors ${u.status === 'suspended' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                title={u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              >
                                {u.status === 'suspended' ? <CheckCircle size={20} /> : <Ban size={20} />}
                              </button>
                              <button onClick={() => handleDeleteStory(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl" title="Delete User"><Trash2 size={20} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in duration-300">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">রিপোর্ট টাইপ</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">কারণ</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">রিপোর্টার</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">স্ট্যাটাস</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase w-fit px-2 py-0.5 rounded mb-1 ${r.type === 'story' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {r.type === 'story' ? 'গল্প' : 'মতামত'}
                          </span>
                          <span className="text-sm font-bold line-clamp-1">{r.targetName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{r.reason}</td>
                      <td className="px-6 py-4 text-sm font-medium">{r.reporterName}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${r.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {r.status === 'resolved' ? 'সমাধানকৃত' : 'বিবেচ্য'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleResolveReport(r.id)} 
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl" 
                                title="পড়া হয়েছে/সমাধানকৃত"
                              >
                                <CheckSquare size={20} />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!window.confirm('আপনি কি এই রিপোর্ট করা বিষয়টি মুছে ফেলতে চান?')) return;
                                  try {
                                    if (r.type === 'story') {
                                      await deleteDoc(doc(db, 'stories', r.targetId));
                                    } else {
                                      await deleteDoc(doc(db, `stories/${r.parentId}/comments`, r.targetId));
                                    }
                                    await handleResolveReport(r.id);
                                    alert('বিষয়টি সফলভাবে মুছে ফেলা হয়েছে।');
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }} 
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl" 
                                title="মুছে ফেলুন"
                              >
                                <Trash2 size={20} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => navigate(r.type === 'story' ? `/story/${r.targetId}` : `/story/${r.parentId}`)} 
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && <div className="py-20 text-center text-slate-500">কোনো রিপোর্ট পাওয়া যায়নি।</div>}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 shadow-sm animate-in fade-in duration-300">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-3">
                  <Settings className="text-slate-400" />
                  প্ল্যাটফর্ম সেটিংস
                </h2>
                
                <div className="space-y-8">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" />
                      বিজ্ঞাপন ব্যবস্থাপনা (Ad-Ready)
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">এখানে আপনি আপনার Adsterra বা অন্যান্য অ্যাড নেটওয়ার্কের কোড যুক্ত করতে পারবেন।</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">হোমপেজ ব্যানার অ্যাড কোড</label>
                        <textarea 
                          placeholder="<script>...</script>"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-mono"
                          rows={3}
                          disabled
                        />
                      </div>
                      <p className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">নোট: এই ফিচারটি বর্তমানে শুধুমাত্র প্লেসহোল্ডার হিসেবে আছে। প্রোডাকশনে যাওয়ার আগে আপনার অ্যাড কোড এখানে ইন্টিগ্রেট করা হবে।</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
