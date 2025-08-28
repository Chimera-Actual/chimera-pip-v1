import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const bootMessages = [
  "CHIMERA INDUSTRIES UNIFIED OPERATING SYSTEM",
  "COPYRIGHT 2088-2090 CHIMERA INDUSTRIES",
  "-Terminal Node 001-",
  "",
  "POST: Power-On Self Test.................[OK]",
  "CPU: Quantum Processing Unit 3.2 GHz.....[OK]",
  "RAM: Neural Memory Banks 64GB.............[OK]",
  "Storage: Quantum SSD 2TB..................[OK]",
  "",
  "Loading BIOS v4.7.2......................[OK]",
  "Initializing neural pathways.............[OK]",
  "Scanning for hardware changes............[OK]",
  "Loading device drivers...................[OK]",
  "",
  "Starting ChimeraPip OS v3.1.5............[OK]",
  "Loading kernel modules...................[OK]",
  "Mounting file systems....................[OK]",
  "Starting network services................[OK]",
  "Loading security protocols...............[OK]",
  "Initializing user interface..............[OK]",
  "",
  "All systems operational.",
  "Welcome to ChimeraPip 3000 Mark V",
  "",
  "System ready for user input."
];

export const BootSequence: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const { completeBootSequence } = useAuth();

  useEffect(() => {
    if (currentMessageIndex >= bootMessages.length) {
      console.log('Boot sequence complete - calling completeBootSequence');
      completeBootSequence();
      return;
    }

    const currentMessage = bootMessages[currentMessageIndex];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex <= currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          if (currentMessageIndex < bootMessages.length - 1) {
            setCurrentMessageIndex(prev => prev + 1);
            setDisplayedText('');
          } else {
            setIsTyping(false);
            console.log('Finished typing last message - calling completeBootSequence');
            completeBootSequence(); // Go directly to main app
          }
        }, 100);
      }
    }, 8);

    return () => clearInterval(typeInterval);
  }, [currentMessageIndex]);

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center crt-screen">
      <div className="max-w-2xl p-8">
        <div className="space-y-2 font-mono text-sm crt-glow">
          {bootMessages.slice(0, currentMessageIndex).map((message, index) => (
            <div key={index} className="text-foreground">
              {message || '\u00A0'}
            </div>
          ))}
          
          {currentMessageIndex < bootMessages.length && (
            <div className="text-foreground">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse">
                  █
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};