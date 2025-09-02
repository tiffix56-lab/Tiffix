export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('91')) {
    return cleaned;
  }
  
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  return cleaned;
};

export const formatPhoneDisplay = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const number = cleaned.substring(2);
    return number.replace(/(\d{3})(\d{3})(\d{4})/, '+91 $1 $2 $3');
  }
  
  return phoneNumber;
};

export const validateAndFormatPhone = (phone: string): { isValid: boolean; formatted: string; error?: string } => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) {
    return { isValid: false, formatted: '', error: 'Phone number is required' };
  }
  
  if (cleaned.length === 10) {
    return { isValid: true, formatted: `91${cleaned}` };
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return { isValid: true, formatted: cleaned };
  }
  
  return { isValid: false, formatted: cleaned, error: 'Please enter a valid 10-digit phone number' };
};

export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  const visibleChars = Math.max(2, Math.floor(localPart.length * 0.3));
  const maskedPart = '*'.repeat(localPart.length - visibleChars);
  return `${localPart.substring(0, visibleChars)}${maskedPart}@${domain}`;
};

export const maskPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const number = cleaned.substring(2);
    return `+91 ***-***-${number.substring(6)}`;
  }
  if (cleaned.length === 10) {
    return `***-***-${cleaned.substring(6)}`;
  }
  return phoneNumber;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

export const formatName = (name: string): string => {
  return capitalizeWords(name.trim());
};

export const extractInitials = (name: string): string => {
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.map(word => word[0]).join('').substring(0, 2).toUpperCase();
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'%;()&+]/g, '');
};

export const formatOTP = (otp: string): string => {
  return otp.replace(/\D/g, '').substring(0, 6);
};

export const isValidOTPFormat = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};