import { AcademicField } from '@/schema';
import { HypergraphSpaceProvider, useQuery, useSpace } from '@graphprotocol/hypergraph-react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/public-space/$space-id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'space-id': spaceId } = Route.useParams();

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <PublicSpace />
    </HypergraphSpaceProvider>
  );
}

function PublicSpace() {
  const { ready, name } = useSpace({ mode: 'public' });
  const { data: academicFields } = useQuery(AcademicField, { mode: 'public' });

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🌍</span>
          </div>
          <div className="text-white text-xl font-semibold">Loading Public Space...</div>
          <div className="text-gray-400 mt-2">Connecting to the community</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">{name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{name}</h1>
                <p className="text-gray-400">Public Agent Space</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-500/20">
                <span className="text-blue-400 font-semibold">{academicFields?.length || 0}</span>
                <span className="text-gray-400 ml-2">Entities</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-500/20">
                <span className="text-green-400 font-semibold">●</span>
                <span className="text-gray-400 ml-2">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">
              Public Spaces
            </Link>
            <span>→</span>
            <span className="text-white">{name}</span>
          </nav>
        </div>

        {/* Entities Grid */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Academic Fields</h2>
            <div className="text-gray-400 text-sm">{academicFields?.length || 0} entities available</div>
          </div>

          {!academicFields || academicFields.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-semibold text-gray-300 mb-4">No Entities Available</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                This public space doesn't have any academic field entities yet. Check back later or explore other
                spaces.
              </p>
              <Link
                to="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Explore Other Spaces
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {academicFields.map((academicField, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold">{academicField.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {academicField.name}
                        </h3>
                        <p className="text-gray-400 text-sm">Academic Field</p>
                      </div>
                    </div>
                    <div className="text-green-400 text-sm">Public</div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Community Verified
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      Open Access
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Always Available
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-gray-300 text-sm">
                      {academicField.description ||
                        'Explore this academic field and discover insights from the community.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <div className="text-gray-500 text-sm">Entity #{index + 1}</div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                      Explore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Sections */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">🌍 Community Driven</h3>
            <p className="text-gray-300 text-sm mb-4">
              This public space is maintained by the community. All entities are openly accessible and verified.
            </p>
            <div className="flex items-center text-blue-400 text-sm">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Transparent & Open
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">⚡ Real-time Access</h3>
            <p className="text-gray-300 text-sm mb-4">
              Access entities instantly without any setup. All data is live and continuously updated.
            </p>
            <div className="flex items-center text-green-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Always Up-to-date
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">🔗 Interconnected</h3>
            <p className="text-gray-300 text-sm mb-4">
              Entities in public spaces can be referenced and built upon by other community members.
            </p>
            <div className="flex items-center text-purple-400 text-sm">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Collaborative Network
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-8 border border-blue-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">Want to Contribute?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join the community by creating your own private space and publishing entities to public spaces. Help build
              the decentralized knowledge network.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/private-spaces"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Create Private Space
              </Link>
              <Link
                to="/"
                className="border border-blue-600 hover:border-blue-500 text-blue-300 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Explore More Spaces
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
