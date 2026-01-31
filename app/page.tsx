import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Artistic Accessibility Collective
          </h1>
          <p className="text-xl text-gray-600">
            Connecting accessibility professionals and building community
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Professional Registry</h2>
            <p className="text-gray-600 mb-6">
              Find ASL interpreters, captioners, audio describers, and accessibility specialists.
            </p>
            <div className="space-y-3">
              <Link 
                href="/directory" 
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Browse Directory
              </Link>
              <Link 
                href="/submit" 
                className="block w-full bg-gray-100 text-gray-800 text-center py-3 rounded-lg hover:bg-gray-200 transition"
              >
                Join the Registry
              </Link>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-600">For Members</h2>
            <p className="text-gray-600 mb-6">
              Access the full member directory, endorse colleagues, and connect.
            </p>
            <div className="space-y-3">
              <Link 
                href="/members" 
                className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition"
              >
                Member Directory
              </Link>
              <Link 
                href="/login" 
                className="block w-full bg-gray-100 text-gray-800 text-center py-3 rounded-lg hover:bg-gray-200 transition"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="font-bold text-lg mb-2">Administrator Access</h3>
          <Link 
            href="/admin" 
            className="text-blue-600 hover:underline"
          >
            Admin Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
