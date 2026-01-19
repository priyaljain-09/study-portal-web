import { useEffect, useRef } from 'react';

interface HTMLContentViewerProps {
  html: string;
  textColor?: string;
}

const HTMLContentViewer: React.FC<HTMLContentViewerProps> = ({ html, textColor = '#444' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && html) {
      containerRef.current.innerHTML = html;
      
      // Style the content
      const style = document.createElement('style');
      style.textContent = `
        #html-content-viewer img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 12px 0;
        }
        #html-content-viewer video {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 12px 0;
        }
        #html-content-viewer p {
          margin: 12px 0;
          line-height: 1.6;
          color: ${textColor};
        }
        #html-content-viewer h1, #html-content-viewer h2, #html-content-viewer h3 {
          margin: 16px 0 8px 0;
          color: ${textColor};
        }
        #html-content-viewer ul, #html-content-viewer ol {
          margin: 12px 0;
          padding-left: 24px;
        }
        #html-content-viewer li {
          margin: 6px 0;
          line-height: 1.6;
          color: ${textColor};
        }
        #html-content-viewer a {
          color: #3B82F6;
          text-decoration: underline;
        }
        #html-content-viewer blockquote {
          border-left: 4px solid #E5E7EB;
          padding-left: 16px;
          margin: 12px 0;
          color: ${textColor};
        }
        #html-content-viewer code {
          background-color: #F3F4F6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }
        #html-content-viewer pre {
          background-color: #F3F4F6;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 12px 0;
        }
      `;
      
      const existingStyle = document.getElementById('html-content-viewer-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      style.id = 'html-content-viewer-style';
      document.head.appendChild(style);
    }
  }, [html, textColor]);

  return (
    <div
      id="html-content-viewer"
      ref={containerRef}
      className="prose prose-sm max-w-none"
      style={{ color: textColor }}
    />
  );
};

export default HTMLContentViewer;





