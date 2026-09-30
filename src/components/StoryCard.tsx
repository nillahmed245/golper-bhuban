import { motion } from 'framer-motion';
import { Heart, Eye, Download, User, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, truncateText } from '../lib/utils';

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    coverImage?: string;
    category: string;
    authorName: string;
    description: string;
    views: number;
    likes: number;
    createdAt: string;
  };
}

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/story/${story.id}`} className="block relative aspect-[3/4] overflow-hidden bg-slate-100">
        <img 
          src={story.coverImage || '/src/assets/images/story_cover_placeholder_1790797553347.jpg'} 
          alt={story.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            {story.category}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <button className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm">
            গল্পটি পড়ুন
          </button>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2 font-medium">
          <div className="flex items-center gap-1">
            <User size={12} />
            <span>{story.authorName}</span>
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(story.createdAt)}</span>
          </div>
        </div>

        <Link to={`/story/${story.id}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-serif group-hover:text-emerald-600 transition-colors line-clamp-1">
            {story.title}
          </h3>
        </Link>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
          {story.description || 'এই গল্পের কোনো সংক্ষিপ্ত বিবরণ নেই। বিস্তারিত জানতে গল্পটি পড়ুন।'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Eye size={14} className="text-slate-400" />
              <span className="font-mono">{story.views || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Heart size={14} className="text-rose-400 fill-rose-400/10" />
              <span className="font-mono">{story.likes || 0}</span>
            </div>
          </div>
          <Link 
            to={`/story/${story.id}`}
            className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors"
          >
            বিস্তারিত →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
