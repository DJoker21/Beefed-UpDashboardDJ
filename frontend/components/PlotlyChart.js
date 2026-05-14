/**
 * Plotly wrapper that handles SSR (Next.js).
 * Import this instead of 'react-plotly.js' directly.
 */
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default Plot;
