import Link from 'next/link';

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            <Link href="/">Outpost Digital Solutions</Link>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">About Us</h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          Outpost Digital Solutions LLC is a forward-thinking technology company dedicated to creating high-quality, user-centric applications. We specialize in developing robust and scalable solutions that solve real-world problems. Our flagship product, Chore Crusher, is a testament to our commitment to innovation and excellence.
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-md mt-auto">
        <div className="container mx-auto px-6 py-4 text-center text-gray-600">
          &copy; {new Date().getFullYear()} Outpost Digital Solutions LLC. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
