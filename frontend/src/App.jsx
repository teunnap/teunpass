import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Settings, 
  User as UserIcon, 
  Lock, 
  Search, 
  Plus, 
  Copy, 
  Trash2, 
  Star 
} from 'lucide-react';

function App() {
  const [vaultItems, setVaultItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVaultItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/vaultitems/`);
      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }
      const data = await response.json();
      setVaultItems(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const handleDelete = async (itemId) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/vaultitems/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setVaultItems((prev) => prev.filter(item => item.vaultitem_id !== itemId));
      
      setNotification('Item has been deleted');
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  const handleCopyPassword = async (password) => {
    try {
      if (password) {
        await navigator.clipboard.writeText(password);
        setNotification('Password copied to clipboard!');
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification('No password to copy!');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getInitials = (title) => {
    return title ? title.substring(0, 2).toUpperCase() : '??';
  };

  const getCardColor = (title) => {
    const colors = [
      'bg-slate-800 text-white', 
      'bg-red-500 text-white', 
      'bg-blue-100 text-blue-600',
      'bg-orange-100 text-orange-600',
      'bg-purple-100 text-purple-600',
      'bg-green-100 text-green-600'
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredItems = vaultItems ? vaultItems.filter(item => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const titleMatch = item.e_title?.toLowerCase().includes(term);
    const userMatch = item.e_username?.toLowerCase().includes(term);
    return titleMatch || userMatch;
  }) : null;

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] font-sans text-slate-800">
      
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-100 text-green-800 border border-green-200 px-6 py-3 rounded-full shadow-lg z-50 transition-all font-medium text-sm">
          {notification}
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col pt-6">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold text-[#0A4AEF]">Teunpass</h1>
        </div>
        
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="font-semibold text-sm">Personal Vault</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase ml-4">
            LAST SYNCED: 2M AGO
          </p>
        </div>

        <nav className="px-4">
          <div className="flex items-center gap-3 bg-blue-50 text-[#0A4AEF] px-4 py-2.5 rounded-lg font-medium cursor-pointer">
            <Lock className="w-4 h-4" />
            <span className="text-sm">All Items</span>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        
        {/* TOP HEADER */}
        <header className="h-16 flex items-center justify-end px-8 gap-5">
            <RefreshCw className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
            <Settings className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-[#0A4AEF] flex items-center justify-center text-white cursor-pointer overflow-hidden">
                <UserIcon className="w-5 h-5" />
            </div>
        </header>

        <div className="max-w-6xl w-full mx-auto px-8 pb-12">
          
          {/* SEARCH BAR */}
          <div className="mt-4 mb-14">
            <div className="relative max-w-2xl mx-auto flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your logins..." 
                className="w-full bg-white rounded-full border border-slate-200 py-3.5 pl-12 pr-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0A4AEF]/20 focus:border-[#0A4AEF] transition-all"
              />
            </div>
          </div>

          {/* VAULT OVERVIEW HEADER */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-1">Vault Overview</h2>
              <p className="text-slate-500 text-sm">Manage your secure assets and digital identity.</p>
            </div>
            <button className="bg-[#0A4AEF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2 shadow-sm transition-colors text-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              Add New Item
            </button>
          </div>

          {/* LOADER & ERROR */}
          {loading && <div className="text-slate-500 py-10 font-medium">Loading your secure vault...</div>}
          {error && <div className="text-red-500 py-10 font-medium">Oops, an error occurred: {error}</div>}

          {/* VAULT GRID */}
          {!loading && vaultItems && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              
              {/* ADD NEW CARD placeholder */}
              <div className="h-[240px] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100/50 cursor-pointer transition-colors">
                <div className="w-12 h-12 bg-[#F4F7FB] rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-slate-500" />
                </div>
                <span className="font-medium text-sm">Add New Item</span>
              </div>

              {/* MAPPED ITEMS */}
              {filteredItems.length === 0 && searchQuery !== '' && (
                <div className="col-span-full py-10 mt-2 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
                  No items match your search.
                </div>
              )}
              {filteredItems.map((item) => (
                <div key={item.vaultitem_id} className="h-[240px] bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative group hover:shadow-md transition-shadow">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getCardColor(item.e_title)}`}>
                        {getInitials(item.e_title)}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{item.e_title}</h3>
                    <p className="text-slate-400 text-sm truncate">{item.e_username || 'No username set'}</p>
                  </div>

                  <div className="flex-1"></div>

                  <div className="flex justify-between items-center mt-4">
                    <button 
                      onClick={() => handleCopyPassword(item.e_password)}
                      className="bg-blue-50 text-[#0A4AEF] px-4 py-1.5 rounded-md text-xs font-bold tracking-wide flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button 
                      onClick={() => handleDelete(item.vaultitem_id)}
                      className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-2 -mr-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
