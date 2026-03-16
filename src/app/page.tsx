import Link from 'next/link';

export default function Home() {
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
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-5xl font-extrabold text-gray-900">Outpost Digital Solutions LLC</h1>
            <p className="mt-4 text-xl text-gray-600">Building robust and scalable applications for the modern web.</p>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Our Products</h2>
            <div className="flex justify-center">
              <div className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
                <div className="px-6 py-4">
                  <div className="font-bold text-xl mb-2">Chore Crusher</div>
                  <p className="text-gray-700 text-base">
                    The ultimate tool to manage and conquer your household chores.
                  </p>
                </div>
                <div className="px-6 pt-4 pb-2">
                  <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#productivity</span>
                  <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#chores</span>
                  <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#app</span>
                </div>
              </div>
            </div>
          </div>
        </section>
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
