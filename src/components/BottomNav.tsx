import { Home, Search, MessageCircle, User, LayoutDashboard, PlusSquare, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  page: string;
  setPage: (p: string) => void;
}

export default function BottomNav({ page, setPage }: Props) {
  const { profile } = useAuth();
  const isSeller = profile?.active_role === 'seller';

  const buyerNav = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'account', icon: User, label: 'Account' },
  ];

  const sellerNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'post', icon: PlusSquare, label: 'Post' },
    { id: 'my-items', icon: Search, label: 'My Items' },
    { id: 'inbox', icon: Inbox, label: 'Inbox' },
    { id: 'account', icon: User, label: 'Account' },
  ];

  const nav = isSeller ? sellerNav : buyerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom shadow-lg">
      <div className="flex max-w-lg mx-auto">
        {nav.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              page === id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={22} strokeWidth={page === id ? 2.5 : 2} />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
