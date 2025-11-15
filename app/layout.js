import './globals.css'

export const metadata = {
  title: 'FareFare - Compare Cab Prices',
  description: 'Compare real-time cab prices across Ola, Uber, and Rapido to find the best deal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}