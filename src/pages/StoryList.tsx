import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StoryCard from '../components/StoryCard';
import { BookOpen, Search as SearchIcon, ChevronDown, Filter } from 'lucide-react';
import SEO from '../components/SEO';
import AdPlacement from '../components/AdPlacement';

type SortOption = 'createdAt' | 'views' | 'likes';

export default function StoryList() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');

  const title = categoryId 
    ? `${categoryId} বিভাগের গল্প` 
    : searchQuery 
      ? `"${searchQuery}" এর জন্য অনুসন্ধানের ফলাফল` 
      : 'সব গল্প';

  useEffect(() => {
    async function fetchStories() {
      setLoading(true);
      try {
        const storiesRef = collection(db, 'stories');
        let q = query(storiesRef, where('status', '==', 'approved'), orderBy(sortBy, 'desc'));

        if (categoryId) {
          q = query(storiesRef, where('status', '==', 'approved'), where('category', '==', categoryId), orderBy(sortBy, 'desc'));
        }

        const snap = await getDocs(q);
        let results: any[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          results = results.filter(story => 
            story.title?.toLowerCase().includes(lowerQuery) || 
            story.authorName?.toLowerCase().includes(lowerQuery) ||
            story.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
          );
        }

        setStories(results);
      } catch (error) {
        console.error('Error fetching story list:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [categoryId, searchQuery, sortBy]);

  return (
    <div className="container mx-auto px-4 py-12">
      <SEO 
        title={title} 
        description={`Explore the best stories in ${categoryId || searchQuery || 'all categories'} at Golper Bhuban.`} 
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
            {searchQuery ? <SearchIcon size={24} /> : <BookOpen size={24} />}
          </div>
          <h1 className="text-3xl font-bold font-serif">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} />
            সাজান:
          </span>
          <div className="relative group">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 pr-10 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="createdAt">সর্বশেষ</option>
              <option value="views">সবচেয়ে জনপ্রিয়</option>
              <option value="likes">সেরা রেটিং</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <AdPlacement id="list-top-banner" type="banner" className="mb-12" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl h-80"></div>
          ))}
        </div>
      ) : stories.length > 0 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
          <AdPlacement id="list-bottom-banner" type="banner" />
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">কোনো গল্প পাওয়া যায়নি</h3>
          <p className="text-slate-500">অন্য কিছু লিখে আবার চেষ্টা করুন!</p>
        </div>
      )}
    </div>
  );
}
