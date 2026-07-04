import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Word Blitz` : 'Word Blitz';
  }, [title]);
}
