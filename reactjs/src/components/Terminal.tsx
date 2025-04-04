import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from 'xterm-addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalComponentProps {
  onData: (data: string) => void;
  getTerminalInstance?: (terminal: Terminal) => void;
}

export default function TerminalComponent({ 
  onData, 
  getTerminalInstance 
}: TerminalComponentProps) {
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize terminal with custom styling
    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: '"Menlo", Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#111827',
        foreground: '#e2e8f0',
      },
    });

    terminalRef.current = terminal;

    // Load fit addon
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);
    
    // Open terminal in container
    terminal.open(containerRef.current);
    
    // Set up data handler
    terminal.onData(onData);

    // IMPORTANT: Share terminal instance with parent component
    // This needs to happen before attempting to fit the terminal
    if (getTerminalInstance) {
      getTerminalInstance(terminal);
    }
    
    // Now fit the terminal after sharing the instance
    try {
      fitAddon.fit();
    } catch (e) {
      console.error("Error fitting terminal:", e);
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      } catch (e) {
        console.error("Error fitting terminal on resize:", e);
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}