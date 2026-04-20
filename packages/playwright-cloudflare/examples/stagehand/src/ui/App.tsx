import React, { useEffect, useMemo, useState } from 'react';

interface LogLine {
  category?: string;
  message?: string;
}

interface ExtractedData {
  title: string;
  year: number;
  rating: number;
  genres: string[];
  duration: number; // minutes
}

interface WSMessage<T = any> {
  type: 'log' | 'screenshot' | 'extracted' | 'error';
  data: T;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [logLine, setLogLine] = useState<LogLine | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [details, setDetails] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<{ message: string; stack?: string } | null>(null);

  const wsUrl = useMemo(() => {
    const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${wsProto}://${location.host}/movie`;
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setError(null);
        setDetails(null);
        setLoading(true);
      };

      ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data) as WSMessage;
          switch (type) {
            case 'log': {
              setLogLine(data as LogLine);
              break;
            }
            case 'screenshot': {
              const { mimetype, base64 } = data as { mimetype: string; base64: string };
              setScreenshot(`data:${mimetype};base64,${base64}`);
              break;
            }
            case 'extracted': {
              setDetails(data as ExtractedData);
              setLoading(false);
              setError(null);
              break;
            }
            case 'error': {
              const err = data as { message: string; stack?: string };
              setError(err);
              setLoading(false);
              break;
            }
            default: {
              setError({ message: `Unknown message type: ${(type as any) ?? 'unknown'}` });
              setLoading(false);
            }
          }
        } catch (e) {
          const err = e as Error;
          setError({ message: err.message, stack: err.stack });
          setLoading(false);
        }
      };

      ws.onerror = () => {
        setError({ message: 'A WebSocket error occurred' });
        setLoading(false);
      };
    };

    connect();

    return () => {
      ws?.close();
    };
  }, [wsUrl]);

  return (
    <div className="app">
      <div className="left">
        <h1>Movie Information</h1>

        {loading && (
          <div aria-live="polite" className="center loading">
            <span className="loader" />
            <div className="loading-text">
              Loading movie information...
              <div className="logline">
                <span className="logline-category">[{logLine?.category ?? 'info'}]</span>{' '}
                {logLine?.message ?? 'This can take a few seconds...'}
              </div>
            </div>
          </div>
        )}

        {details && (
          <div>
            <p><b>Title:</b> <span>{details.title}</span></p>
            <p><b>Release Year:</b> <span>{details.year}</span></p>
            <p><b>Rating:</b> <span>{details.rating?.toFixed(1)}</span></p>
            <p><b>Duration:</b> <span>{details.duration} minutes</span></p>
            <p><b>Genres:</b> <span>{details.genres?.join(', ') || 'N/A'}</span></p>
          </div>
        )}

        {error && (
          <div className="center error">
            <h2>Something went wrong</h2>
            <p>{error.message}</p>
            {error.stack && <pre>{error.stack}</pre>}
          </div>
        )}
      </div>
      <div className="right">
        <div className="right-inner">
          {screenshot && <img className="screenshot" alt="Screenshot" src={screenshot} />}
        </div>
      </div>
    </div>
  );
}
