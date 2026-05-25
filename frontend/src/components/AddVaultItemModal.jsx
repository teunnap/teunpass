import React, { useState } from 'react';
import { X, Eye, EyeOff, Zap } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { generatePassword } from '../lib/password';

const EMPTY_FORM    = { e_title: '', e_url: '', e_username: '', e_password: '' };
const EMPTY_TOUCHED = { e_title: false, e_url: false, e_password: false };

// --- Validation rules ---
const isValidUrl = (value) => {
  try {
    const parsedUrl = new URL(value.trim());
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const validate = (form) => ({
  e_title:    !form.e_title.trim()                     ? 'Name is required.' : null,
  e_url:      form.e_url && !isValidUrl(form.e_url)   ? 'Enter a valid URL (for example, https://example.com).' : null,
  e_password: !form.e_password                        ? 'Consider adding a password.' : null,  // warning, not blocking
});

// --- Helper to compute input border colour ---
const fieldClass = (base, error, touched, isWarning = false) => {
  if (!touched) return base;
  if (error && !isWarning) return base.replace('border-slate-200', 'border-red-400').replace('focus:border-[#0A4AEF]', 'focus:border-red-400');
  if (error && isWarning)  return base.replace('border-slate-200', 'border-yellow-400').replace('focus:border-[#0A4AEF]', 'focus:border-yellow-400');
  return base.replace('border-slate-200', 'border-green-400').replace('focus:border-[#0A4AEF]', 'focus:border-green-400');
};

const BASE_INPUT = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A4AEF]/20 focus:border-[#0A4AEF] transition-all";

const Field = ({ id, label, error, touched, warning, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    {children}
    {touched && error && !warning && <p role="alert" className="text-xs text-red-500">{error}</p>}
    {touched && error &&  warning  && <p role="status" className="text-xs text-yellow-600">{error}</p>}
  </div>
);

export default function AddVaultItemModal({ onClose, onSaved, initialData }) {
  const [form, setForm]       = useState(initialData ? {
    e_title: initialData.e_title || '',
    e_url: initialData.e_url || '',
    e_username: initialData.e_username || '',
    e_password: initialData.e_password || '',
  } : EMPTY_FORM);
  const [touched, setTouched] = useState(EMPTY_TOUCHED);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState(null);

  const errors = validate(form);

  const set   = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const touch = (field) => () => setTouched(prev => ({ ...prev, [field]: true }));

  const isBlocking = errors.e_title || errors.e_url;   // password warning doesn't block

  const handleSave = async () => {
    // Mark all fields as touched so errors show on submit
    setTouched({ e_title: true, e_url: true, e_password: true });
    if (isBlocking) return;

    setSaving(true);
    setApiError(null);
    try {
      const isEditing = !!initialData;
      const endpoint = isEditing ? `/vaultitems/${initialData.vaultitem_id}` : '/vaultitems/create';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await apiFetch(endpoint, {
        method: method,
        body: JSON.stringify({ ...form, custom_fields: initialData?.custom_fields ?? [] }),
      });
      if (!response.ok) throw new Error('Failed to save item.');
      onSaved(await response.json());
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
          <button
            onClick={onClose}
            aria-label="Close Dialog"
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          <h2 id="modal-title" className="text-2xl font-bold text-slate-900 mb-1">
            {initialData ? 'Edit Item' : 'Create New Item'}
          </h2>
          <p id="modal-desc" className="text-slate-500 text-sm">
            {initialData ? 'Update your secure credential data below.' : 'Store a new credential securely within your encrypted vault.'}
          </p>
        </div>

        {/* Form body */}
        <div className="px-8 py-6 flex flex-col gap-5">

          {/* Name + URL */}
          <div className="grid grid-cols-2 gap-4">
            <Field id="input-title" label="Name" error={errors.e_title} touched={touched.e_title}>
              <input
                id="input-title"
                className={fieldClass(BASE_INPUT, errors.e_title, touched.e_title)}
                placeholder="e.g. Personal Gmail"
                value={form.e_title}
                onChange={set('e_title')}
                onBlur={touch('e_title')}
              />
            </Field>
            <Field id="input-url" label="URL" error={errors.e_url} touched={touched.e_url}>
              <input
                id="input-url"
                className={fieldClass(BASE_INPUT, errors.e_url, touched.e_url)}
                placeholder="https://example.com"
                value={form.e_url}
                onChange={set('e_url')}
                onBlur={touch('e_url')}
              />
            </Field>
          </div>

          {/* Username — no validation needed */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="input-username" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username / Email</label>
            <input
              id="input-username"
              className={BASE_INPUT}
              placeholder="user@email.com"
              value={form.e_username}
              onChange={set('e_username')}
            />
          </div>

          {/* Password */}
          <Field id="input-password" label="Password" error={errors.e_password} touched={touched.e_password} warning>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${fieldClass(BASE_INPUT, errors.e_password, touched.e_password, true)} pr-10`}
                  placeholder="Enter password"
                  value={form.e_password}
                  onChange={set('e_password')}
                  onBlur={touch('e_password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const pwd = generatePassword(16, { uppercase: true, lowercase: true, numbers: true, symbols: true });
                  setForm(prev => ({ ...prev, e_password: pwd }));
                  setShowPassword(true);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#0A4AEF] text-sm font-medium hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A4AEF] cursor-pointer"
                title="Generate Strong Password"
                aria-label="Generate Strong Password"
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
                Generate
              </button>
            </div>
          </Field>

          {apiError && <p role="alert" className="text-red-500 text-sm">{apiError}</p>}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            aria-busy={saving}
            className="px-6 py-2.5 rounded-xl bg-[#0A4AEF] hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A4AEF]"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
