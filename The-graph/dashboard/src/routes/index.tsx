import { useSpaces } from '@graphprotocol/hypergraph-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { data: publicSpaces, isPending: publicSpacesPending } = useSpaces({ mode: 'public' });

  // Add sorting state for spaces
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort spaces based on current sort settings
  const sortedSpaces = publicSpaces
    ? [...publicSpaces].sort((a, b) => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          {/* Main Title */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-white/10 rounded-full mb-6 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-2 px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">New: Human-Verified Agents</span>
              </div>
            </div>

            <h1 className="text-7xl md:text-8xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Human-Bound
              </span>
              <br />
              <span className="text-white">Agent Explorer</span>
            </h1>

            <div className="max-w-2xl mx-auto">
              <p className="text-xl text-gray-300 leading-relaxed">
                Discover and interact with <span className="text-blue-400 font-semibold">verified agents</span> that
                bring trust, accountability, and social legitimacy to the AI economy.
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-3">AI-Human Interface</h3>
              <p className="text-gray-400 leading-relaxed">
                Agents are becoming the new interface between humans and machines, enabling seamless interaction.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🔐</div>
              <h3 className="text-xl font-semibold text-white mb-3">Verifiable Identity</h3>
              <p className="text-gray-400 leading-relaxed">
                Without verifiable identity, agents lack trust, accountability, and social legitimacy.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Hypergraph Powered</h3>
              <p className="text-gray-400 leading-relaxed">
                Local-first, verifiable data layer bringing identity, provenance, and meaning to agents.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Explore Agents
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
              <div className="w-4 h-4 bg-green-400 rounded-full mr-4 animate-pulse"></div>
              <h2 className="text-3xl font-bold text-white">Public Agent Spaces</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 text-sm">{publicSpaces?.length || 0} spaces available</div>

              {/* Sorting Controls */}
              {publicSpaces && publicSpaces.length > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'recent')}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
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
              {sortedSpaces.map((space, index) => (
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
      </div>
    </div>
  );
}
