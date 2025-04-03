// components/Preview.tsx
type PreviewProps = {
  url: string;
};

export default function Preview({ url }: PreviewProps) {
  return (
    <div className="h-full w-full bg-white">
      {url ? (
        <iframe 
          src={url} 
          title="preview" 
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-slate-500">
          Server not started yet...
        </div>
      )}
    </div>
  );
}