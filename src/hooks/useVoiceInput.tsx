import { useState, useCallback, useRef } from 'react';
import { categorizeItem, CategoryType } from '@/lib/groceryCategories';
import { toast } from 'sonner';

interface UseVoiceInputProps {
  onAddItem: (name: string, category: CategoryType, quantity?: string) => void;
}

export function useVoiceInput({ onAddItem }: UseVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const parseAndAddItems = useCallback((text: string) => {
    if (!text.trim()) return;

    // Split by commas, "and", "&", or newlines
    const rawItems = text
      .split(/,|\band\b|&|\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let addedCount = 0;
    for (const item of rawItems) {
      // Try to extract quantity like "2 milk" or "three eggs"
      const quantityMatch = item.match(/^(\d+)\s+(.+)$/);
      if (quantityMatch) {
        const quantity = quantityMatch[1];
        const name = quantityMatch[2];
        const category = categorizeItem(name);
        onAddItem(name, category, quantity);
      } else {
        const category = categorizeItem(item);
        onAddItem(item, category);
      }
      addedCount++;
    }

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} item${addedCount > 1 ? 's' : ''} via voice`);
    }
  }, [onAddItem]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Voice input is not supported in this browser');
      return;
    }

    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        parseAndAddItems(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.');
      } else if (event.error !== 'aborted') {
        toast.error('Voice recognition failed. Please try again.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, parseAndAddItems]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    toggleListening,
  };
}
