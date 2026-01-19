import { useMemo, useRef } from 'react';
import JoditEditor from 'jodit-react';
import 'jodit/es2021/jodit.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  className?: string;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Write your content here...',
  height = 400,
  className = '',
}: RichTextEditorProps) => {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder,
      height,
      toolbar: true,
      toolbarButtonSize: 'middle' as const,
      toolbarAdaptive: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: true,
      askBeforePasteFromWord: true,
      defaultActionOnPaste: 'insert_as_html' as const,
      buttons: [
        'source',
        '|',
        'bold',
        'italic',
        'underline',
        '|',
        'ul',
        'ol',
        '|',
        'outdent',
        'indent',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'image',
        'link',
        '|',
        'align',
        'undo',
        'redo',
        '|',
        'hr',
        'eraser',
        'copyformat',
        '|',
        'fullsize',
        'selectall',
        'print',
        '|',
        'find',
        'preview',
      ],
      removeButtons: [],
      showPlaceholder: true,
      useNativeTooltip: false,
      style: {
        background: 'white',
      },
    }),
    [placeholder, height]
  );

  return (
    <div className={className}>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent: string) => onChange(newContent)}
        onChange={(newContent: string) => {
          onChange(newContent);
        }}
      />
    </div>
  );
};

export default RichTextEditor;

