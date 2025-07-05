import { useSpaces } from '@graphprotocol/hypergraph-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/private-spaces')({
  component: PrivateSpaces,
});

function PrivateSpaces() {
  const spacesQuery = useSpaces({ mode: 'private' });
  const { data: privateSpaces, isPending: privateSpacesPending } = spacesQuery;
  const error = 'error' in spacesQuery ? spacesQuery.error : null;

  // Add sorting state for spaces
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort spaces based on current sort settings
  const sortedSpaces = privateSpaces
    ? [...privateSpaces].sort((a, b) => {
        let compareValue = 0;

        switch (sortBy) {
          case 'name':
            compareValue = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            break;
          case 'recent':
            // Sort by space ID as a proxy for creation order
            compareValue = a.id.localeCompare(b.id);
            break;
          default:
            compareValue = 0;
        }

        return sortOrder === 'asc' ? compareValue : -compareValue;
      })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Main Title */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2 px-4 py-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Secure & Private</span>
              </div>
            </div>

            <h1 className="text-7xl md:text-8xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Private
              </span>
              <br />
              <span className="text-white">Agent Spaces</span>
            </h1>

            <div className="max-w-2xl mx-auto">
              <p className="text-xl text-gray-300 leading-relaxed">
                Create, manage, and control your{' '}
                <span className="text-purple-400 font-semibold">personal AI agents</span> in completely private spaces.
                Choose when to share them with the world.
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-3">Complete Privacy</h3>
              <p className="text-gray-400 leading-relaxed">
                Your agents remain completely private until you decide to share them publicly.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🎛️</div>
              <h3 className="text-xl font-semibold text-white mb-3">Full Control</h3>
              <p className="text-gray-400 leading-relaxed">
                Upload, configure, and manage your agent data with complete control over access and permissions.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-3">Easy Publishing</h3>
              <p className="text-gray-400 leading-relaxed">
                When ready, seamlessly publish your private agents to public spaces with one click.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Create Private Space
            </button>
            <a
              href="https://github.com/SamiiBou/World-Agent"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full mr-4 animate-pulse"></div>
              <h2 className="text-3xl font-bold text-white">Your Private Agent Spaces</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 text-sm">{privateSpaces?.length || 0} spaces available</div>

              {/* Sorting Controls */}
              {privateSpaces && privateSpaces.length > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="recent">Sort by Recent</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors flex items-center space-x-1"
                  >
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                  </button>
                </div>
              )}
            </div>
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
              {sortedSpaces.map((space, index) => (
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
      </div>
    </div>
  );
}
