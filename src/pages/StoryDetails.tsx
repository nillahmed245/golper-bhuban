import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs, addDoc, deleteDoc, setDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';
import { Heart, MessageSquare, Download, Share2, Eye, User, Calendar, ArrowLeft, Trash2, CheckCircle, Flag, MoreVertical, Bookmark, BookmarkCheck, Reply, Loader2, XCircle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendNotification } from '../lib/notificationService';
import ReportModal from '../components/ReportModal';
import SEO from '../components/SEO';
import AdPlacement from '../components/AdPlacement';
import StoryCard from '../components/StoryCard';
import { Edit2 } from 'lucide-react';

export default function StoryDetails() {
  const { id } = useParams();
  const { user, profile, isAdmin, isSuspended } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [relatedStories, setRelatedStories] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reportModal, setReportModal] = useState<{ open: boolean; targetId: string; type: 'story' | 'comment'; name: string; parentId?: string }>({
    open: false,
    targetId: '',
    type: 'story',
    name: '',
  });

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const storyRef = doc(db, 'stories', id);
        const storySnap = await getDoc(storyRef);
        
        if (storySnap.exists()) {
          const data = storySnap.data();
          setStory({ id: storySnap.id, ...data });
          
          // Increment views (session based)
          const viewedStories = JSON.parse(sessionStorage.getItem('viewed_stories') || '[]');
          if (!viewedStories.includes(id)) {
            try {
              await updateDoc(storyRef, { views: increment(1) });
              viewedStories.push(id);
              sessionStorage.setItem('viewed_stories', JSON.stringify(viewedStories));
            } catch (e) {
              console.warn('Could not increment views:', e);
            }
          }

          // Fetch related stories
          const relatedQuery = query(
            collection(db, 'stories'),
            where('status', '==', 'approved'),
            where('category', '==', data.category),
            limit(4)
          );
          const relatedSnap = await getDocs(relatedQuery);
          setRelatedStories(relatedSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(s => s.id !== id)
            .slice(0, 3)
          );

          // Fetch comments
          const commentsQuery = query(collection(db, `stories/${id}/comments`), orderBy('createdAt', 'desc'), limit(50));
          const commentsSnap = await getDocs(commentsQuery);
          setComments(commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Check if liked and bookmarked
          if (user) {
            const [likeSnap, bookmarkSnap] = await Promise.all([
              getDoc(doc(db, `stories/${id}/likes`, user.uid)),
              getDoc(doc(db, `users/${user.uid}/bookmarks`, id))
            ]);
            setIsLiked(likeSnap.exists());
            setIsBookmarked(bookmarkSnap.exists());
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `stories/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, user]);

  const handleLike = async () => {
    if (!user || !id || isSuspended) return;
    try {
      const likeRef = doc(db, `stories/${id}/likes`, user.uid);
      const storyRef = doc(db, 'stories', id);
      
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(storyRef, { likes: increment(-1) });
        setIsLiked(false);
        setStory((prev: any) => ({ ...prev, likes: prev.likes - 1 }));
      } else {
        await setDoc(likeRef, { userId: user.uid, createdAt: new Date().toISOString() });
        await updateDoc(storyRef, { likes: increment(1) });
        setIsLiked(true);
        setStory((prev: any) => ({ ...prev, likes: prev.likes + 1 }));

        // Send notification to author
        if (story.authorId !== user.uid) {
          await sendNotification({
            userId: story.authorId,
            type: 'like',
            title: 'আপনার গল্পটি পছন্দ হয়েছে!',
            message: `${profile?.displayName || 'কেউ একজন'} আপনার "${story.title}" গল্পটি পছন্দ করেছেন।`,
            link: `/story/${id}`
          });
        }
      }
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim() || isSuspended) return;
    try {
      const commentData: any = {
        storyId: id,
        authorId: user.uid,
        authorName: profile?.displayName || 'অজানা ব্যবহারকারী',
        content: newComment,
        createdAt: new Date().toISOString(),
      };
      
      if (replyingTo) {
        commentData.replyToId = replyingTo;
      }

      const commentRef = await addDoc(collection(db, `stories/${id}/comments`), commentData);
      setComments([{ id: commentRef.id, ...commentData }, ...comments]);
      setNewComment('');
      setReplyingTo(null);

      // Send notification to author
      if (story.authorId !== user.uid) {
        await sendNotification({
          userId: story.authorId,
          type: 'comment',
          title: replyingTo ? 'আপনার মতামতে রিপ্লাই এসেছে!' : 'নতুন মতামত!',
          message: `${profile?.displayName || 'কেউ একজন'} আপনার ${replyingTo ? 'মতামতে একটি রিপ্লাই' : `"${story.title}" গল্পে একটি মতামত`} দিয়েছেন।`,
          link: `/story/${id}`
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user || !id || isSuspended) return;
    try {
      const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, id);
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
      } else {
        await setDoc(bookmarkRef, {
          storyId: id,
          title: story.title,
          coverImage: story.coverImage,
          authorName: story.authorName,
          category: story.category,
          createdAt: new Date().toISOString()
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error bookmarking story:', error);
    }
  };

  const handleDownload = async () => {
    if (!story || isDownloading) return;
    setIsDownloading(true);
    try {
      // Small delay for better UX feel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Increment download count
      await updateDoc(doc(db, 'stories', story.id), { downloadCount: increment(1) });
      
      // Basic text download
      const element = document.createElement("a");
      const file = new Blob([`${story.title}\nলেখক: ${story.authorName}\n\n${story.content}`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${story.title}.txt`;
      document.body.appendChild(element);
      element.click();
    } catch (error) {
      console.error('Error downloading story:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin && !user) return;
    if (!window.confirm('আপনি কি এই মতামতটি মুছতে চান?')) return;
    try {
      await deleteDoc(doc(db, `stories/${id}/comments`, commentId));
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeleteStory = async () => {
    if (!isAdmin && story.authorId !== user?.uid) return;
    if (!window.confirm('আপনি কি এই গল্পটি মুছতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'stories', id!));
      if (isAdmin && story.authorId !== user?.uid) {
        await sendNotification({
          userId: story.authorId,
          type: 'moderation',
          title: 'গল্প মুছে ফেলা হয়েছে',
          message: `আপনার "${story.title}" গল্পটি অ্যাডমিন দ্বারা মুছে ফেলা হয়েছে।`,
        });
      }
      navigate('/');
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">লোড হচ্ছে...</div>;
  if (!story) return <div className="container mx-auto px-4 py-20 text-center">গল্পটি খুঁজে পাওয়া যায়নি।</div>;

  return (
    <div className="pb-20">
      <SEO 
        title={story.title} 
        description={story.description} 
        ogTitle={story.title}
        ogDescription={story.description}
        ogImage={story.coverImage}
        type="article"
        storyData={story}
      />
      {/* Cover Header */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src={story.coverImage || '/src/assets/images/story_cover_placeholder_1790797553347.jpg'} 
          className="w-full h-full object-cover blur-sm opacity-50 scale-110"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center pt-20">
          <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8 items-center md:items-end">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800"
            >
              <img 
                src={story.coverImage || '/src/assets/images/story_cover_placeholder_1790797553347.jpg'} 
                className="w-full h-full object-cover" 
                loading="eager"
              />
            </motion.div>
            <div className="flex-1 text-center md:text-left">
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                {story.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold font-serif text-slate-900 dark:text-white mb-4 leading-tight">
                {story.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">{story.authorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400" />
                  <span>{formatDate(story.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-slate-400" />
                  <span className="font-mono">{story.views} ভিউ</span>
                </div>
                {(isAdmin || story.authorId === user?.uid) && (
                  <div className="flex items-center gap-4 ml-auto pt-4 md:pt-0">
                    <button 
                      onClick={() => navigate(`/write/${id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all font-bold text-xs"
                    >
                      <Edit2 size={14} />
                      <span>এডিট করুন</span>
                    </button>
                    <button 
                      onClick={handleDeleteStory}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 backdrop-blur-md border border-rose-500/20 rounded-xl text-rose-200 hover:bg-rose-500/20 transition-all font-bold text-xs"
                    >
                      <Trash2 size={14} />
                      <span>মুছে ফেলুন</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 mt-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AdPlacement id="story-top-inline" type="inline" className="mb-8" />
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-xl font-serif leading-relaxed whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                  {story.content}
                </p>
              </div>

              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2">
                  {story.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isLiked ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Heart size={20} className={isLiked ? 'fill-rose-600' : ''} />
                    <span>{story.likes} লাইক</span>
                  </button>
                  <button 
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isBookmarked ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100'}`}
                  >
                    {isBookmarked ? <BookmarkCheck size={20} className="fill-amber-600" /> : <Bookmark size={20} />}
                    <span>{isBookmarked ? 'সেভ করা হয়েছে' : 'সেভ করুন'}</span>
                  </button>
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 rounded-xl font-medium hover:bg-emerald-100 transition-all disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                    <span>{isDownloading ? 'ডাউনলোড হচ্ছে...' : 'ডাউনলোড'}</span>
                  </button>
                </div>
                <button 
                  onClick={() => setReportModal({ open: true, targetId: id!, type: 'story', name: story.title })}
                  className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-medium"
                >
                  <Flag size={20} />
                  <span>রিপোর্ট</span>
                </button>
                <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium">
                  <Share2 size={20} />
                  <span>শেয়ার করুন</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <section className="mt-12">
              <div className="flex items-center gap-2 mb-8">
                <MessageSquare className="text-indigo-500" size={24} />
                <h2 className="text-2xl font-bold font-serif">মতামত ({comments.length})</h2>
              </div>

              {user ? (
                isSuspended ? (
                  <div className="mb-12 p-8 bg-rose-50 dark:bg-rose-900/10 rounded-2xl text-center border border-rose-100 dark:border-rose-900/30">
                    <p className="text-rose-600 dark:text-rose-400 font-medium font-serif">আপনার অ্যাকাউন্টটি আপাতত স্থগিত আছে, তাই আপনি মতামত দিতে পারবেন না।</p>
                  </div>
                ) : (
                  <div className="mb-12">
                    {replyingTo && (
                      <div className="flex items-center justify-between px-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-t-2xl border-x border-t border-indigo-100 dark:border-indigo-800">
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">রিপ্লাই দিচ্ছেন...</span>
                        <button onClick={() => setReplyingTo(null)} className="text-indigo-400 hover:text-indigo-600">
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                    <form onSubmit={handleComment} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm ${replyingTo ? 'rounded-t-none border-t-0' : ''}`}>
                      <textarea 
                        required
                        placeholder={replyingTo ? "আপনার রিপ্লাই লিখুন..." : "আপনার মতামত লিখুন..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-4"
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all">
                          {replyingTo ? 'রিপ্লাই দিন' : 'পাঠিয়ে দিন'}
                        </button>
                      </div>
                    </form>
                  </div>
                )
            ) : (
                <div className="mb-12 p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">মতামত দিতে দয়া করে লগইন করুন।</p>
                  <button className="text-emerald-600 font-bold">লগইন</button>
                </div>
              )}

              <div className="space-y-6">
                {comments.map(comment => (
                  <div key={comment.id} className={`flex gap-4 ${comment.replyToId ? 'ml-12' : ''}`}>
                    <div className={`${comment.replyToId ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-slate-200 shrink-0 overflow-hidden`}>
                      {/* Placeholder avatar */}
                      <User size={comment.replyToId ? 16 : 20} className="w-full h-full p-2 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group/comment ${comment.replyToId ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-sm">{comment.authorName}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">{formatDate(comment.createdAt)}</span>
                            {user && !isSuspended && !comment.replyToId && (
                              <button 
                                onClick={() => {
                                  setReplyingTo(comment.id);
                                  window.scrollTo({ top: document.querySelector('form')?.offsetTop! - 200, behavior: 'smooth' });
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                              >
                                <Reply size={14} />
                              </button>
                            )}
                            {(isAdmin || comment.authorId === user?.uid) && (
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            {user && comment.authorId !== user.uid && (
                              <button 
                                onClick={() => setReportModal({ open: true, targetId: comment.id, type: 'comment', name: comment.content.slice(0, 20) + '...', parentId: id })}
                                className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                              >
                                <Flag size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <AdPlacement id="story-sidebar" type="sidebar" />
            {/* Author Info */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
              <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-6 overflow-hidden">
                <User size={48} className="w-full h-full p-6 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">{story.authorName}</h3>
              <p className="text-sm text-slate-500 mb-6">গল্পকার ও সাহিত্য প্রেমী</p>
              <button className="w-full py-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-bold hover:scale-[1.02] transition-all">
                লেখককে ফলো করুন
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-2xl font-bold font-mono text-emerald-600 block">{story.views}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ভিউ</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-2xl font-bold font-mono text-rose-500 block">{story.likes}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">লাইক</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Stories */}
        {relatedStories.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <BookOpen className="text-amber-500" size={20} />
              </div>
              <h2 className="text-2xl font-bold font-serif">আরও পড়ুন (বিভাগ: {story.category})</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedStories.map(s => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </section>
        )}
      </main>

      <ReportModal 
        isOpen={reportModal.open}
        onClose={() => setReportModal({ ...reportModal, open: false })}
        targetId={reportModal.targetId}
        type={reportModal.type}
        targetName={reportModal.name}
        parentId={reportModal.parentId}
      />
    </div>
  );
}
