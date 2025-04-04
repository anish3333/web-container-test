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
  const [terminalReady, setTerminalReady] = useState(false);

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

    // Fix 2: Only run when terminalReady is true, not on terminalRef.current change
    if (terminalReady && terminalRef.current) {
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
  }, [terminalReady]); 

  const startShell = async () => {
    if (!webContainerInstance.current || !terminalRef.current) {
      console.error("WebContainer or terminal not initialized");
      return;
    }

    try {
      // Spawn the shell process
      const shellProcess = await webContainerInstance.current.spawn("jsh", {
        terminal: {
          cols: terminalRef.current.cols,
          rows: terminalRef.current.rows,
        },
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
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-50 font-sans">
      <header className="bg-gray-950 border-b border-gray-800 shadow-md p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            WebContainer
          </h1>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 bg-gray-800 py-1 px-3 rounded-full text-sm">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-400">Initializing environment...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-gray-800 py-1 px-3 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400">Ready</span>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-850 border-r border-gray-800 overflow-y-auto flex-shrink-0 shadow-lg z-10">
          <FileViewer
            files={Object.keys(fileSystem)}
            currentFile={currentFile}
            onSelectFile={setCurrentFile}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 border-r border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 bg-gray-850 px-4 py-4 border-b border-gray-800 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  {currentFile}
                </span>
              </div>
              <div className="pt-10 h-full">
                <FileEditor
                  content={
                    fileSystem[currentFile]?.file?.contents || "// Loading..."
                  }
                  onChange={(content) => handleFileChange(currentFile, content)}
                />
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="absolute top-0 left-0 right-0 bg-gray-850 px-4 py-4 z-50 border-b border-gray-800 flex items-center justify-between">
                <span className="text-md font-medium text-gray-300">
                  Preview
                </span>
              </div>
              <div className="pt-[56px] h-full">
                <Preview url={iframeUrl} />
              </div>
            </div>
          </div>

          <div className="h-72 border-t border-gray-800">
            <div className="bg-gray-850 px-4 py-4 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">
                Terminal
              </span>
            </div>
            <div className="h-60">
              <TerminalComponent
                onData={handleTerminalData}
                getTerminalInstance={(terminal) => {
                  // Fix 4: Set the terminal reference and then update state
                  terminalRef.current = terminal;
                  setTerminalReady(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
