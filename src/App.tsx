import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/buyer/HomePage';
import ItemDetailPage from './pages/buyer/ItemDetailPage';
import ChatPage from './pages/buyer/ChatPage';
import ChatsListPage from './pages/buyer/ChatsListPage';
import AccountPage from './pages/AccountPage';
import DashboardPage from './pages/seller/DashboardPage';
import PostItemPage from './pages/seller/PostItemPage';
import MyItemsPage from './pages/seller/MyItemsPage';
import SellerInboxPage from './pages/seller/SellerInboxPage';
import BottomNav from './components/BottomNav';
import type { Item } from './lib/types';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState('home');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  if (selectedItem) {
    return (
      <ItemDetailPage
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
        onChat={(id) => {
          setSelectedItem(null);
          setActiveChatId(id);
          setPage('chats');
        }}
      />
    );
  }

  if (activeChatId) {
    return (
      <ChatPage
        conversationId={activeChatId}
        onBack={() => { setActiveChatId(null); }}
      />
    );
  }

  const isSeller = profile.active_role === 'seller';

  const renderPage = () => {
    if (isSeller) {
      switch (page) {
        case 'dashboard': return <DashboardPage setPage={setPage} />;
        case 'post':
          return (
            <PostItemPage
              onBack={() => setPage('dashboard')}
              onSuccess={() => setPage('my-items')}
            />
          );
        case 'my-items': return <MyItemsPage setPage={setPage} />;
        case 'inbox':
          return (
            <SellerInboxPage
              onOpenChat={(id) => setActiveChatId(id)}
            />
          );
        case 'account': return <AccountPage setPage={setPage} />;
        default: return <DashboardPage setPage={setPage} />;
      }
    } else {
      switch (page) {
        case 'home':
        case 'search':
          return (
            <HomePage
              onItemClick={(item) => setSelectedItem(item)}
              setPage={setPage}
            />
          );
        case 'chats':
          return (
            <ChatsListPage
              onOpenChat={(id) => setActiveChatId(id)}
            />
          );
        case 'account': return <AccountPage setPage={setPage} />;
        default:
          return (
            <HomePage
              onItemClick={(item) => setSelectedItem(item)}
              setPage={setPage}
            />
          );
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      {renderPage()}
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
