import { WorldID, SelfID, VCProof, TokenHolding, TransferEvents } from '@/schema';
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
import { mapping } from '@/mapping';

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

  // Query all entity types - Updated to include refetch functions
  const { data: worldIDs, refetch: refetchWorldIDs } = useQuery(WorldID, { mode: 'private' });
  const { data: selfIDs, refetch: refetchSelfIDs } = useQuery(SelfID, { mode: 'private' });
  const { data: vcProofs, refetch: refetchVCProofs } = useQuery(VCProof, { mode: 'private' });
  const { data: tokenHoldings, refetch: refetchTokenHoldings } = useQuery(TokenHolding, { mode: 'private' });
  const { data: transferEvents, refetch: refetchTransferEvents } = useQuery(TransferEvents, { mode: 'private' });

  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [isAddingEntity, setIsAddingEntity] = useState(false);
  const [entityData, setEntityData] = useState<{
    WorldID: { address: string; timestamp: string; type: string };
    SelfID: { address: string; did: string };
    VCProof: { proofHash: string; issuer: string; type: string };
    TokenHolding: { address: string; token: string; amount: string; network: string };
    TransferEvents: { from: string; to: string; token: string; amount: string; timestamp: string };
  }>({
    WorldID: { address: '', timestamp: '', type: '' },
    SelfID: { address: '', did: '' },
    VCProof: { proofHash: '', issuer: '', type: '' },
    TokenHolding: { address: '', token: '', amount: '', network: '' },
    TransferEvents: { from: '', to: '', token: '', amount: '', timestamp: '' },
  });

  // Create entity hooks for all types
  const createWorldID = useCreateEntity(WorldID);
  const createSelfID = useCreateEntity(SelfID);
  const createVCProof = useCreateEntity(VCProof);
  const createTokenHolding = useCreateEntity(TokenHolding);
  const createTransferEvents = useCreateEntity(TransferEvents);

  const { getSmartSessionClient } = useHypergraphApp();
  const deleteEntity = useDeleteEntity({ space: spaceId });

  // Combine all entities into a single array with type information
  const allEntities = [
    ...(worldIDs?.map((entity) => ({ ...entity, entityType: 'WorldID' })) || []),
    ...(selfIDs?.map((entity) => ({ ...entity, entityType: 'SelfID' })) || []),
    ...(vcProofs?.map((entity) => ({ ...entity, entityType: 'VCProof' })) || []),
    ...(tokenHoldings?.map((entity) => ({ ...entity, entityType: 'TokenHolding' })) || []),
    ...(transferEvents?.map((entity) => ({ ...entity, entityType: 'TransferEvents' })) || []),
  ];

  // Add refetch function for all entities
  const refetchAllEntities = () => {
    console.log('=== REFETCH DEBUG START ===');
    console.log('Refreshing all private entities...');
    console.log('Current entity counts:', {
      worldIDs: worldIDs?.length || 0,
      selfIDs: selfIDs?.length || 0,
      vcProofs: vcProofs?.length || 0,
      tokenHoldings: tokenHoldings?.length || 0,
      transferEvents: transferEvents?.length || 0,
      total: allEntities.length,
    });

    try {
      console.log('Calling refetch functions...');
      refetchWorldIDs();
      refetchSelfIDs();
      refetchVCProofs();
      refetchTokenHoldings();
      refetchTransferEvents();
      console.log('All refetch functions called successfully');
    } catch (error) {
      console.error('Error during refetch:', error);
    }

    console.log('=== REFETCH DEBUG END ===');
  };

  // Debug query states
  console.log('=== QUERY STATES DEBUG ===');
  console.log('Private space query states:', {
    spaceId,
    ready,
    name,
    worldIDs: { count: worldIDs?.length || 0, data: worldIDs },
    selfIDs: { count: selfIDs?.length || 0, data: selfIDs },
    vcProofs: { count: vcProofs?.length || 0, data: vcProofs },
    tokenHoldings: { count: tokenHoldings?.length || 0, data: tokenHoldings },
    transferEvents: { count: transferEvents?.length || 0, data: transferEvents },
    allEntities: { count: allEntities.length, data: allEntities },
  });

  // Entity type configurations
  const entityTypes = {
    WorldID: {
      fields: [
        { name: 'address', type: 'text', placeholder: 'Enter wallet address...', label: 'Wallet Address' },
        { name: 'timestamp', type: 'number', placeholder: 'Enter timestamp...', label: 'Timestamp' },
        { name: 'type', type: 'text', placeholder: 'Enter type...', label: 'Type' },
      ],
      icon: '🌍',
      color: 'from-blue-500 to-cyan-500',
      title: 'World ID',
      description: 'Verify your World ID identity',
    },
    SelfID: {
      fields: [
        { name: 'address', type: 'text', placeholder: 'Enter wallet address...', label: 'Wallet Address' },
        { name: 'did', type: 'text', placeholder: 'Enter DID...', label: 'Decentralized ID' },
      ],
      icon: '👤',
      color: 'from-green-500 to-emerald-500',
      title: 'Self ID',
      description: 'Create your self-sovereign identity',
    },
    VCProof: {
      fields: [
        { name: 'proofHash', type: 'text', placeholder: 'Enter proof hash...', label: 'Proof Hash' },
        { name: 'issuer', type: 'text', placeholder: 'Enter issuer...', label: 'Issuer' },
        { name: 'type', type: 'text', placeholder: 'Enter proof type...', label: 'Proof Type' },
      ],
      icon: '🔐',
      color: 'from-purple-500 to-violet-500',
      title: 'VC Proof',
      description: 'Add verifiable credential proof',
    },
    TokenHolding: {
      fields: [
        { name: 'address', type: 'text', placeholder: 'Enter wallet address...', label: 'Wallet Address' },
        { name: 'token', type: 'text', placeholder: 'Enter token symbol...', label: 'Token Symbol' },
        { name: 'amount', type: 'number', placeholder: 'Enter amount...', label: 'Amount' },
        { name: 'network', type: 'text', placeholder: 'Enter network...', label: 'Network' },
      ],
      icon: '💰',
      color: 'from-yellow-500 to-orange-500',
      title: 'Token Holding',
      description: 'Record your token holdings',
    },
    TransferEvents: {
      fields: [
        { name: 'from', type: 'text', placeholder: 'Enter sender address...', label: 'From Address' },
        { name: 'to', type: 'text', placeholder: 'Enter recipient address...', label: 'To Address' },
        { name: 'token', type: 'text', placeholder: 'Enter token symbol...', label: 'Token Symbol' },
        { name: 'amount', type: 'number', placeholder: 'Enter amount...', label: 'Amount' },
        { name: 'timestamp', type: 'number', placeholder: 'Enter timestamp...', label: 'Timestamp' },
      ],
      icon: '🔄',
      color: 'from-red-500 to-pink-500',
      title: 'Transfer Events',
      description: 'Track token transfer events',
    },
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('=== ENTITY CREATION DEBUG START ===');
    console.log('Space ID:', spaceId);
    console.log('Space ready:', ready);
    console.log('Entity data:', entityData);

    let createdCount = 0;
    const entitiesToCreate: Array<{ type: string; data: Record<string, any> }> = [];

    // Check each entity type and create if all required fields are filled
    Object.entries(entityTypes).forEach(([entityType, config]) => {
      const typeKey = entityType as keyof typeof entityData;
      const data = entityData[typeKey];

      // Check if all fields for this entity type are filled
      const allFieldsFilled = config.fields.every((field) => {
        const value = (data as any)[field.name];
        return value && value.trim() !== '';
      });

      if (allFieldsFilled) {
        // Convert string values to appropriate types
        const processedData = config.fields.reduce(
          (acc, field) => {
            const value = (data as any)[field.name];
            acc[field.name] = field.type === 'number' ? Number(value) : value;
            return acc;
          },
          {} as Record<string, any>,
        );

        entitiesToCreate.push({ type: entityType, data: processedData });
        console.log(`Prepared ${entityType} for creation:`, processedData);
      }
    });

    if (entitiesToCreate.length === 0) {
      alert('Please fill in all required fields for at least one entity type');
      return;
    }

    console.log('Entities to create:', entitiesToCreate);

    // Create entities based on filled forms with proper error handling
    try {
      for (const { type, data } of entitiesToCreate) {
        console.log(`Creating ${type} with data:`, data);

        try {
          let result;
          switch (type) {
            case 'WorldID':
              console.log('Calling createWorldID...');
              result = await createWorldID(data as { address: string; timestamp: number; type: string });
              console.log('WorldID creation result:', result);
              break;
            case 'SelfID':
              console.log('Calling createSelfID...');
              result = await createSelfID(data as { address: string; did: string });
              console.log('SelfID creation result:', result);
              break;
            case 'VCProof':
              console.log('Calling createVCProof...');
              result = await createVCProof(data as { proofHash: string; issuer: string; type: string });
              console.log('VCProof creation result:', result);
              break;
            case 'TokenHolding':
              console.log('Calling createTokenHolding...');
              result = await createTokenHolding(
                data as { address: string; token: string; amount: number; network: string },
              );
              console.log('TokenHolding creation result:', result);
              break;
            case 'TransferEvents':
              console.log('Calling createTransferEvents...');
              result = await createTransferEvents(
                data as { from: string; to: string; token: string; amount: number; timestamp: number },
              );
              console.log('TransferEvents creation result:', result);
              break;
            default:
              console.error('Unknown entity type:', type);
              continue;
          }

          createdCount++;
          console.log(`Successfully created ${type}. Total created: ${createdCount}`);
        } catch (entityError) {
          console.error(`Error creating ${type}:`, entityError);
          console.error('Entity creation error details:', {
            message: (entityError as any)?.message,
            stack: (entityError as any)?.stack,
            name: (entityError as any)?.name,
          });
          alert(`Failed to create ${type}: ${(entityError as any)?.message || 'Unknown error'}`);
        }
      }

      if (createdCount > 0) {
        // Reset form
        setEntityData({
          WorldID: { address: '', timestamp: '', type: '' },
          SelfID: { address: '', did: '' },
          VCProof: { proofHash: '', issuer: '', type: '' },
          TokenHolding: { address: '', token: '', amount: '', network: '' },
          TransferEvents: { from: '', to: '', token: '', amount: '', timestamp: '' },
        });
        setIsAddingEntity(false);

        alert(`Successfully created ${createdCount} entities!`);

        // Refetch all entities to update the UI
        console.log('Waiting before refetch...');
        setTimeout(() => {
          console.log('Refreshing entities after creation...');
          refetchAllEntities();
        }, 2000); // Increased timeout to allow for network propagation
      } else {
        alert('No entities were created successfully. Please check the console for errors.');
      }
    } catch (error) {
      console.error('Unexpected error during entity creation:', error);
      console.error('Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
      });
      alert(`Unexpected error: ${(error as any)?.message || 'Unknown error'}`);
    }

    console.log('=== ENTITY CREATION DEBUG END ===');
  };

  const updateEntityData = (entityType: keyof typeof entityData, fieldName: string, value: string) => {
    setEntityData((prev) => ({
      ...prev,
      [entityType]: {
        ...prev[entityType],
        [fieldName]: value,
      },
    }));
  };

  const publishToPublicSpace = async (entity: any) => {
    if (!selectedSpace) {
      alert('No space selected');
      return;
    }
    try {
      const { ops } = await preparePublish({ entity, publicSpace: selectedSpace });
      const smartSessionClient = await getSmartSessionClient();
      if (!smartSessionClient) {
        throw new Error('Missing smartSessionClient');
      }
      const publishResult = await publishOps({
        ops,
        space: selectedSpace,
        name: `Publish ${entity.entityType}`,
        walletClient: smartSessionClient,
      });
      console.log(publishResult, ops);
      alert(`${entity.entityType} published to public space`);
    } catch (error) {
      console.error(error);
      alert(`Error publishing ${entity.entityType} to public space`);
    }
  };

  const handleDeleteEntity = (entity: any) => {
    console.log('Attempting to delete entity:', entity);
    console.log('Entity ID:', (entity as any).id);

    if (confirm(`Are you sure you want to delete this ${entity.entityType}? This action cannot be undone.`)) {
      try {
        deleteEntity((entity as any).id);
        console.log('Delete function called successfully');
      } catch (error) {
        console.error('Error deleting entity:', error);
      }
    }
  };

  const getEntityDisplayName = (entity: any) => {
    switch (entity.entityType) {
      case 'WorldID':
        return entity.address?.slice(0, 8) + '...' || 'WorldID';
      case 'SelfID':
        return entity.did?.slice(0, 8) + '...' || 'SelfID';
      case 'VCProof':
        return entity.type || 'VCProof';
      case 'TokenHolding':
        return `${entity.amount} ${entity.token}` || 'TokenHolding';
      case 'TransferEvents':
        return `${entity.amount} ${entity.token}` || 'Transfer';
      default:
        return 'Entity';
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
                <span className="text-purple-400 font-semibold">{allEntities.length}</span>
                <span className="text-gray-400 ml-2">Entities</span>
              </div>
              <button
                onClick={refetchAllEntities}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
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
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Add New Entities</h2>
              <p className="text-gray-400 mb-8">
                Fill in any combination of entity types below. Only completed forms will create entities.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {Object.entries(entityTypes).map(([entityType, config]) => {
                    const typeKey = entityType as keyof typeof entityData;
                    return (
                      <div key={entityType} className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <div className="flex items-center mb-4">
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center mr-3`}
                          >
                            <span className="text-white text-lg">{config.icon}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                            <p className="text-gray-400 text-sm">{config.description}</p>
                          </div>
                        </div>

                        {config.fields.map((field) => (
                          <div key={field.name} className="mb-4">
                            <label className="block text-gray-300 text-sm font-semibold mb-2">{field.label}</label>
                            <input
                              type={field.type}
                              value={(entityData[typeKey] as any)[field.name] || ''}
                              onChange={(e) => updateEntityData(typeKey, field.name, e.target.value)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                              placeholder={field.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingEntity(false);
                      setEntityData({
                        WorldID: { address: '', timestamp: '', type: '' },
                        SelfID: { address: '', did: '' },
                        VCProof: { proofHash: '', issuer: '', type: '' },
                        TokenHolding: { address: '', token: '', amount: '', network: '' },
                        TransferEvents: { from: '', to: '', token: '', amount: '', timestamp: '' },
                      });
                    }}
                    className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Create Entities
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 mb-8">
          <h3 className="text-lg font-semibold text-red-400 mb-4">🐛 Debug Panel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-sm text-gray-400">Space Status</div>
              <div className="text-white font-mono">Ready: {ready ? '✅' : '❌'}</div>
              <div className="text-white font-mono">Name: {name || 'N/A'}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-sm text-gray-400">Entity Counts</div>
              <div className="text-white font-mono">WorldID: {worldIDs?.length || 0}</div>
              <div className="text-white font-mono">SelfID: {selfIDs?.length || 0}</div>
              <div className="text-white font-mono">VCProof: {vcProofs?.length || 0}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-sm text-gray-400">More Counts</div>
              <div className="text-white font-mono">TokenHolding: {tokenHoldings?.length || 0}</div>
              <div className="text-white font-mono">TransferEvents: {transferEvents?.length || 0}</div>
              <div className="text-white font-mono">Total: {allEntities.length}</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                console.log('=== MANUAL DEBUG ===');
                console.log('Current state:', { ready, name, spaceId });
                console.log('Raw query data:', { worldIDs, selfIDs, vcProofs, tokenHoldings, transferEvents });
                console.log('All entities:', allEntities);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Log State
            </button>
            <button
              onClick={refetchAllEntities}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Force Refetch
            </button>
            <button
              onClick={() => {
                console.log('=== MAPPING DEBUG ===');
                console.log('Current mapping:', mapping);
                console.log('Schema entities:', { WorldID, SelfID, VCProof, TokenHolding, TransferEvents });
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Check Mapping
            </button>
          </div>
        </div>

        {/* Entities Grid */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">All Entities</h2>
            <div className="text-gray-400 text-sm">{allEntities.length} entities in this space</div>
          </div>

          {allEntities.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-semibold text-gray-300 mb-4">No Entities Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start building your private space by adding your first entity.
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
              {allEntities.map((entity, index) => {
                const config = entityTypes[entity.entityType as keyof typeof entityTypes];
                return (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center mr-3`}
                        >
                          <span className="text-white text-lg">{config.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                            {getEntityDisplayName(entity)}
                          </h3>
                          <p className="text-gray-400 text-sm">{entity.entityType}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      {config.fields.slice(0, 3).map((field) => (
                        <div key={field.name} className="flex items-center text-gray-400">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                          <span className="capitalize font-medium mr-2">{field.name}:</span>
                          <span className="text-gray-300 truncate">
                            {field.type === 'number'
                              ? (entity as any)[field.name]?.toLocaleString()
                              : (entity as any)[field.name]?.length > 20
                                ? (entity as any)[field.name]?.slice(0, 20) + '...'
                                : (entity as any)[field.name]}
                          </span>
                        </div>
                      ))}
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
                          onClick={() => publishToPublicSpace(entity)}
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
                        onClick={() => handleDeleteEntity(entity)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1"
                      >
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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
            <h3 className="text-xl font-semibold text-white mb-4">⚡ Entity Types</h3>
            <div className="space-y-2">
              {Object.entries(entityTypes).map(([type, config]) => (
                <div key={type} className="flex items-center text-gray-300">
                  <span className="text-lg mr-2">{config.icon}</span>
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
