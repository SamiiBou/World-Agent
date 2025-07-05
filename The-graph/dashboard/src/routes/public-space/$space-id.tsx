import { Account, WorldID, SelfID, VCProof, TokenHolding, TransferEvents } from '@/schema';
import {
  HypergraphSpaceProvider,
  useQuery,
  useSpace,
  useHypergraphApp,
  publishOps,
} from '@graphprotocol/hypergraph-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { mapping } from '@/mapping';
import { useState } from 'react';

export const Route = createFileRoute('/public-space/$space-id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { 'space-id': spaceId } = Route.useParams();

  return (
    <HypergraphSpaceProvider space={spaceId}>
      <PublicSpace spaceId={spaceId} />
    </HypergraphSpaceProvider>
  );
}

function PublicSpace({ spaceId }: { spaceId: string }) {
  const { ready, name } = useSpace({ mode: 'public' });

  // Add sorting state
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'recent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Query all entity types
  const { data: accounts, refetch: refetchAccounts } = useQuery(Account, { mode: 'public' });
  const { data: worldIDs, refetch: refetchWorldIDs } = useQuery(WorldID, { mode: 'public' });
  const { data: selfIDs, refetch: refetchSelfIDs } = useQuery(SelfID, { mode: 'public' });
  const { data: vcProofs, refetch: refetchVCProofs } = useQuery(VCProof, { mode: 'public' });
  const { data: tokenHoldings, refetch: refetchTokenHoldings } = useQuery(TokenHolding, { mode: 'public' });
  const { data: transferEvents, refetch: refetchTransferEvents } = useQuery(TransferEvents, { mode: 'public' });

  const { getSmartSessionClient } = useHypergraphApp();

  // Combine all entities into a single array with type information
  const allEntities = [
    ...(accounts?.map((entity) => ({ ...entity, entityType: 'Account' })) || []),
    ...(worldIDs?.map((entity) => ({ ...entity, entityType: 'WorldID' })) || []),
    ...(selfIDs?.map((entity) => ({ ...entity, entityType: 'SelfID' })) || []),
    ...(vcProofs?.map((entity) => ({ ...entity, entityType: 'VCProof' })) || []),
    ...(tokenHoldings?.map((entity) => ({ ...entity, entityType: 'TokenHolding' })) || []),
    ...(transferEvents?.map((entity) => ({ ...entity, entityType: 'TransferEvents' })) || []),
  ];

  // Sort entities based on current sort settings
  const sortedEntities = [...allEntities].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'name':
        const nameA = getEntityDisplayName(a).toLowerCase();
        const nameB = getEntityDisplayName(b).toLowerCase();
        compareValue = nameA.localeCompare(nameB);
        break;
      case 'type':
        compareValue = a.entityType.localeCompare(b.entityType);
        break;
      case 'recent':
        // Sort by entity creation order (index-based for now)
        compareValue = 0; // Keep original order for recent
        break;
      default:
        compareValue = 0;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Entity type configurations
  const entityTypes = {
    Account: {
      icon: '👤',
      color: 'from-indigo-500 to-blue-500',
    },
    WorldID: {
      icon: '🌍',
      color: 'from-blue-500 to-cyan-500',
    },
    SelfID: {
      icon: '👤',
      color: 'from-green-500 to-emerald-500',
    },
    VCProof: {
      icon: '🔐',
      color: 'from-purple-500 to-violet-500',
    },
    TokenHolding: {
      icon: '💰',
      color: 'from-yellow-500 to-orange-500',
    },
    TransferEvents: {
      icon: '🔄',
      color: 'from-red-500 to-pink-500',
    },
  };

  const handleUnsetEntity = async (entity: any) => {
    if (
      confirm(
        `Are you sure you want to unset this ${entity.entityType}? This will remove the entity from the public space but preserve it in the blockchain.`,
      )
    ) {
      try {
        // Get all property IDs for the entity type from mapping
        const entityMapping = mapping[entity.entityType as keyof typeof mapping];
        if (!entityMapping?.properties) {
          throw new Error(`${entity.entityType} mapping properties not found`);
        }

        const propertyIds = Object.values(entityMapping.properties);

        // Create unset operations
        const ops = [
          {
            type: 'UNSET_ENTITY_VALUES' as const,
            unsetEntityValues: {
              id: (entity as any).id,
              properties: propertyIds,
            },
          },
        ];

        // Get smart session client
        const smartSessionClient = await getSmartSessionClient();
        if (!smartSessionClient) {
          throw new Error('Missing smartSessionClient');
        }

        // Publish the unset operations
        const result = await publishOps({
          ops,
          space: spaceId,
          name: `Unset ${entity.entityType}`,
          walletClient: smartSessionClient,
        });

        // Refresh the data after unset
        setTimeout(() => {
          refetchAllEntities();
        }, 1000);
      } catch (error) {
        console.error('Error unsetting entity:', error);
        alert(`Error unsetting entity: ${(error as any)?.message || 'Unknown error'}`);
      }
    }
  };

  const refetchAllEntities = () => {
    refetchAccounts();
    refetchWorldIDs();
    refetchSelfIDs();
    refetchVCProofs();
    refetchTokenHoldings();
    refetchTransferEvents();
  };

  const getEntityDisplayName = (entity: any) => {
    switch (entity.entityType) {
      case 'Account':
        return entity.name || 'Account';
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

  const getEntityDescription = (entity: any) => {
    switch (entity.entityType) {
      case 'Account':
        return `Account profile: ${entity.description || entity.name}`;
      case 'WorldID':
        return `World ID verification for address ${entity.address}`;
      case 'SelfID':
        return `Self-sovereign identity: ${entity.did}`;
      case 'VCProof':
        return `Verifiable credential proof of type: ${entity.type}`;
      case 'TokenHolding':
        return `Holding ${entity.amount} ${entity.token} on ${entity.network}`;
      case 'TransferEvents':
        return `Transfer of ${entity.amount} ${entity.token} from ${entity.from?.slice(0, 8)}... to ${entity.to?.slice(0, 8)}...`;
      default:
        return 'Explore this entity and discover insights from the community.';
    }
  };

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
                <span className="text-blue-400 font-semibold">{allEntities.length}</span>
                <span className="text-gray-400 ml-2">Entities</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-500/20">
                <span className="text-green-400 font-semibold">●</span>
                <span className="text-gray-400 ml-2">Live</span>
              </div>
              <button
                onClick={refetchAllEntities}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
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

        {/* Stats Station */}
        <div className="bg-yellow-900/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30 mb-8">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            {' '}
            Stats Station (for hackathon testing/demo only)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold text-sm mb-2">📊 Current Status</h4>
              <div className="text-blue-200 text-xs space-y-1">
                <p>• Space Ready: {ready ? '✅' : '❌'}</p>
                <p>• Space Name: {name || 'Loading...'}</p>
                <p>• Space ID: {spaceId}</p>
                <p>• Total Entities: {allEntities.length}</p>
                <p>• Last Updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h4 className="text-purple-300 font-semibold text-sm mb-2">🔧 Schema Validation</h4>
              <div className="text-purple-200 text-xs space-y-1">
                <p>• Account Mapping: {mapping.Account ? '✅' : '❌'}</p>
                <p>• Account Type ID: {mapping.Account?.typeIds[0] ? '✅' : '❌'}</p>
                <p>• Account Properties: {Object.keys(mapping.Account?.properties || {}).length}/3</p>
                <p>• All Mappings: {Object.keys(mapping).length}/6</p>
              </div>
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-red-300 font-semibold text-sm mb-2">🚨 Entity Count by Type</h4>
            <div className="text-red-200 text-xs space-y-1">
              <p>• Account: {accounts?.length || 0} entities</p>
              <p>• WorldID: {worldIDs?.length || 0} entities</p>
              <p>• SelfID: {selfIDs?.length || 0} entities</p>
              <p>• VCProof: {vcProofs?.length || 0} entities</p>
              <p>• TokenHolding: {tokenHoldings?.length || 0} entities</p>
              <p>• TransferEvents: {transferEvents?.length || 0} entities</p>
            </div>
          </div>

          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-orange-300 font-semibold text-sm mb-2">⚠️ If Your Data Isn't Showing</h4>
            <div className="text-orange-200 text-xs space-y-1">
              <p>• Data might still be indexing (wait 1-2 minutes)</p>
              <p>• Schema changes might have created version conflicts</p>
              <p>• Old data might not match new Account schema</p>
              <p>• Check browser console for schema mismatch warnings</p>
              <p>• Try republishing from private space with new schema</p>
              <p>
                • <strong>Verify you're in the correct public space!</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                console.log('=== COMPREHENSIVE DEBUG DUMP ===');
                console.log('Space ID:', spaceId);
                console.log('Space ready:', ready);
                console.log('Space name:', name);
                console.log('All entities:', allEntities);
                console.log('Entity counts:', {
                  accounts: accounts?.length || 0,
                  worldIDs: worldIDs?.length || 0,
                  selfIDs: selfIDs?.length || 0,
                  vcProofs: vcProofs?.length || 0,
                  tokenHoldings: tokenHoldings?.length || 0,
                  transferEvents: transferEvents?.length || 0,
                });
                console.log('Schema mapping:', mapping);
                console.log('Raw query results:', {
                  accounts,
                  worldIDs,
                  selfIDs,
                  vcProofs,
                  tokenHoldings,
                  transferEvents,
                });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Comprehensive Debug
            </button>
            <button
              onClick={() => {
                console.log('=== SCHEMA VALIDATION DEBUG ===');
                console.log('Account Class:', Account);
                console.log('Account Mapping:', mapping.Account);
                console.log(
                  'Mapping validation:',
                  Object.keys(mapping).map((key) => {
                    const entityMapping = mapping[key as keyof typeof mapping];
                    return {
                      entity: key,
                      hasTypeIds: !!entityMapping.typeIds,
                      hasProperties: !!entityMapping.properties,
                      propertyCount: entityMapping.properties ? Object.keys(entityMapping.properties).length : 0,
                    };
                  }),
                );
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Schema Validation
            </button>
            <button
              onClick={() => {
                console.log('=== PUBLIC SPACE VERIFICATION ===');
                console.log('Current Space ID:', spaceId);
                console.log('Current Space Name:', name);

                // Check if this space ID matches what you expect
                console.log('Expected space from your private space publishing target?');
                console.log(
                  'If you have access to private space, check which public space you selected for publishing',
                );
                console.log('Go to your private space and check the dropdown in "Publish to Public Space" section');
                console.log('The selected space should match this space ID:', spaceId);

                alert(
                  `Current Space:\nID: ${spaceId}\nName: ${name}\n\nCheck console for verification steps. Make sure this matches the space you published to!`,
                );
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Verify Space
            </button>
            <button
              onClick={() => {
                refetchAllEntities();
                alert('Refreshing data... Please wait 30 seconds and check again.');
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Force Refresh
            </button>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Hard Refresh Page
            </button>
          </div>
        </div>

        {/* Entities Grid */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">All Entities</h2>
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 text-sm">{allEntities.length} entities available</div>

              {/* Schema Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${allEntities.length > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-gray-400">{allEntities.length > 0 ? 'Data Available' : 'No Data'}</span>
              </div>

              {/* Sorting Controls */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'recent')}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="name">Sort by Name</option>
                  <option value="type">Sort by Type</option>
                  <option value="recent">Sort by Recent</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors flex items-center space-x-1"
                >
                  <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
                </button>
              </div>
            </div>
          </div>

          {allEntities.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-semibold text-gray-300 mb-4">No Entities Available</h3>
              <div className="text-gray-400 mb-8 max-w-md mx-auto space-y-2">
                <p>This could be due to:</p>
                <ul className="text-sm space-y-1">
                  <li>• Schema changes requiring republishing</li>
                  <li>• Data still indexing after schema update</li>
                  <li>• Version mismatch between old and new entities</li>
                  <li>• No data has been published to this space yet</li>
                </ul>
              </div>
              <div className="flex justify-center space-x-4">
                <Link
                  to="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Explore Other Spaces
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEntities.map((entity, index) => {
                const config = entityTypes[entity.entityType as keyof typeof entityTypes];
                const entityMapping = mapping[entity.entityType as keyof typeof mapping];
                const hasSchemaIssues =
                  entityMapping &&
                  entityMapping.properties &&
                  Object.keys(entityMapping.properties || {}).some(
                    (prop) =>
                      !(entity as any).hasOwnProperty(prop) ||
                      (entity as any)[prop] === undefined ||
                      (entity as any)[prop] === null,
                  );

                return (
                  <div
                    key={index}
                    className={`bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200 group ${
                      hasSchemaIssues ? 'border-yellow-500/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center mr-3`}
                        >
                          <span className="text-white text-lg">{config.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {getEntityDisplayName(entity)}
                          </h3>
                          <p className="text-gray-400 text-sm">{entity.entityType}</p>
                          {hasSchemaIssues && <p className="text-yellow-400 text-xs">⚠️ Schema issues detected</p>}
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
                      <p className="text-gray-300 text-sm">{getEntityDescription(entity)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <div className="text-gray-500 text-sm">Entity #{index + 1}</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUnsetEntity(entity)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1"
                        >
                          <span>🗑️</span>
                          <span>Unset</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
