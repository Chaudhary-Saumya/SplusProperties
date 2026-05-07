export const getImageUrl = (url, transformations = 'f_auto,q_auto') => {
    if (!url) return '';
    
    // If the URL is already absolute (Cloudinary)
    if (url.startsWith('http')) {
        // Apply Cloudinary transformations if it's a cloudinary URL
        if (url.includes('cloudinary.com')) {
            // Check if transformations already exist in URL
            if (url.includes('/upload/v')) {
                return url.replace('/upload/', `/upload/${transformations}/`);
            }
        }
        return url;
    }
    
    // For legacy images stored locally, prepend the backend URL
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
