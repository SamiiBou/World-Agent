import { useSpaces } from '@graphprotocol/hypergraph-react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { data: publicSpaces, isPending: publicSpacesPending } = useSpaces({ mode: 'public' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Agent Explorer
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover and interact with intelligent agents in public spaces. Explore the community-driven ecosystem of AI
            companions.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Explore Public Agents
            </button>
            <button className="border border-gray-600 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-semibold transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{publicSpaces?.length || 0}</div>
            <div className="text-gray-300">Public Spaces</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{publicSpaces?.length || 0}</div>
            <div className="text-gray-300">Active Agents</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-gray-300">Availability</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-400 rounded-full mr-4 animate-pulse"></div>
              <h2 className="text-3xl font-bold text-white">Public Agent Spaces</h2>
            </div>
            <div className="text-gray-400 text-sm">{publicSpaces?.length || 0} spaces available</div>
          </div>

          {publicSpacesPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white/10 rounded-lg p-6">
                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : publicSpaces?.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-semibold text-gray-300 mb-4">No Public Spaces Found</h3>
              <p className="text-gray-400 mb-6">Be the first to create a public agent space!</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Create Public Space
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicSpaces?.map((space, index) => (
                <Link
                  key={space.id}
                  to="/public-space/$space-id"
                  params={{ 'space-id': space.id }}
                  className="block bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {space.name}
                      </h3>
                    </div>
                    <div className="text-gray-500 group-hover:text-blue-400 transition-colors text-xl">→</div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      Public Agent Space
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Active & Available
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-gray-500 text-sm">Space #{index + 1}</div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="mr-1">🤖</span>
                      Ready to use
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose Public Spaces?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-white mb-3">Community Driven</h3>
              <p className="text-gray-400">
                Discover agents created by the community, tested and refined by real users.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Access</h3>
              <p className="text-gray-400">
                No setup required. Jump right in and start interacting with powerful AI agents.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-white mb-3">Always Updated</h3>
              <p className="text-gray-400">Public spaces are continuously improved and updated by their creators.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
