interface AdPlacementProps {
  id: string;
  type: 'banner' | 'sidebar' | 'inline';
  className?: string;
}

const ADS_CONFIG = {
  enabled: true, // Master switch for all ads
  slots: {
    'home-top-banner': { enabled: true },
    'home-sidebar': { enabled: true },
    'list-top-banner': { enabled: true },
    'list-bottom-banner': { enabled: true },
    'story-top-inline': { enabled: true },
    'story-sidebar': { enabled: true },
  }
};

export default function AdPlacement({ id, type, className = "" }: AdPlacementProps) {
  // Check if ads are globally enabled and this specific slot is enabled
  const isEnabled = ADS_CONFIG.enabled && (
    !ADS_CONFIG.slots[id as keyof typeof ADS_CONFIG.slots] || 
    ADS_CONFIG.slots[id as keyof typeof ADS_CONFIG.slots].enabled
  );

  if (!isEnabled) return null;

  const getStyles = () => {
    switch (type) {
      case 'banner': return 'w-full h-[90px] md:h-[250px]';
      case 'sidebar': return 'w-full h-[600px]';
      case 'inline': return 'w-full h-[250px]';
      default: return 'w-full h-auto';
    }
  };

  return (
    <div 
      className={`bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 ${getStyles()} ${className}`}
      data-ad-id={id}
    >
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-700 block mb-1">প্রোমোশন</span>
        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-800 mx-auto rounded-full"></div>
      </div>
      
      {/* 
        Future: Add real ad code here based on ID
        Example:
        {id === 'home-top-banner' && <script async src="..."></script>}
      */}
    </div>
  );
}
