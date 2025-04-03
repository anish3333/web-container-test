// components/FileViewer.tsx
type FileViewerProps = {
  files: string[];
  currentFile: string;
  onSelectFile: (fileName: string) => void;
};

export default function FileViewer({ files, currentFile, onSelectFile }: FileViewerProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-slate-200">Files</h3>
      <ul className="space-y-1">
        {files.map((file) => (
          <li key={file}>
            <button
              onClick={() => onSelectFile(file)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                file === currentFile 
                  ? 'bg-slate-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
            >
              {file}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}