import { useEffect, useState, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    }
  }, [isSupported, permission]);

  const notifyNewMessage = useCallback((senderName: string, messagePreview: string) => {
    sendNotification(`Nova mensagem de ${senderName}`, {
      body: messagePreview.slice(0, 100),
      tag: 'new-message',
    });
  }, [sendNotification]);

  const notifyNewFavorite = useCallback((adTitle: string) => {
    sendNotification('Novo favorito!', {
      body: `Alguém favoritou seu anúncio: ${adTitle}`,
      tag: 'new-favorite',
    });
  }, [sendNotification]);

  const notifyPriceChange = useCallback((category: string, price: string) => {
    sendNotification('Atualização de Preços', {
      body: `${category}: ${price}`,
      tag: 'price-change',
    });
  }, [sendNotification]);

  return { 
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyNewMessage,
    notifyNewFavorite,
    notifyPriceChange,
  };
}
