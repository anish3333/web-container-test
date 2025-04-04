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
      className="w-full h-full p-6 bg-gray-900 text-gray-50 font-mono text-sm outline-none resize-none border-0 focus:ring-0 focus:outline-none leading-relaxed selection:bg-indigo-700/30"
      spellCheck="false"
      style={{
        tabSize: 2,
      }}
    />
  );
}