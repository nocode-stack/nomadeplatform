
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const IntroVideo = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, isLoading } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [showUniverseText, setShowUniverseText] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !user) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated, user, isLoading, navigate]);

    const handleVideoReady = () => {
        setIsVideoLoaded(true);
        setShowUniverseText(true);

        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.error("Autoplay blocked or failed:", error);
            });
        }
    };

    const handleVideoEnd = () => {
        document.body.style.overflow = 'hidden';
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-white z-[10000] animate-fade-in transition-opacity duration-1000';
        document.body.appendChild(overlay);

        setTimeout(() => {
            navigate('/');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                document.body.style.overflow = '';
            }, 500);
        }, 1000);
    };

    const universeText = "BIENVENIDO A NOMADE";
    const letters = universeText.split("");

    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center overflow-hidden font-sans p-4 sm:p-6 md:p-8">

            {/* Container Principal - Ajustado para elevar el contenido */}
            <div className="relative flex flex-col items-center w-full max-w-[95vw] lg:max-w-[80vw] xl:max-w-5xl 2xl:max-w-6xl -translate-y-4 md:-translate-y-8">

                {/* Video Container - Proporción equilibrada */}
                <div className={`relative w-full aspect-video rounded-[1.5rem] sm:rounded-[2.2rem] md:rounded-[2.8rem] overflow-hidden shadow-[0_25px_55px_-15px_rgba(0,0,0,0.12)] transition-all duration-[1500ms] ease-out z-10 ${isVideoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        playsInline
                        onLoadedData={handleVideoReady}
                        onEnded={handleVideoEnd}
                    >
                        <source src="/lovable-uploads/Video-Neo-Homepage-1.mp4" type="video/mp4" />
                    </video>
                </div>

                {/* Universe Text - ÉPICO debajo del video */}
                <div
                    className={`mt-6 sm:mt-8 md:mt-10 flex flex-col items-center transition-all duration-1000 ${showUniverseText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <div className="flex flex-nowrap justify-center px-2 md:px-0 text-center whitespace-nowrap w-full">
                        {letters.map((char, index) => (
                            <span
                                key={index}
                                className={`inline-block font-black uppercase transition-all duration-700 ease-out ${showUniverseText ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${index < 10 ? 'text-primary' : 'text-gray-900'}`}
                                style={{
                                    fontSize: 'clamp(14px, 4.4vw, 56px)',
                                    transitionDelay: `${index * 40}ms`,
                                    marginRight: char === " " ? "0.4em" : "0",
                                    letterSpacing: '0.15em'
                                }}
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                    {/* Línea decorativa */}
                    <div className={`mt-4 sm:mt-6 h-[1.5px] sm:h-[2px] bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)] transition-all duration-[1500ms] delay-1000 ${showUniverseText ? 'w-16 sm:w-24 md:w-32 opacity-100' : 'w-0 opacity-0'}`}></div>
                </div>
            </div>

            {/* Loading state sutil */}
            {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
                    <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            )}

            <style>{`
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1s forwards;
        }
      `}</style>
        </div>
    );
};

export default IntroVideo;
