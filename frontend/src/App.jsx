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
  Pencil,
  LogOut,
  Star,
  Zap
} from 'lucide-react';
import Notification from './components/Notification';
import { useNotification } from './hooks/useNotification';
import AddVaultItemModal from './components/AddVaultItemModal';
import Login from './components/Login';
import PasswordGenerator from './components/PasswordGenerator';
import { apiFetch } from './lib/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState(null);
  const [vaultItems, setVaultItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { notification, showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [currentView, setCurrentView] = useState('vault');

  const openCreateModal = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleItemSaved = (savedItem) => {
    if (editingItem) {
      setVaultItems(prev => prev.map(item => item.vaultitem_id === savedItem.vaultitem_id ? savedItem : item));
      showNotification('Item updated successfully!', 'success');
    } else {
      setVaultItems(prev => [...(prev || []), savedItem]);
      showNotification('Item added to vault!', 'success');
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const fetchVaultItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/vaultitems/');
      if (!response.ok) {
        if (response.status === 401) {
            setIsAuthenticated(false);
            sessionStorage.removeItem('token');
            throw new Error('Authentication required');
        }
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
    const token = sessionStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVaultItems();
      const fetchUser = async () => {
        try {
          const response = await apiFetch('/auth/me');
          if (!response.ok) {
            setIsPremium(false);
            if (response.status === 401) {
              setIsAuthenticated(false);
              sessionStorage.removeItem('token');
              throw new Error('Authentication required');
            }
            throw new Error('Failed to fetch user');
          }

          const data = await response.json();
          setIsPremium(data.role === 'premium');
        } catch (err) {
          setIsPremium(false);
          console.error('Failed to fetch user:', err);
        }
      };
      fetchUser();
    } else {
      setIsPremium(false);
    }
  }, [isAuthenticated]);

  const handleDelete = async (itemId) => {
    try {
      const response = await apiFetch(`/vaultitems/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setVaultItems((prev) => prev.filter(item => item.vaultitem_id !== itemId));
      
      showNotification('Item has been deleted', 'success');
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
      console.error(err);
    }
  };

  const handleCopyPassword = async (password) => {
    try {
      if (password) {
        await navigator.clipboard.writeText(password);
        showNotification('Password copied to clipboard!', 'success');
      } else {
        showNotification('No password to copy!', 'warning');
      }
    } catch (err) {
      showNotification('Failed to copy text', 'error');
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

  const handleLoginSuccess = (token, mKeyBuffer) => {
    setIsAuthenticated(true);
    setMasterKey(mKeyBuffer);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMasterKey(null);
    setVaultItems(null);
    sessionStorage.removeItem('token');
    setShowProfileDropdown(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] font-sans text-slate-800">
      
      <Notification notification={notification} />

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

        <nav className="px-4 flex flex-col gap-1">
          <div 
            onClick={() => setCurrentView('vault')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${currentView === 'vault' ? 'bg-blue-50 text-[#0A4AEF]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm">All Items</span>
          </div>
          <div 
            onClick={() => setCurrentView('generator')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${currentView === 'generator' ? 'bg-blue-50 text-[#0A4AEF]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm">Password Generator</span>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col">
        
        {/* TOP HEADER */}
        <header className="h-16 flex items-center justify-end px-8 gap-5" role="banner">
            <button 
              aria-label={isPremium ? "Downgrade to Standard" : "Upgrade to Premium"} 
              onClick={async () => {
                if (!isPremium) {
                  try {
                    const res = await apiFetch('/auth/me/setrole', { 
                      method: 'PUT',
                      body: JSON.stringify({ role: 'premium' })
                    });
                    if (res.ok) {
                      setIsPremium(true);
                      showNotification('You have been upgraded to premium!', 'success');
                    } else {
                      showNotification('Failed to upgrade to premium', 'error');
                    }
                  } catch (err) {
                    showNotification('An error occurred during upgrade', 'error');
                    console.error(err);
                  }
                } else {
                  try {
                    const res = await apiFetch('/auth/me/setrole', { 
                      method: 'PUT',
                      body: JSON.stringify({ role: 'default' })
                    });
                    if (res.ok) {
                      setIsPremium(false);
                      showNotification('You have been downgraded to standard.', 'success');
                    } else {
                      const errData = await res.json().catch(() => ({}));
                      showNotification(errData.detail || 'Failed to downgrade', 'error');
                    }
                  } catch (err) {
                    showNotification('An error occurred during downgrade', 'error');
                    console.error(err);
                  }
                }
              }}
              className={`${isPremium ? 'text-yellow-400 hover:text-yellow-500' : 'text-slate-400 hover:text-yellow-400'} cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A4AEF] rounded transition-colors`}
              title={isPremium ? "Downgrade to Standard" : "Upgrade to Premium"}
            >
              <Star className={`w-5 h-5 ${isPremium ? 'fill-current' : ''}`} aria-hidden="true" />
            </button>
            <button aria-label="Refresh Vault Items" onClick={fetchVaultItems} className="text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A4AEF] rounded">
              <RefreshCw className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-8 h-8 rounded-full bg-[#0A4AEF] flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A4AEF]"
                title="Profile"
                aria-label="User Profile Menu"
                aria-haspopup="true"
                aria-expanded={showProfileDropdown}
              >
                  <UserIcon className="w-5 h-5" aria-hidden="true" />
              </button>

              {showProfileDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProfileDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
        </header>

        {currentView === 'vault' ? (
          <div className="max-w-6xl w-full mx-auto px-8 pb-12">
          
          {/* SEARCH BAR */}
          <div className="mt-4 mb-14">
            <div className="relative max-w-2xl mx-auto flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4" aria-hidden="true" />
              <input 
                id="search-logins"
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your logins..." 
                aria-label="Search your logins"
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
            <button
              onClick={openCreateModal}
              aria-label="Add New Vault Item"
              className="bg-[#0A4AEF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2 shadow-sm transition-colors text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A4AEF]">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add New Item
            </button>
          </div>

          {/* LOADER & ERROR */}
          {loading && <div role="status" aria-live="polite" className="text-slate-500 py-10 font-medium">Loading your secure vault...</div>}
          {error && <div role="alert" aria-live="assertive" className="text-red-500 py-10 font-medium">Oops, an error occurred: {error}</div>}

          {/* VAULT GRID */}
          {!loading && vaultItems && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              
              {/* ADD NEW CARD placeholder */}
              <button
                onClick={openCreateModal}
                aria-label="Add New Item Card"
                className="h-[240px] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A4AEF]">
                <div className="w-12 h-12 bg-[#F4F7FB] rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-slate-500" aria-hidden="true" />
                </div>
                <span className="font-medium text-sm">Add New Item</span>
              </button>

              {/* MAPPED ITEMS */}
              {filteredItems.length === 0 && searchQuery !== '' && (
                <div className="col-span-full py-10 mt-2 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
                  No items match your search.
                </div>
              )}
              {filteredItems.map((item) => (
                <div key={item.vaultitem_id} className="h-[240px] bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col relative group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                  
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
                      aria-label={`Copy password for ${item.e_title}`}
                      className="bg-blue-50 text-[#0A4AEF] px-4 py-1.5 rounded-md text-xs font-bold tracking-wide flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A4AEF]"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      Copy
                    </button>
                    <div className="flex items-center gap-1 -mr-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="text-slate-300 hover:text-[#0A4AEF] transition-colors cursor-pointer p-2 focus:outline-none focus:ring-2 focus:ring-[#0A4AEF] rounded"
                        title="Edit Item"
                        aria-label={`Edit ${item.e_title}`}
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.vaultitem_id)}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                        title="Delete Item"
                        aria-label={`Delete ${item.e_title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
        ) : (
          <PasswordGenerator />
        )}
      </main>
      {showModal && (
        <AddVaultItemModal
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSaved={handleItemSaved}
          initialData={editingItem}
          isPremium={isPremium}
        />
      )}
    </div>
  );
}

export default App;
