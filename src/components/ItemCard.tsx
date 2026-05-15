import { MapPin, Send } from 'lucide-react';
import type { Item } from '../lib/types';

interface Props {
  item: Item;
  onClick: () => void;
  onMessage?: (e: React.MouseEvent) => void;
}

export default function ItemCard({ item, onClick, onMessage }: Props) {
  const photo = item.photos[0] ?? 'https://images.pexels.com/photos/4482900/pexels-photo-4482900.jpeg?auto=compress&cs=tinysrgb&w=400';
  const shortDesc = item.description.substring(0, 50);
  const hasMore = item.description.length > 50;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Image Container */}
      <button
        onClick={onClick}
        className="relative aspect-square overflow-hidden bg-gray-100 group"
      >
        <img
          src={photo}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          {item.category}
        </div>
      </button>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Title */}
        <button
          onClick={onClick}
          className="text-left mb-2"
        >
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug hover:text-blue-600 transition-colors">
            {item.title}
          </h3>
        </button>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">
          {shortDesc}{hasMore ? '...' : ''}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 mb-3">
          <MapPin size={12} strokeWidth={2} />
          <span className="text-xs truncate">{item.location || 'Kaduna'}</span>
        </div>

        {/* Price & Button - Always at bottom */}
        <div className="mt-auto">
          <p className="text-lg font-extrabold text-blue-600 mb-2.5">
            ₦{Number(item.price).toLocaleString()}
          </p>
          <button
            onClick={onMessage}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Send size={13} strokeWidth={2} />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
