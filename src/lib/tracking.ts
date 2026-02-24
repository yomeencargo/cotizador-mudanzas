/**
 * Utility functions for sending tracking events to Meta Pixel and Google Tag Manager.
 */

export const trackEvent = (eventName: string, data: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return

    // 1. Meta Pixel
    if (window.fbq) {
        if (['ViewContent', 'Search', 'AddToCart', 'AddToWishlist', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Lead', 'CompleteRegistration'].includes(eventName)) {
            // Standard events
            window.fbq('track', eventName, data)
        } else {
            // Custom events
            window.fbq('trackCustom', eventName, data)
        }
    }

    // 2. Google Tag Manager (DataLayer)
    const win = window as any
    win.dataLayer = win.dataLayer || []
    win.dataLayer.push({
        event: eventName,
        ...data
    })
}

// Type definitions to add to global scope
declare global {
    interface Window {
        fbq: any
        _fbq: any
    }
}
