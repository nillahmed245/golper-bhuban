import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StoryCard from '../components/StoryCard';
import { User, Mail, Shield, BookOpen, Clock, Settings, Bookmark, PlusSquare } from 'lucide-react';
import { formatDate } from '../lib/utils';
import SEO from '../components/SEO';
import EditProfileModal from '../components/EditProfileModal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

type ProfileTab = 'stories' | 'bookmarks';

export default function Profile() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [userStories, setUserStories] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('stories');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Stories
        const storiesRef = collection(db, 'stories');
        const q = query(
          storiesRef, 
          where('authorId', '==', user?.uid),
          orderBy('createdAt', 'desc')
        );
        const storiesSnap = await getDocs(q);
        setUserStories(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Bookmarks
        if (user?.uid) {
          const bookmarksSnap = await getDocs(collection(db, `users/${user.uid}/bookmarks`));
          setBookmarks(bookmarksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (!user) return <div className="container mx-auto px-4 py-20 text-center">দয়া করে লগইন করুন।</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <SEO title="আপনার প্রোফাইল" noindex={true} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-emerald-50 dark:border-emerald-900/20">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="w-full h-full p-6 text-slate-400" />
                )}
              </div>
              {isAdmin && (
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-white dark:border-slate-900">
                  <Shield size={16} />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold mb-1">{profile?.displayName || 'ব্যবহারকারী'}</h2>
            <p className="text-sm text-slate-500 mb-4">{isAdmin ? 'অ্যাডমিন' : 'লেখক'}</p>

            {profile?.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 italic">"{profile.bio}"</p>
            )}

            <div className="space-y-4 text-left pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400 truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400">যুক্ত হয়েছেন: {formatDate(profile?.createdAt)}</span>
              </div>
            </div>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-full mt-8 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
            >
              <Settings size={16} />
              <span>প্রোফাইল এডিট করুন</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="flex items-center gap-8 border-b border-slate-100 dark:border-slate-800 mb-8">
            <button 
              onClick={() => setActiveTab('stories')}
              className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'stories' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={18} />
                <span>আমার গল্পসমূহ ({userStories.length})</span>
              </div>
              {activeTab === 'stories' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
            </button>
            <button 
              onClick={() => setActiveTab('bookmarks')}
              className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'bookmarks' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className="flex items-center gap-2">
                <Bookmark size={18} />
                <span>সংরক্ষিত ({bookmarks.length})</span>
              </div>
              {activeTab === 'bookmarks' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
            </button>
          </div>

          {activeTab === 'stories' ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold font-serif">আপনার প্রকাশিত ও পেন্ডিং গল্প</h2>
                {profile?.status !== 'suspended' && (
                  <button 
                    onClick={() => navigate('/write')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <PlusSquare size={18} />
                    <span>নতুন গল্প লিখুন</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl h-80"></div>
                  ))}
                </div>
              ) : userStories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userStories.map(story => (
                    <div key={story.id} className="relative">
                      <StoryCard story={story} />
                      {story.status === 'pending' && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">
                            অপেক্ষমান
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">আপনার কোনো গল্প নেই</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">আজই আপনার প্রথম গল্পটি লিখুন!</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold font-serif mb-8">আপনার প্রিয় গল্পের তালিকা</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl h-80"></div>
                  ))}
                </div>
              ) : bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bookmarks.map(story => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Bookmark size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">কোনো গল্প সেভ করা নেই</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">আপনার প্রিয় গল্পগুলো এখানে জমা থাকবে।</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </div>
  );
}
