import { useState } from 'react';
import { ArrowLeft, Camera, X, CheckCircle, PlusCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../lib/types';
import type { Category } from '../../lib/types';
import ErrorBoundary from '../../components/ErrorBoundary';
import { KADUNA_AREAS } from '../../lib/constants';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export default function PostItemPage({ onBack, onSuccess }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Phones');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1000;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(), 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 5) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `${user?.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('items').upload(path, compressed);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('items').getPublicUrl(path);
      setPhotos(prev => [...prev, data.publicUrl]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    // Validation
    if (photos.length === 0) {
      setError('Please add at least one photo');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    setSubmitting(true);

    try {
      const { error: err } = await supabase.from('items').insert([{
        seller_id: user.id,
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim(),
        category,
        location: location.trim(),
        photos,
        is_active: true,
      }]);

      if (err) {
        console.error('Error posting item:', err);
        setError(err.message);
      } else {
        setDone(true);
        setTimeout(() => { setDone(false); onSuccess(); }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error posting item:', err);
      setError('Failed to post item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">Item Posted!</h2>
        <p className="text-sm text-gray-500 mt-1 text-center">Your item is now live for buyers to see.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="pb-24 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-30">
        <button onClick={onBack} className="p-1 -ml-1 text-gray-600" aria-label="Go back">
          <ArrowLeft size={22} className="dark:text-gray-300" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">Post New Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-4">
        {/* Photos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Camera size={16} className="text-orange-500" />
            Photos (up to 5)
          </label>
          <div className="flex gap-2 flex-wrap mb-3">
            {photos.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          {photos.length < 5 && (
            <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" aria-label="Upload photo">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <PlusCircle size={20} className="text-gray-400" aria-hidden="true" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              {uploading && <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-xl"><Loader className="animate-spin text-orange-500" size={16} aria-hidden="true" /></div>}
            </label>
          )}
        </div>

        {/* Fields */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Item Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={80}
              placeholder="e.g. Samsung Galaxy A15"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-transparent dark:text-white"
              aria-label="Item Title"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Price (₦) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              placeholder="e.g. 50000"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-transparent dark:text-white"
              aria-label="Price in Naira"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              required
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-transparent dark:bg-gray-800 dark:text-white"
              aria-label="Category"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Location *</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-transparent dark:bg-gray-800 dark:text-white"
              aria-label="Location area"
            >
              <option value="">Select area in Kaduna</option>
              {KADUNA_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              maxLength={500}
              placeholder="Describe your item — condition, size, age, etc."
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-transparent dark:text-white"
              aria-label="Detailed description"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{description.length}/500</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl p-3 border border-red-100 dark:border-red-900/50">{error}</div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 safe-bottom">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 shadow-lg shadow-orange-200 active:bg-orange-600"
            aria-busy={submitting || uploading}
          >
            {submitting ? 'Posting...' : uploading ? 'Uploading Photo...' : 'Post Item'}
          </button>
        </div>
      </form>
      </div>
    </ErrorBoundary>
  );
}
