import { Capacitor } from '@capacitor/core';

export const getWebsiteBaseUrl = () => {
    return Capacitor.isNativePlatform() 
        ? 'https://properties.kharsan.com' 
        : window.location.origin;
};
