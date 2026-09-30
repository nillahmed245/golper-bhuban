import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Image as ImageIcon, Send, Save, ArrowLeft, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { notifyAdmins } from '../lib/notificationService';
import SEO from '../components/SEO';
import { useRef } from 'react';

const CATEGORIES = [
  { id: 'Love', name: 'ভালোবাসা' },
  { id: 'Horror', name: 'ভৌতিক' },
  { id: 'Comedy', name: 'হাস্যরস' },
  { id: 'Mystery', name: 'রহস্য' },
  { id: 'Fantasy', name: 'কল্পকাহিনী' },
  { id: 'Emotional', name: 'আবেগপ্রবণ' },
  { id: 'Adventure', name: 'অ্যাডভেঞ্চার' },
  { id: 'Kids', name: 'ছোটদের গল্প' },
];

export default function WriteStory() {
  const { id } = useParams();
  const { user, profile, isSuspended } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Love',
    description: '',
    content: '',
    tags: '',
    coverImage: '',
  });

  useEffect(() => {
    if (id && user) {
      async function fetchStory() {
        setFetching(true);
        try {
          const snap = await getDoc(doc(db, 'stories', id!));
          if (snap.exists()) {
            const data = snap.data();
            if (data.authorId !== user?.uid) {
              alert('আপনি এই গল্পটি এডিট করতে পারবেন না।');
              navigate('/');
              return;
            }
            setFormData({
              title: data.title,
              category: data.category,
              description: data.description,
              content: data.content,
              tags: data.tags.join(', '),
              coverImage: data.coverImage || '',
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setFetching(false);
        }
      }
      fetchStory();
    }
  }, [id, user, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for Story Cover
      setError('ইমেজ সাইজ ২ মেগাবাইটের বেশি হওয়া যাবে না।');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, coverImage: reader.result as string });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (formData.title.length < 3) return 'শিরোনাম অন্তত ৩ অক্ষরের হতে হবে।';
    if (formData.content.length < 50) return 'গল্পটি অন্তত ৫০ অক্ষরের হতে হবে।';
    if (!formData.description) return 'সংক্ষিপ্ত বিবরণ প্রয়োজন।';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSuspended) return;
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag && tag.length <= 20).slice(0, 10);
      
      const storyData: any = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        content: formData.content.trim(),
        tags: tagsArray,
        coverImage: formData.coverImage.trim(),
        authorId: user.uid,
        authorName: profile?.displayName || 'অজানা লেখক',
        status: id ? 'approved' : 'pending', // Keep approved if editing, or set to pending for new (rules will check this)
      };

      if (id) {
        // Update
        const existingSnap = await getDoc(doc(db, 'stories', id));
        const existingData = existingSnap.data();
        // Maintain system fields
        storyData.status = existingData?.status || 'pending';
        await updateDoc(doc(db, 'stories', id), storyData);
        alert('গল্পটি সফলভাবে আপডেট করা হয়েছে।');
        navigate(`/story/${id}`);
      } else {
        // Create
        storyData.views = 0;
        storyData.likes = 0;
        storyData.downloadCount = 0;
        storyData.createdAt = new Date().toISOString();
        storyData.status = 'pending';

        await addDoc(collection(db, 'stories'), storyData);
        
        await notifyAdmins(
          'নতুন গল্প জমা দেওয়া হয়েছে',
          `"${formData.title}" গল্পটি অনুমোদনের অপেক্ষায় আছে।`,
          '/admin'
        );

        alert('আপনার গল্পটি সফলভাবে জমা দেওয়া হয়েছে। অ্যাডমিন অনুমোদনের পর এটি প্রকাশিত হবে।');
        navigate('/');
      }
    } catch (error) {
      console.error('Error saving story:', error);
      setError('গল্প সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (!user || isSuspended) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">{isSuspended ? "আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে" : "গল্প লিখতে লগইন করুন"}</h2>
        <p className="text-slate-500 mb-8">{isSuspended ? "আপনি আপাতত কোনো নতুন গল্প লিখতে পারবেন না।" : ""}</p>
        <button onClick={() => navigate('/')} className="text-emerald-600 font-medium">হোমে ফিরে যান</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <SEO 
        title={id ? "গল্প এডিট করুন" : "নতুন গল্প লিখুন"} 
        noindex={true}
      />
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft size={20} />
        <span>ফিরে যান</span>
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <h1 className="text-3xl font-bold font-serif mb-8">{id ? "গল্প এডিট করুন" : "নতুন গল্প লিখুন"}</h1>

        {fetching ? (
          <div className="py-20 text-center text-slate-500">তথ্য লোড হচ্ছে...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">গল্পের শিরোনাম</label>
            <input 
              required
              type="text" 
              placeholder="শিরোনাম দিন..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 text-xl font-serif focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Grid: Category & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">বিভাগ</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">ট্যাগ (কমা দিয়ে লিখুন)</label>
              <input 
                type="text" 
                placeholder="রহস্য, রোমাঞ্চ, ভৌতিক..."
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">সংক্ষিপ্ত বিবরণ</label>
            <textarea 
              required
              rows={3}
              placeholder="গল্পের একটি ছোট সারাংশ দিন..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">গল্পের কভার ইমেজ</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[21/9] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden group"
            >
              {formData.coverImage ? (
                <>
                  <img src={formData.coverImage} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto text-slate-300 mb-2" size={48} />
                  <p className="text-sm text-slate-500 font-medium">কভার ইমেজ আপলোড করতে ক্লিক করুন</p>
                  <p className="text-[10px] text-slate-400 mt-1">সর্বোচ্চ ২ মেগাবাইট</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">গল্পের মূল অংশ</label>
            <textarea 
              required
              rows={15}
              placeholder="আপনার গল্পটি এখানে লিখুন..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-5 py-6 font-serif text-lg leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-8">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              <span>বাতিল করুন</span>
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>জমা দিন</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
  );
}
