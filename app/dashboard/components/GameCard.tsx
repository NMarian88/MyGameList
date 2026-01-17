import Image from 'next/image';
import { Flag, Play, Heart, Skull } from 'lucide-react';

type ViewMode = 'cards' | 'details';
type status = 'completed' | 'playing' | 'wishlist' | 'dropped';

interface Props {
  gameName: string;
  description?: string;
  image: string;
  genres?: string;
  platforms?: string;
  viewMode?: ViewMode;
  show_score?: boolean;
  score?: number;
  show_status?: boolean;
  status?: status;
  onClick?: () => void;
}

/**
 * Formats platforms with priority ordering:
 * PC -> newest PlayStation -> newest Xbox -> newest Nintendo -> others
 */
function formatPlatforms(platforms?: string, maxCount: number = 3): string {
  if (!platforms) return '';
  
  const platformList = platforms.split(',').map(p => p.trim());
  
  // Priority order mapping
  const priorityOrder = [
    { keywords: ['PC'], priority: 1 },
    { keywords: ['PlayStation 5', 'PlayStation 4', 'PS5', 'PS4'], priority: 2 },
    { keywords: ['Xbox Series', 'Xbox One'], priority: 3 },
    { keywords: ['Nintendo Switch'], priority: 4 },
  ];
  
  const sorted = platformList.sort((a, b) => {
    const aPriority = priorityOrder.find(p => p.keywords.some(k => a.includes(k)))?.priority ?? 999;
    const bPriority = priorityOrder.find(p => p.keywords.some(k => b.includes(k)))?.priority ?? 999;
    return aPriority - bPriority;
  });
  
  const limited = sorted.slice(0, maxCount);
  return limited.join(', ') + (sorted.length > maxCount ? '...' : '');
}

/**
 * Limits genres to a maximum count
 */
function formatGenres(genres?: string, maxCount: number = 3): string {
  if (!genres) return '';
  
  const genreList = genres.split(',').map(g => g.trim());
  const limited = genreList.slice(0, maxCount);
  return limited.join(', ') + (genreList.length > maxCount ? '...' : '');
}

/**
 * Truncates HTML content by character count
 */
function truncateHtml(html?: string, maxLength: number = 150): string {
  if (!html) return '';
  
  if (html.length <= maxLength) return html;
  
  return html.substring(0, maxLength).trim() + '...';
}

export default function GameCard({ gameName, description, image, genres, platforms, show_score = false, score, show_status = false, status = 'completed', viewMode = 'cards', onClick }: Props) {
  const formattedGenres = formatGenres(genres);
  const formattedPlatforms = formatPlatforms(platforms);
  const truncatedDescription = truncateHtml(description);
  const scoreClass = (() => {
    if (score == null) return 'bg-black/50'; // fallback
    if (score >= 8) return 'bg-green-600/50';
    if (score >= 5) return 'bg-yellow-500/50';
    return 'bg-red-600/50';
  })();

  const statusClass = (() => {
    if (status == null) return 'bg-black/50'; // fallback
    if (status == 'completed') return 'bg-green-600/50';
    if (status == 'playing') return 'bg-blue-600/50';
    if (status == 'wishlist') return 'bg-purple-600/50';
    if (status == 'dropped') return 'bg-red-600/50';

    return 'bg-red-600/50';
  })();

  const statusIcon = (() => {
    switch (status) {
      case 'completed': return <Flag className="w-4 h-4" />;
      case 'playing':   return <Play className="w-4 h-4" />;
      case 'wishlist':  return <Heart className="w-4 h-4" />;
      case 'dropped':   return <Skull className="w-4 h-4" />;
      default:          return <Flag className="w-4 h-4" />;
    }
  })();

  // Details view: horizontal full-width row
  if (viewMode === 'details') {
    return (
      <div 
        className="w-full rounded-lg overflow-hidden bg-gray-800 p-3 flex items-center gap-4 border border-gray-700 relative z-0 hover:bg-gray-750 transition-colors cursor-pointer"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        <div className="shrink-0 w-28 h-20 relative rounded overflow-hidden">
          <Image src={image} alt={gameName} className="object-cover w-full h-full" width={128} height={96} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-white truncate">{gameName}</h3>
          <p className="text-xs text-gray-300">
            {formattedGenres}
            {formattedGenres && formattedPlatforms && ' • '}
            {formattedPlatforms}
            <br></br>
            {/* surely this is fine right?*/}
            {truncatedDescription && <span dangerouslySetInnerHTML={{ __html: truncatedDescription }} />}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {show_score && (
            <div className={`text-white p-1 shadow-md rounded flex items-center justify-center text-xs w-10 ${scoreClass}`}>
              <div className="truncate w-full text-center">{score ?? '—'}</div>
            </div>
          )}
          {show_status && (
            <div className={`text-white p-1 shadow-md rounded flex items-center justify-center text-xs w-10 ${statusClass}`} title={`Status: ${status ?? '—'}`} aria-label={`Status: ${status ?? '—'}`}>
              {statusIcon}
              <span className="sr-only">{status}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Default: cards (original)
  return (
    <div 
      className="w-64 rounded-lg overflow-hidden bg-gray-800 shadow-lg group hover:scale-105 transform transition relative z-0 hover:z-10 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="relative">
        {show_score && (
          <div className="absolute top-2 left-2 z-10">
            <div className={`text-white p-1 shadow-md rounded flex items-center justify-center text-xs w-6 ${scoreClass}`} title={`Score: ${score ?? '—'}`} aria-label={`Score: ${score ?? '—'}`}>
              <div className="truncate w-full text-center">{score ?? '—'}</div>
            </div>
          </div>
        )}

        {show_status && (
          <div className="absolute top-2 right-2 z-10">
            <div className={`text-white p-1 shadow-md rounded flex items-center justify-center text-xs w-10 ${statusClass}`} title={`Status: ${status ?? '—'}`} aria-label={`Status: ${status ?? '—'}`}>
              {statusIcon}
              <span className="sr-only">{status}</span>
            </div>
          </div>
        )}

        <Image src={image} alt={gameName} className="w-full h-40 object-cover" width={256} height={160} />

        {/* Soft dark gradient for lower half */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">{gameName}</h3>
            {(formattedGenres || formattedPlatforms) && <p className="text-xs text-gray-300">{formattedGenres}{formattedGenres && formattedPlatforms && ' • '}{formattedPlatforms}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
