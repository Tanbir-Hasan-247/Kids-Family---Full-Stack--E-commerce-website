// Helper to map parent categories to their official client avatars
export const getCategoryAvatarSource = (slug = '', name = '') => {
  const s = String(slug || '').toLowerCase();
  const n = String(name || '').toLowerCase();

  // Woman check first because "man" is a substring of "woman"
  if (
    s.includes('woman') ||
    s.includes('women') ||
    n.includes('woman') ||
    n.includes('women') ||
    n.includes('মহিলা') ||
    n.includes('নারী')
  ) {
    return require('../../assets/avatars/woman.png');
  }
  if (
    s.includes('man') ||
    s.includes('men') ||
    n.includes('man') ||
    n.includes('men') ||
    n.includes('পুরুষ')
  ) {
    return require('../../assets/avatars/man.png');
  }
  if (
    s.includes('girl') ||
    n.includes('girl') ||
    n.includes('মেয়ে') ||
    n.includes('মেয়ে') ||
    n.includes('কন্যা')
  ) {
    return require('../../assets/avatars/girl.png');
  }
  if (
    s.includes('boy') ||
    n.includes('boy') ||
    n.includes('ছেলে') ||
    n.includes('পুত্র')
  ) {
    return require('../../assets/avatars/boy.png');
  }
  if (
    s.includes('family') ||
    n.includes('family') ||
    s.includes('matching') ||
    n.includes('ম্যাচিং') ||
    n.includes('পরিবার')
  ) {
    return require('../../assets/avatars/family.png');
  }
  return null;
};

