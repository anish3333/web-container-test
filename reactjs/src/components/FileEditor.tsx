// components/FileEditor.tsx
import { useState, useEffect } from 'react';

type FileEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

export default function FileEditor({ content, onChange }: FileEditorProps) {
  const [value, setValue] = useState(content);

  useEffect(() => {
    setValue(content);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <textarea
      value={value}
      onChange={handleChange}
      className="w-full h-full p-4 bg-slate-800 text-slate-100 font-mono text-sm outline-none resize-none"
      spellCheck="false"
    />
  );
}