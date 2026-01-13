import Image from 'next/image';
import { Flag, Play, Heart, Skull } from 'lucide-react';

type ViewMode = 'cards' | 'tiles' | 'details';
type status = 'completed' | 'playing' | 'wishlist' | 'dropped';

interface Props {
  gameName: string;
  image: string;
  viewMode?: ViewMode;
  show_score?: boolean;
  score?: number;
  show_status?: boolean;
  status?: status;
}

export default function GameCard({ gameName, image, show_score = false, score, show_status = false, status = 'completed', viewMode = 'cards' }: Props) {
  const scoreClass = (() => {
    if (score == null) return 'bg-black/50'; // fallback
    if (score >= 8) return 'bg-green-600/50';
    if (score >= 5) return 'bg-yellow-500/50';
    return 'bg-red-600/50';
  })();

  const statusClass = (() => {
    if (status == null) return 'bg-black/50'; // fallback
    if (status == 'completed') return 'bg-black/50';
    if (status == 'playing') return 'bg-green-600/50';
    if (status == 'wishlist') return 'bg-yellow-500/50';
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
      <div className="w-full rounded-lg overflow-hidden bg-gray-800 p-3 flex items-center gap-4 border border-gray-700 relative z-0">
        <div className="flex-shrink-0 w-28 h-20 relative rounded overflow-hidden">
          <Image src={image} alt={gameName} className="object-cover w-full h-full" width={128} height={96} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-white truncate">{gameName}</h3>
          <p className="text-xs text-gray-300">Platform • More details here</p>
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
  
  // Tiles view: compact square card
  if (viewMode === 'tiles') {
    return (
      <div className="w-36 rounded-lg overflow-hidden bg-gray-800 shadow group hover:scale-105 transform transition border border-gray-700 relative z-0 hover:z-10">
        <div className="relative">
          {show_score && (
            <div className="absolute top-2 left-2 z-10">
              <div className={`text-white p-1 shadow-md rounded flex items-center justify-center text-xs w-6 ${scoreClass}`}>{score ?? '—'}</div>
            </div>
          )}
          {show_status && (
            <div className="absolute top-2 right-2 z-10">
              <div className={`text-white p-1 shadow-md rounded flex items-center justify-center text-xs w-8 ${statusClass}`} title={`Status: ${status ?? '—'}`} aria-label={`Status: ${status ?? '—'}`}>
                {statusIcon}
                <span className="sr-only">{status}</span>
              </div>
            </div>
          )}

          <Image src={image} alt={gameName} className="w-full h-24 object-cover" width={144} height={96} />

          <div className="p-2">
            <h3 className="font-semibold text-sm text-white truncate">{gameName}</h3>
          </div>
        </div>
      </div>
    );
  }

  // Default: cards (original)
  return (
    <div className="w-full sm:w-64 rounded-lg overflow-hidden bg-gray-800 shadow-lg group hover:scale-105 transform transition relative z-0 hover:z-10">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">{gameName}</h3>
            <p className="text-xs text-gray-300">Game • Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
