import React, { useState } from 'react';
import { Lock, Mail, Key, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { deriveMasterKey, generateAuthenticationHash } from '../lib/crypto';
import Notification from './Notification';
import { apiFetch } from '../lib/api';

const validatePassword = (password) => {
  if (password.length < 12) return 'Master password must be at least 12 characters long';
  if (!/[A-Z]/.test(password)) return 'Master password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Master password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Master password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Master password must contain at least one special character';
  return null;
};

function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const { notification, showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }

    if (!isLogin) {
      if (!recoveryAcknowledged) {
        showNotification('Please confirm that you understand there is no password recovery', 'warning');
        return;
      }
      const passwordError = validatePassword(password);
      if (passwordError) {
        showNotification(passwordError, 'warning');
        return;
      }
    }

    setIsLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const masterKeyBuffer = await deriveMasterKey(password, normalizedEmail);
      
      if (isLogin) {
        const saltRes = await apiFetch('/auth/salt', {
          method: 'POST',
          body: JSON.stringify({ email: normalizedEmail })
        });
        
        if (!saltRes.ok) {
          throw new Error('Invalid credentials or user not found');
        }
        
        const { auth_salt } = await saltRes.json();
        
        const authHash = await generateAuthenticationHash(masterKeyBuffer, auth_salt);
        
        const loginRes = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ 
            email: normalizedEmail,
            authentication_hash: authHash
          })
        });
        
        if (!loginRes.ok) {
          throw new Error('Invalid credentials');
        }
        
        const data = await loginRes.json();
        
        sessionStorage.setItem('token', data.access_token);
        
        showNotification('Login successful!', 'success');
        
        if (onLoginSuccess) {
          onLoginSuccess(data.access_token, masterKeyBuffer);
        }
        
      } else {
        const randomBytes = new Uint8Array(32);
        window.crypto.getRandomValues(randomBytes);
        const authSaltHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

        const authHash = await generateAuthenticationHash(masterKeyBuffer, authSaltHex);
        
        const regRes = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: normalizedEmail,
            authentication_hash: authHash,
            auth_salt: authSaltHex
          })
        });
        
        if (!regRes.ok) {
          const errData = await regRes.json();
          throw new Error(errData.detail || 'Registration failed');
        }
        
        showNotification('Registration successful! You can now log in.', 'success');
        setIsLogin(true);
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4 relative overflow-hidden">
      <Notification notification={notification} />
      
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          <div className="p-8 sm:p-10">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-center text-slate-800 mb-2">
              Teunpass
            </h2>
            <p className="text-center text-slate-500 mb-8 font-medium">
              Zero-knowledge architecture. Your secrets, completely yours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl px-11 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Master Password</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl px-11 py-3.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="Enter your master password"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-4 shadow-sm hover:bg-amber-100/50 transition-colors">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="recovery-acknowledgement"
                      type="checkbox"
                      checked={recoveryAcknowledged}
                      onChange={(e) => setRecoveryAcknowledged(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-white border-amber-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="recovery-acknowledgement" className="text-sm text-amber-800 cursor-pointer select-none">
                    <span className="font-bold block mb-0.5">I understand there is no password recovery</span>
                    <span className="leading-snug block">Due to the zero-knowledge architecture, it is <strong>impossible</strong> to recover my master password if I forget it.</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-4"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    {isLogin ? 'Unlock Vault' : 'Create Vault'}
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
            <p className="text-slate-600 font-medium">
              {isLogin ? "Don't have a vault yet?" : "Already have a vault?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  if (isLogin) setRecoveryAcknowledged(false);
                }}
                className="ml-2 text-blue-600 hover:text-blue-800 font-bold hover:underline transition-colors focus:outline-none"
              >
                {isLogin ? 'Register now' : 'Login instead'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
