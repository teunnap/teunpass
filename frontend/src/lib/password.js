export function generatePassword(length = 16, options = { uppercase: true, lowercase: true, numbers: true, symbols: true }) {
  const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
  };

  let chars = '';
  if (options.uppercase) chars += charSets.uppercase;
  if (options.lowercase) chars += charSets.lowercase;
  if (options.numbers) chars += charSets.numbers;
  if (options.symbols) chars += charSets.symbols;

  if (chars === '') {
    chars = charSets.lowercase + charSets.numbers; // fallback
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  return password;
}

export function calculatePasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'bg-slate-200', width: 'w-0' };
  
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Score mapping (max 6)
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
  if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-400', width: 'w-2/4' };
  if (score === 5) return { score, label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
  return { score, label: 'Strong', color: 'bg-green-500', width: 'w-full' };
}
