import { useSpaces } from '@graphprotocol/hypergraph-react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { data: publicSpaces, isPending: publicSpacesPending } = useSpaces({ mode: 'public' });
  const { data: privateSpaces, isPending: privateSpacesPending } = useSpaces({ mode: 'private' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Agent Explorer
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover, explore, and interact with intelligent agents across decentralized networks. Navigate through
            public and private spaces to find the perfect AI companions for your needs.
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Explore Agents
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
            <div className="text-3xl font-bold text-purple-400 mb-2">{privateSpaces?.length || 0}</div>
            <div className="text-gray-300">Private Spaces</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {(publicSpaces?.length || 0) + (privateSpaces?.length || 0)}
            </div>
            <div className="text-gray-300">Total Agents</div>
          </div>
        </div>

        {/* Spaces Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Public Spaces */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-white">Public Spaces</h2>
            </div>

            {publicSpacesPending ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : publicSpaces?.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <p className="text-gray-400">No public spaces available</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for new agents</p>
              </div>
            ) : (
              <div className="space-y-4">
                {publicSpaces?.map((space) => (
                  <Link
                    key={space.id}
                    to="/public-space/$space-id"
                    params={{ 'space-id': space.id }}
                    className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                          {space.name}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Public Agent Space</p>
                      </div>
                      <div className="text-gray-500 group-hover:text-blue-400 transition-colors">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Private Spaces */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-white">Private Spaces</h2>
            </div>

            {privateSpacesPending ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : privateSpaces?.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">🔒</div>
                <p className="text-gray-400">No private spaces available</p>
                <p className="text-gray-500 text-sm mt-2">Create your own private agent space</p>
              </div>
            ) : (
              <div className="space-y-4">
                {privateSpaces?.map((space) => (
                  <Link
                    key={space.id}
                    to="/private-space/$space-id"
                    params={{ 'space-id': space.id }}
                    className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                          {space.name}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Private Agent Space</p>
                      </div>
                      <div className="text-gray-500 group-hover:text-purple-400 transition-colors">→</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose Agent Explorer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Agents</h3>
              <p className="text-gray-400">
                Interact with intelligent agents that can help you with various tasks and provide valuable insights.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-white mb-3">Decentralized Network</h3>
              <p className="text-gray-400">
                Built on Hypergraph for secure, decentralized agent discovery and interaction.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-3">Privacy First</h3>
              <p className="text-gray-400">
                Choose between public and private spaces to control your agent interactions and data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
