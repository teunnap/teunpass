import { calculatePasswordStrength } from '../lib/password';

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  
  const strength = calculatePasswordStrength(password);
  
  return (
    <div className="flex flex-col gap-1.5 mt-2 mb-1 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password Strength</span>
        <span className={`text-xs font-bold ${strength.label === 'Strong' ? 'text-green-600' : strength.label === 'Good' ? 'text-blue-600' : strength.label === 'Fair' ? 'text-yellow-600' : 'text-red-600'}`}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div 
          className={`h-full ${strength.color} transition-all duration-300 ease-out ${strength.width}`}
        ></div>
      </div>
    </div>
  );
}
