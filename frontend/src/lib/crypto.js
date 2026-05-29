/**
 * Derives the Master Key (K) using PBKDF2 with the user's password and email as salt.
 */
export async function deriveMasterKey(password, email) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );
    
    const masterKeyBuffer = await window.crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: enc.encode(email.toLowerCase().trim()),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    
    return masterKeyBuffer;
}

/**
 * Generates the Authentication Hash (A) to send to the server.
 * This is computed by hashing the Master Key (K) + server auth_salt.
 */
export async function generateAuthenticationHash(masterKeyBuffer, authSaltHex = null) {
    const enc = new TextEncoder();
    let dataToHash = new Uint8Array(masterKeyBuffer);
    
    if (authSaltHex) {
        // Convert hex to bytes
        const saltBytes = new Uint8Array(authSaltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const combined = new Uint8Array(dataToHash.length + saltBytes.length);
        combined.set(dataToHash);
        combined.set(saltBytes, dataToHash.length);
        dataToHash = combined;
    }

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataToHash);
    
    // Convert to hex
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}

export function bufferToHex(buffer) {
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
