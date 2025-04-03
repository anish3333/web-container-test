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

    // Initialize terminal
    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e293b',
        foreground: '#f8fafc',
      },
    });

    terminalRef.current = terminal;

    // Load fit addon
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);
    
    // Open terminal in container and fit it
    terminal.open(containerRef.current);
    try {
      fitAddon.fit();
    } catch (e) {
      console.error("Error fitting terminal:", e);
    }

    // Set up data handler
    terminal.onData(onData);

    // Share terminal instance with parent component
    if (getTerminalInstance) {
      getTerminalInstance(terminal);
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error("Error fitting terminal on resize:", e);
      }
    });
    
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}