// import { FolderIcon, CodeIcon, ReactIcon, HtmlIcon, CssIcon, JsonIcon } from './Icons';

type FileViewerProps = {
  files: string[];
  currentFile: string;
  onSelectFile: (fileName: string) => void;
};

export default function FileViewer({ files, currentFile, onSelectFile }: FileViewerProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400">Explorer</h3>
        <button className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
          </svg>
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center text-xs font-medium uppercase tracking-wider text-gray-500 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Project Files
        </div>
        <ul className="space-y-1">
          {files.map((file) => (
            <li key={file}>
              <button
                onClick={() => onSelectFile(file)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-all ${
                  file === currentFile 
                    ? 'bg-indigo-600/20 text-indigo-300' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                {/* {getFileIcon(file)} */}
                <span className="truncate">{file}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="px-3 py-2 rounded-md bg-gray-800/50 border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">Open Folder</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// Icons component
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}
