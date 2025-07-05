import { AcademicField } from '@/schema';
import {
  HypergraphSpaceProvider,
  preparePublish,
  publishOps,
  useCreateEntity,
  useHypergraphApp,
  useQuery,
  useSpace,
  useSpaces,
  useDeleteEntity,
} from '@graphprotocol/hypergraph-react';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/private-space/$space-id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'space-id': spaceId } = Route.useParams();

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <PrivateSpace spaceId={spaceId} />
    </HypergraphSpaceProvider>
  );
}

function PrivateSpace({ spaceId }: { spaceId: string }) {
  const { name, ready } = useSpace({ mode: 'private' });
  const { data: academicFields } = useQuery(AcademicField, { mode: 'private' });
  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const createAddress = useCreateEntity(AcademicField);
  const [addressName, setAddressName] = useState('');
  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const { getSmartSessionClient } = useHypergraphApp();
  const deleteAcademicField = useDeleteEntity({ space: spaceId });

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <div className="text-white text-xl font-semibold">Loading Private Space...</div>
          <div className="text-gray-400 mt-2">Please wait while we secure your connection</div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addressName.trim()) return;
    createAddress({ name: addressName, description: 'Beautiful academicField' });
    setAddressName('');
    setIsAddingEntity(false);
  };

  const publishToPublicSpace = async (academicField: AcademicField) => {
    if (!selectedSpace) {
      alert('No space selected');
      return;
    }
    try {
      const { ops } = await preparePublish({ entity: academicField, publicSpace: selectedSpace });
      const smartSessionClient = await getSmartSessionClient();
      if (!smartSessionClient) {
        throw new Error('Missing smartSessionClient');
      }
      const publishResult = await publishOps({
        ops,
        space: selectedSpace,
        name: 'Publish AcademicField',
        walletClient: smartSessionClient,
      });
      console.log(publishResult, ops);
      alert('AcademicField published to public space');
    } catch (error) {
      console.error(error);
      alert('Error publishing academicField to public space');
    }
  };

  const handleDeleteEntity = (academicField: AcademicField) => {
    console.log('Attempting to delete entity:', academicField);
    console.log('Entity ID:', (academicField as any).id);

    if (confirm(`Are you sure you want to delete "${academicField.name}"? This action cannot be undone.`)) {
      try {
        deleteAcademicField((academicField as any).id);
        console.log('Delete function called successfully');
      } catch (error) {
        console.error('Error deleting entity:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">{name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{name}</h1>
                <p className="text-gray-400">Private Agent Space</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500/20">
                <span className="text-purple-400 font-semibold">{academicFields?.length || 0}</span>
                <span className="text-gray-400 ml-2">Entities</span>
              </div>
              <button
                onClick={() => setIsAddingEntity(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Entity</span>
              </button>
            </div>
          </div>
        </div>

        {/* Add Entity Modal */}
        {isAddingEntity && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-6">Add New Entity</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Entity Name</label>
                  <input
                    type="text"
                    value={addressName}
                    onChange={(e) => setAddressName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    placeholder="Enter entity name..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingEntity(false);
                      setAddressName('');
                    }}
                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Create Entity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entities Grid */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Academic Fields</h2>
            <div className="text-gray-400 text-sm">{academicFields?.length || 0} entities in this space</div>
          </div>

          {!academicFields || academicFields.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-semibold text-gray-300 mb-4">No Entities Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start building your private space by adding your first academic field entity.
              </p>
              <button
                onClick={() => setIsAddingEntity(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Add Your First Entity
              </button>
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
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold">{academicField.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {academicField.name}
                        </h3>
                        <p className="text-gray-400 text-sm">Academic Field</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      Active Entity
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                      Private Space
                    </div>
                  </div>

                  {/* Publish Section */}
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <label className="block text-gray-300 text-sm font-semibold mb-2">Publish to Public Space</label>
                    <div className="flex space-x-2">
                      <select
                        value={selectedSpace}
                        onChange={(e) => setSelectedSpace(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                      >
                        <option value="">Select space...</option>
                        {publicSpaces?.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => publishToPublicSpace(academicField)}
                        disabled={!selectedSpace}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Publish
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleDeleteEntity(academicField)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">🔐 Privacy Features</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                End-to-end encryption
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Private entity management
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Selective publishing
              </li>
            </ul>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">⚡ Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setIsAddingEntity(true)}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-left"
              >
                + Add New Entity
              </button>
              <button className="w-full px-4 py-3 border border-purple-600 hover:border-purple-500 text-purple-300 rounded-lg font-semibold transition-colors text-left">
                📊 View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
