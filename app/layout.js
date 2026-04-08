import CustomerService from '@/components/CustomerService';

export const metadata = {
  title: 'Farin Shop - Jual Beli OTP',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f0f2f5' }}>
        {children}
        <CustomerService />
      </body>
    </html>
  );
}