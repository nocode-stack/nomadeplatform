/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';

// Declaration for the custom element to avoid TS errors
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': any;
        }
    }
}

const Van3DHeader = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile && window.innerWidth < 400) return null;

    return (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-[1] flex items-end overflow-hidden h-28">
            <div
                className="relative w-full h-16 flex items-center mb-[-8px]"
                style={{
                    animation: 'van-drive 30s linear infinite'
                }}
            >
                <div
                    className="w-16 h-16 md:w-20 md:h-20 opacity-90"
                    style={{
                        animation: 'van-rocking 0.8s ease-in-out infinite alternate',
                        transformOrigin: 'bottom center'
                    }}
                >
                    <model-viewer
                        src="/lovable-uploads/Meshy_AI_Nomade_Nation_Van_0217103138_texture.glb"
                        alt="Nomade Nation Van"
                        camera-orbit="90deg 85deg auto"
                        field-of-view="25deg"
                        camera-controls={false}
                        interaction-prompt="none"
                        shadow-intensity="1.5"
                        environment-image="neutral"
                        exposure="1.3"
                        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                    ></model-viewer>
                </div>
            </div>

            <style>{`
        @keyframes van-drive {
          0% { transform: translateX(-120px); }
          100% { transform: translateX(calc(100vw + 120px)); }
        }
        @keyframes van-rocking {
          0% { transform: rotate(0deg) translateY(0px); }
          100% { transform: rotate(1deg) translateY(-2px); }
        }
      `}</style>
        </div>
    );
};

export default Van3DHeader;
