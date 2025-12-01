import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPWA: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg">
                        <Download size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">Install App</h3>
                        <p className="text-gray-400 text-xs">Add to Home Screen for better experience</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="p-2 text-gray-400 hover:text-white transition"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 transition"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
};
