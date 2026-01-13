'use client';
import { Grid, List } from 'lucide-react';

type ViewMode = 'cards' | 'details';

interface Props {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}

export default function ViewToggle({ viewMode, setViewMode }: Props) {
  return (
    <div className="inline-flex items-center space-x-2">
      <button
        aria-pressed={viewMode === 'cards'}
        onClick={() => setViewMode('cards')}
        className={`p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${viewMode === 'cards' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        title="Cards view"
      >
        <Grid className="w-4 h-4" />
      </button>

      <button
        aria-pressed={viewMode === 'details'}
        onClick={() => setViewMode('details')}
        className={`p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${viewMode === 'details' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        title="Details view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
