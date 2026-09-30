import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import Hero from '../components/Hero';
import CategoryBar from '../components/CategoryBar';
import StoryCard from '../components/StoryCard';
import { BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';
import AdPlacement from '../components/AdPlacement';

export default function Home() {
  const [latestStories, setLatestStories] = useState<any[]>([]);
  const [trendingStories, setTrendingStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      try {
        const storiesRef = collection(db, 'stories');
        
        // Latest Stories
        const latestQuery = query(
          storiesRef, 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(8)
        );
        const latestSnap = await getDocs(latestQuery);
        setLatestStories(latestSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Trending Stories (most likes)
        const trendingQuery = query(
          storiesRef,
          where('status', '==', 'approved'),
          orderBy('likes', 'desc'),
          limit(4)
        );
        const trendingSnap = await getDocs(trendingQuery);
        setTrendingStories(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'stories');
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, []);

  return (
    <div className="pb-20">
      <SEO 
        title="হোম" 
        description="সাহিত্যের এক মায়াবী জগত, যেখানে হাজারো গল্প আপনার অপেক্ষায়। রোমাঞ্চ, প্রেম, রহস্য বা কল্পনা—সবই পাবেন এখানে।" 
      />
      <Hero />
      
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <CategoryBar />
      </div>

      <main className="container mx-auto px-4 mt-12">
        <AdPlacement id="home-top-banner" type="banner" className="mb-16" />

        {/* Trending Section */}
        {trendingStories.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <TrendingUp className="text-amber-500" size={20} />
              </div>
              <h2 className="text-2xl font-bold font-serif">ট্রেন্ডিং গল্প</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            {/* Latest Stories Section */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <BookOpen className="text-emerald-500" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold font-serif">সাম্প্রতিক গল্প</h2>
                </div>
                <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">সব দেখুন →</button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl h-80"></div>
                  ))}
                </div>
              ) : latestStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestStories.map(story => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">এখনও কোনো গল্প নেই</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">প্রথম গল্পটি লিখে আমাদের যাত্রা শুরু করুন!</p>
                  <button className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-medium">গল্প লিখুন</button>
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-1 space-y-8">
            <AdPlacement id="home-sidebar" type="sidebar" />
            <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles size={120} />
              </div>
              <h3 className="text-xl font-bold font-serif mb-4 relative z-10">আপনার গল্প লিখুন</h3>
              <p className="text-slate-400 text-sm mb-6 relative z-10 leading-relaxed">আপনার ভেতরের গল্পকারকে জাগিয়ে তুলুন। আজই যোগ দিন আমাদের লেখক পরিবারে।</p>
              <button className="w-full py-3 bg-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all relative z-10">শুরু করুন</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
