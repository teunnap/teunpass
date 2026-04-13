import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import ConfirmDialog from '../components/ConfirmDialog';
import ItemForm from '../components/ItemForm';

export default function Vault() {
  const navigate = useNavigate();
  const token = auth.getToken();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const data = await api.listItems(token);
      setItems(data);
    } catch {
      setError('Failed to load vault');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    await api.deleteItem(deleteId, token);
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  }

  function handleEdit(item) {
    setEditItem(item);
    setShowForm(true);
  }

  async function handleSave(formData) {
    if (editItem) {
      const updated = await api.updateItem(editItem.id, formData, token);
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? updated : i)));
    } else {
      const created = await api.createItem(formData, token);
      setItems((prev) => [...prev, created]);
    }
    setShowForm(false);
    setEditItem(null);
  }

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.username ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600">teunpass</h1>
        <button
          onClick={() => { auth.clear(); navigate('/login'); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            + Add item
          </button>
        </div>

        {/* State displays */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {loading && <p className="text-gray-400 text-sm">Loading…</p>}

        {/* Item list */}
        {!loading && filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-16">
            {items.length === 0 ? 'Your vault is empty. Add your first item!' : 'No results.'}
          </p>
        )}

        <ul className="space-y-3">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4 hover:border-indigo-300 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.name}</p>
                {item.username && (
                  <p className="text-sm text-gray-400 truncate">{item.username}</p>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline truncate"
                  >
                    {item.url}
                  </a>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="text-xs text-red-500 hover:text-red-700 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* Add / Edit modal */}
      {showForm && (
        <ItemForm
          initial={editItem}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {/* Confirm delete dialog */}
      {deleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this item? This cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
