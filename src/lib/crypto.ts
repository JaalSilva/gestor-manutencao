import CryptoJS from 'crypto-js';

const SECRET_KEY = 'jw-hub-app-secret-key-change-me'; // Ideally this would be dynamic or derived

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
