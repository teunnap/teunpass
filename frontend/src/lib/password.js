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
