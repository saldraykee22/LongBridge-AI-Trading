import './globals.css';
import Navbar from './Navbar';

export const metadata = {
  title: 'LongBridge AI',
  description: 'AI-powered professional stock and asset analysis terminal',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
