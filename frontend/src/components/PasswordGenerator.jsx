import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { generatePassword } from '../lib/password';
import { useNotification } from '../hooks/useNotification';
import Notification from './Notification';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const { notification, showNotification } = useNotification();
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const pwd = generatePassword(length, options);
    setPassword(pwd);
    setCopied(false);
  };

  useEffect(() => {
    generate();
  }, [length, options]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      showNotification('Password copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showNotification('Failed to copy', 'error');
    }
  };

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Notification notification={notification} />
      <div className="max-w-3xl mx-auto w-full px-8 pb-12 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Password Generator</h2>
          <p className="text-slate-500 text-sm">Create strong, secure, and random passwords.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-8">
          {/* Password Display */}
          <div className="relative">
            <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-6 py-5 pr-28 text-2xl font-mono text-center text-slate-800 break-all selection:bg-blue-200">
              {password}
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                onClick={handleCopy}
                className="p-2.5 bg-blue-50 text-[#0A4AEF] rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A4AEF] cursor-pointer"
                title="Copy to clipboard"
                aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={generate}
                className="p-2.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                title="Regenerate"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Length Slider */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Password Length</label>
                <span className="text-xl font-bold text-[#0A4AEF]">{length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0A4AEF]"
              />
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3">
              <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-1">Characters Used</label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={options.uppercase} onChange={() => toggleOption('uppercase')} className="w-5 h-5 rounded border-slate-300 text-[#0A4AEF] focus:ring-[#0A4AEF] cursor-pointer" />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Uppercase (A-Z)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={options.lowercase} onChange={() => toggleOption('lowercase')} className="w-5 h-5 rounded border-slate-300 text-[#0A4AEF] focus:ring-[#0A4AEF] cursor-pointer" />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Lowercase (a-z)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={options.numbers} onChange={() => toggleOption('numbers')} className="w-5 h-5 rounded border-slate-300 text-[#0A4AEF] focus:ring-[#0A4AEF] cursor-pointer" />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Numbers (0-9)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={options.symbols} onChange={() => toggleOption('symbols')} className="w-5 h-5 rounded border-slate-300 text-[#0A4AEF] focus:ring-[#0A4AEF] cursor-pointer" />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Symbols (!@#$)</span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            className="w-full py-4 mt-4 bg-[#0A4AEF] hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A4AEF] cursor-pointer"
          >
            Generate Password
          </button>
        </div>
      </div>
    </>
  );
}
