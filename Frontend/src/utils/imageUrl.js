export const getImageUrl = (url) => {
    if (!url) return '';
    
    // If the URL is already absolute (Cloudinary), return it as is
    if (url.startsWith('http')) {
        return url;
    }
    
    // For legacy images stored locally, prepend the backend URL
    const BASE_URL = 'http://localhost:5000';
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
