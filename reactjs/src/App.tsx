
import { useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { files } from "./lib/files";
import FileViewer from "./components/FileViewer";
import TerminalComponent from "./components/Terminal";
import Preview from "./components/Preview";
import FileEditor from "./components/FileEditor";

export default function App() {
  const [currentFile, setCurrentFile] = useState("index.js");
  const [fileSystem, setFileSystem] = useState(files);
  const [iframeUrl, setIframeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const webContainerInstance = useRef<WebContainer | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const shellProcessRef = useRef<any>(null);
  const writerRef = useRef<any>(null);

  useEffect(() => {
    const initializeWebContainer = async () => {
      if (!terminalRef.current) return;
      
      try {
        setIsLoading(true);
        
        // Boot WebContainer
        webContainerInstance.current = await WebContainer.boot();
        console.log("WebContainer booted successfully");

        // Mount the file system
        await webContainerInstance.current.mount(fileSystem);
        console.log("File system mounted");

        // Listen for server-ready event
        webContainerInstance.current.on("server-ready", (port, url) => {
          console.log(`Server ready on port ${port} at ${url}`);
          setIframeUrl(url);
        });

        // Start the shell
        await startShell();
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing WebContainer:", error);
        setIsLoading(false);
      }
    };

    if (terminalRef.current) {
      initializeWebContainer();
    }

    return () => {
      // Clean up by releasing the writer if it exists
      if (writerRef.current) {
        try {
          writerRef.current.releaseLock();
        } catch (e) {
          console.error("Error releasing writer lock:", e);
        }
      }
      
      if (shellProcessRef.current) {
        try {
          shellProcessRef.current.kill();
        } catch (error) {
          console.error("Error killing shell process:", error);
        }
      }
      
      if (webContainerInstance.current) {
        try {
          webContainerInstance.current.teardown();
        } catch (error) {
          console.error("Error tearing down WebContainer:", error);
        }
      }
    };
  }, [terminalRef.current]);

  const startShell = async () => {
    if (!webContainerInstance.current || !terminalRef.current) {
      console.error("WebContainer or terminal not initialized");
      return;
    }

    try {
      // Spawn the shell process
      const shellProcess = await webContainerInstance.current.spawn('jsh', {
        terminal: {
          cols: terminalRef.current.cols,
          rows: terminalRef.current.rows,
        }
      });
      shellProcessRef.current = shellProcess;
      
      // Pipe shell output directly to terminal
      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            if (terminalRef.current) {
              terminalRef.current.write(data);
            }
          },
        })
      );
      
      // CRITICAL: Store the writer in the ref so we can reuse it
      writerRef.current = shellProcess.input.getWriter();
      
      // Write initial commands with delay
      setTimeout(() => {
        if (writerRef.current) {
          writerRef.current.write("npm install && npm run start\n");
        }
      }, 1000);
      
      console.log("Shell process started and connected to terminal");
      return shellProcess;
    } catch (error) {
      console.error("Shell error:", error);
      return null;
    }
  };

  const handleTerminalData = (data: string) => {
    if (!writerRef.current) {
      console.warn("Shell writer not initialized");
      return;
    }
    
    try {
      // Use the stored writer reference
      writerRef.current.write(data);
    } catch (error) {
      console.error("Error writing to shell:", error);
    }
  };
  
  const handleFileChange = async (path: string, content: string) => {
    if (!webContainerInstance.current) return;

    try {
      // Update the file system state
      setFileSystem((prev) => ({
        ...prev,
        [path]: { file: { contents: content } },
      }));

      // Write to the WebContainer file system
      await webContainerInstance.current.fs.writeFile(path, content);
    } catch (error) {
      console.error(`Error updating file ${path}:`, error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-800 text-slate-100">
      <header className="bg-slate-900 p-4">
        <h1 className="text-xl font-bold">WebContainer IDE</h1>
        {isLoading && <span className="text-yellow-400 ml-4">Initializing...</span>}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-slate-700 border-r border-slate-600 overflow-y-auto">
          <FileViewer
            files={Object.keys(fileSystem)}
            currentFile={currentFile}
            onSelectFile={setCurrentFile}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 border-r border-slate-600">
              <FileEditor
                content={
                  fileSystem[currentFile]?.file?.contents || "// Loading..."
                }
                onChange={(content) => handleFileChange(currentFile, content)}
              />
            </div>
            <div className="flex-1">
              <Preview url={iframeUrl} />
            </div>
          </div>

          <div className="h-64 bg-slate-900 border-t border-slate-600">
            <TerminalComponent 
              onData={handleTerminalData} 
              getTerminalInstance={(terminal) => {
                terminalRef.current = terminal;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}