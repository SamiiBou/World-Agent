import { useSpaces } from '@graphprotocol/hypergraph-react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/private-spaces')({
  component: PrivateSpaces,
});

function PrivateSpaces() {
  const spacesQuery = useSpaces({ mode: 'private' });
  const { data: privateSpaces, isPending: privateSpacesPending } = spacesQuery;
  const error = 'error' in spacesQuery ? spacesQuery.error : null;

  // Debug logging
  console.log('Private spaces debug:', {
    privateSpaces,
    privateSpacesPending,
    error,
    length: privateSpaces?.length,
    queryState: spacesQuery,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">🔒</span>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Private Spaces
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Your personal AI agent spaces with enhanced privacy and control. Create, manage, and interact with your
            exclusive AI companions.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Create Private Space
            </button>
            <button className="border border-purple-600 hover:border-purple-500 text-purple-300 px-8 py-3 rounded-lg font-semibold transition-colors">
              Import Space
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400 mb-2">{privateSpaces?.length || 0}</div>
            <div className="text-gray-300">Private Spaces</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-pink-500/20">
            <div className="text-3xl font-bold text-pink-400 mb-2">{privateSpaces?.length || 0}</div>
            <div className="text-gray-300">Active Agents</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-indigo-500/20">
            <div className="text-3xl font-bold text-indigo-400 mb-2">100%</div>
            <div className="text-gray-300">Privacy</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full mr-4 animate-pulse"></div>
              <h2 className="text-3xl font-bold text-white">Your Private Agent Spaces</h2>
            </div>
            <div className="text-gray-400 text-sm">{privateSpaces?.length || 0} spaces available</div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="text-red-400 text-6xl mb-6">⚠️</div>
              <h3 className="text-2xl font-semibold text-red-300 mb-4">Error Loading Private Spaces</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {error.message || 'There was an error loading your private spaces. Please try again.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {!error && privateSpacesPending && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white/10 rounded-xl p-6 border border-purple-500/20">
                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!error && !privateSpacesPending && (!privateSpaces || privateSpaces.length === 0) && (
            <div className="text-center py-20">
              <div className="text-gray-400 text-8xl mb-8">🏠</div>
              <h3 className="text-3xl font-semibold text-gray-300 mb-4">No Private Spaces Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create your first private space to start building your personal AI agent ecosystem with complete privacy
                and control.
              </p>
              <div className="flex justify-center gap-4">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Create Your First Space
                </button>
                <button className="border border-purple-600 hover:border-purple-500 text-purple-300 px-8 py-3 rounded-lg font-semibold transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          )}

          {/* Spaces Grid */}
          {!error && !privateSpacesPending && privateSpaces && privateSpaces.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privateSpaces.map((space, index) => (
                <Link
                  key={space.id}
                  to="/private-space/$space-id"
                  params={{ 'space-id': space.id }}
                  className="block bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-lg">{space.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {space.name}
                        </h3>
                        <p className="text-gray-400 text-sm">Private Space</p>
                      </div>
                    </div>
                    <div className="text-gray-500 group-hover:text-purple-400 transition-colors text-xl">→</div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Exclusive Access
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Fully Private
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      Always Available
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-gray-500 text-sm">Space #{index + 1}</div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="mr-1">🔐</span>
                      Secure
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose Private Spaces?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white/5 rounded-xl border border-purple-500/20">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-white mb-3">Complete Privacy</h3>
              <p className="text-gray-400">
                Your conversations and data remain completely private and secure, never shared with others.
              </p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-xl border border-pink-500/20">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-white mb-3">Full Control</h3>
              <p className="text-gray-400">
                Customize your agents, set permissions, and manage your space exactly how you want.
              </p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-xl border border-indigo-500/20">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-3">Enhanced Performance</h3>
              <p className="text-gray-400">
                Dedicated resources and priority access ensure optimal performance for your agents.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-8 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Create Your Private Space?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands of users who trust their AI interactions to our secure, private platform. Start building
              your personal AI ecosystem today.
            </p>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
