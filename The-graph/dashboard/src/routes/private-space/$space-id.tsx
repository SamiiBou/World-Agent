import { Account, WorldID, SelfID, VCProof, TokenHolding, TransferEvents } from '@/schema';
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
  useHypergraphAuth,
} from '@graphprotocol/hypergraph-react';
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
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
  const { authenticated, identity } = useHypergraphAuth();

  // Add sorting state
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'recent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Add authentication debugging state
  const [authDebug, setAuthDebug] = useState<{
    smartSessionClient: string | null;
    error: string | null;
    loading: boolean;
  }>({
    smartSessionClient: null,
    error: null,
    loading: true,
  });

  // Test smart session client
  const { getSmartSessionClient } = useHypergraphApp();

  // Test authentication on mount
  useEffect(() => {
    const testAuth = async () => {
      try {
        const client = await getSmartSessionClient();
        setAuthDebug({
          smartSessionClient: client ? 'Available' : 'Not available',
          error: null,
          loading: false,
        });
      } catch (error) {
        console.error('Authentication test error:', error);
        setAuthDebug({
          smartSessionClient: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        });
      }
    };

    testAuth();
  }, [getSmartSessionClient]);

  // Query all entity types - Updated to include refetch functions
  const { data: accounts, refetch: refetchAccounts } = useQuery(Account, { mode: 'private' });
  const { data: worldIDs, refetch: refetchWorldIDs } = useQuery(WorldID, { mode: 'private' });
  const { data: selfIDs, refetch: refetchSelfIDs } = useQuery(SelfID, { mode: 'private' });
  const { data: vcProofs, refetch: refetchVCProofs } = useQuery(VCProof, { mode: 'private' });
  const { data: tokenHoldings, refetch: refetchTokenHoldings } = useQuery(TokenHolding, { mode: 'private' });
  const { data: transferEvents, refetch: refetchTransferEvents } = useQuery(TransferEvents, { mode: 'private' });

  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [isAddingEntity, setIsAddingEntity] = useState(false);

  // Add verification popup state
  const [verificationState, setVerificationState] = useState<{
    isOpen: boolean;
    entity: any;
    targetSpace: string;
    currentStep: number;
    isVerifying: boolean;
    verificationComplete: boolean;
    error: string | null;
  }>({
    isOpen: false,
    entity: null,
    targetSpace: '',
    currentStep: 0,
    isVerifying: false,
    verificationComplete: false,
    error: null,
  });

  const [entityData, setEntityData] = useState<{
    Account: { name: string; description: string; address: string };
    WorldID: { address: string; timestamp: string; type: string };
    SelfID: { address: string; did: string };
    VCProof: { proofHash: string; issuer: string; type: string };
    TokenHolding: { address: string; token: string; amount: string; network: string };
    TransferEvents: { from: string; to: string; token: string; amount: string; timestamp: string };
  }>({
    Account: { name: '', description: '', address: '' },
    WorldID: { address: '', timestamp: '', type: '' },
    SelfID: { address: '', did: '' },
    VCProof: { proofHash: '', issuer: '', type: '' },
    TokenHolding: { address: '', token: '', amount: '', network: '' },
    TransferEvents: { from: '', to: '', token: '', amount: '', timestamp: '' },
  });

  // Add JSON parser state
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState('');
  const [parseSuccess, setParseSuccess] = useState('');

  // Create entity hooks for all types
  const createAccount = useCreateEntity(Account);
  const createWorldID = useCreateEntity(WorldID);
  const createSelfID = useCreateEntity(SelfID);
  const createVCProof = useCreateEntity(VCProof);
  const createTokenHolding = useCreateEntity(TokenHolding);
  const createTransferEvents = useCreateEntity(TransferEvents);

  const deleteEntity = useDeleteEntity({ space: spaceId });

  // Define getEntityDisplayName function here, before it's used in sorting
  const getEntityDisplayName = (entity: any) => {
    return entity.entityType || 'Entity';
  };

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

  // Add refetch function for all entities
  const refetchAllEntities = () => {
    console.log('=== REFETCH DEBUG START ===');
    console.log('Refreshing all private entities...');
    console.log('Current entity counts:', {
      accounts: accounts?.length || 0,
      worldIDs: worldIDs?.length || 0,
      selfIDs: selfIDs?.length || 0,
      vcProofs: vcProofs?.length || 0,
      tokenHoldings: tokenHoldings?.length || 0,
      transferEvents: transferEvents?.length || 0,
      total: allEntities.length,
    });

    try {
      console.log('Calling refetch functions...');
      refetchAccounts();
      refetchWorldIDs();
      refetchSelfIDs();
      refetchVCProofs();
      refetchTokenHoldings();
      refetchTransferEvents();
      console.log('All refetch functions called successfully');
    } catch (error) {
      console.error('Error during refetch:', error);
    }
  };

  // Entity type configurations
  const entityTypes = {
    Account: {
      fields: [
        { name: 'name', type: 'text', placeholder: 'Enter account name...', label: 'Account Name' },
        { name: 'description', type: 'text', placeholder: 'Enter account description...', label: 'Description' },
        { name: 'address', type: 'text', placeholder: 'Enter account address...', label: 'Address' },
      ],
      icon: '👤',
      color: 'from-indigo-500 to-blue-500',
      title: 'Account',
      description: 'Create and manage account profiles',
    },
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

  // Check authentication first
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <div className="text-white text-xl font-semibold">Authentication Required</div>
          <div className="text-gray-400 mt-2">Please connect your wallet to access private spaces</div>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <div className="text-white text-xl font-semibold">Loading Private Space...</div>
          <div className="text-gray-400 mt-2">Please wait while we secure your connection</div>
          <div className="text-gray-500 mt-4 text-sm">
            Auth Status: {authenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
          </div>
          <div className="text-gray-500 mt-1 text-sm">Identity: {identity ? '✅ Available' : '❌ Missing'}</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('=== ENTITY CREATION DEBUG ===');
    console.log('Current entityData:', entityData);

    const createdEntities: string[] = [];

    try {
      // Check each entity type for filled data and create entities
      for (const [entityType, data] of Object.entries(entityData)) {
        const config = entityTypes[entityType as keyof typeof entityTypes];

        // Check if this entity type has any filled data
        const hasFilledData = config.fields.some((field) => {
          const value = (data as any)[field.name];
          return value && value.toString().trim() !== '';
        });

        if (hasFilledData) {
          console.log(`Creating ${entityType} with data:`, data);

          try {
            switch (entityType) {
              case 'Account':
                await createAccount(data as any);
                break;
              case 'WorldID':
                await createWorldID({
                  address: (data as any).address,
                  timestamp: parseInt((data as any).timestamp) || 0,
                  type: (data as any).type,
                });
                break;
              case 'SelfID':
                await createSelfID(data as any);
                break;
              case 'VCProof':
                await createVCProof(data as any);
                break;
              case 'TokenHolding':
                await createTokenHolding({
                  address: (data as any).address,
                  token: (data as any).token,
                  amount: parseFloat((data as any).amount) || 0,
                  network: (data as any).network,
                });
                break;
              case 'TransferEvents':
                await createTransferEvents({
                  from: (data as any).from,
                  to: (data as any).to,
                  token: (data as any).token,
                  amount: parseFloat((data as any).amount) || 0,
                  timestamp: parseInt((data as any).timestamp) || 0,
                });
                break;
              default:
                console.warn(`Unknown entity type: ${entityType}`);
                continue;
            }

            createdEntities.push(entityType);
            console.log(`Successfully created ${entityType}`);
          } catch (entityError) {
            console.error(`Error creating ${entityType}:`, entityError);
            throw new Error(`Failed to create ${entityType}: ${(entityError as any)?.message || 'Unknown error'}`);
          }
        }
      }

      if (createdEntities.length === 0) {
        alert('Please fill in at least one entity form before submitting.');
        return;
      }

      console.log(`Successfully created ${createdEntities.length} entities:`, createdEntities);
      alert(`Successfully created ${createdEntities.length} entities: ${createdEntities.join(', ')}`);

      // Reset form and close modal
      setEntityData({
        Account: { name: '', description: '', address: '' },
        WorldID: { address: '', timestamp: '', type: '' },
        SelfID: { address: '', did: '' },
        VCProof: { proofHash: '', issuer: '', type: '' },
        TokenHolding: { address: '', token: '', amount: '', network: '' },
        TransferEvents: { from: '', to: '', token: '', amount: '', timestamp: '' },
      });
      setIsAddingEntity(false);

      // Refresh entities
      setTimeout(() => refetchAllEntities(), 1000);
    } catch (error) {
      console.error('Error creating entities:', error);
      console.error('Error details:', {
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
      });
      alert(`Error creating entities: ${(error as any)?.message || 'Unknown error'}`);
    }
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

  // Add JSON parser function
  const parseJsonData = () => {
    setParseError('');
    setParseSuccess('');

    if (!jsonInput.trim()) {
      setParseError('Please enter JSON data to parse');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput.trim());
      console.log('Parsed JSON:', parsed);

      // Handle array of entities or single entity
      const entities = Array.isArray(parsed) ? parsed : [parsed];
      let parsedCount = 0;

      // Create a copy of current entity data
      const newEntityData = { ...entityData };

      entities.forEach((entity) => {
        // Try to determine entity type and map fields
        if (entity.entityType && entityTypes[entity.entityType as keyof typeof entityTypes]) {
          // Direct mapping with entityType specified
          const entityType = entity.entityType as keyof typeof entityData;
          const config = entityTypes[entityType];

          const mappedData: Record<string, string> = {};
          config.fields.forEach((field) => {
            if (entity[field.name] !== undefined) {
              mappedData[field.name] = String(entity[field.name]);
            }
          });

          if (Object.keys(mappedData).length > 0) {
            newEntityData[entityType] = { ...newEntityData[entityType], ...mappedData } as any;
            parsedCount++;
          }
        } else {
          // Smart mapping based on field names
          Object.entries(entityTypes).forEach(([entityType, config]) => {
            const typeKey = entityType as keyof typeof entityData;
            const mappedData: Record<string, string> = {};
            let matchedFields = 0;

            config.fields.forEach((field) => {
              if (entity[field.name] !== undefined) {
                mappedData[field.name] = String(entity[field.name]);
                matchedFields++;
              }
            });

            // If we matched at least half the fields, consider it a match for this entity type
            if (matchedFields >= Math.ceil(config.fields.length / 2)) {
              newEntityData[typeKey] = { ...newEntityData[typeKey], ...mappedData } as any;
              parsedCount++;
            }
          });
        }
      });

      if (parsedCount > 0) {
        setEntityData(newEntityData);
        setParseSuccess(`Successfully parsed and populated ${parsedCount} entity type(s)!`);
        setJsonInput(''); // Clear the input after successful parse
      } else {
        setParseError('No matching entity fields found in the JSON data');
      }
    } catch (error) {
      setParseError(`Invalid JSON format: ${(error as Error).message}`);
    }
  };

  // Add sample data generator
  const generateSampleData = () => {
    const sampleData = [
      {
        entityType: 'Account',
        name: 'My Account',
        description: 'This is my personal account',
        address: '0x1234567890abcdef1234567890abcdef12345678',
      },
      {
        entityType: 'WorldID',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        timestamp: '1703097600',
        type: 'human',
      },
      {
        entityType: 'SelfID',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        did: 'did:example:self123',
      },
      {
        entityType: 'TokenHolding',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        token: 'ETH',
        amount: '1.5',
        network: 'ethereum',
      },
      {
        entityType: 'VCProof',
        proofHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        issuer: 'did:example:issuer123',
        type: 'ProofOfResidence',
      },
      {
        entityType: 'TransferEvents',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef123456890abcdef123',
        token: 'ETH',
        amount: '1.5',
        timestamp: '1703097600',
      },
    ];
    setJsonInput(JSON.stringify(sampleData, null, 2));
  };

  const publishToPublicSpace = async (entity: any) => {
    if (!selectedSpace) {
      alert('No space selected');
      return;
    }

    // Show verification popup instead of publishing directly
    setVerificationState({
      isOpen: true,
      entity: entity,
      targetSpace: selectedSpace,
      currentStep: 0,
      isVerifying: false,
      verificationComplete: false,
      error: null,
    });
  };

  // Add verification steps
  const verificationSteps = [
    {
      title: 'Validating Entity Data',
      description: 'Checking entity structure and required fields',
      icon: '📋',
      duration: 1500,
    },
    {
      title: 'Verifying Credentials',
      description: 'Validating verifiable credentials and proofs',
      icon: '🔐',
      duration: 2000,
    },
    {
      title: 'Checking Permissions',
      description: 'Ensuring publication rights to target space',
      icon: '🔑',
      duration: 1200,
    },
    {
      title: 'Preparing Publication',
      description: 'Finalizing data for public space publication',
      icon: '📤',
      duration: 1000,
    },
  ];

  // Handle verification process
  const handleVerification = async () => {
    setVerificationState((prev) => ({ ...prev, isVerifying: true, error: null }));

    try {
      // Simulate verification steps
      for (let i = 0; i < verificationSteps.length; i++) {
        setVerificationState((prev) => ({ ...prev, currentStep: i }));
        await new Promise((resolve) => setTimeout(resolve, verificationSteps[i].duration));
      }

      setVerificationState((prev) => ({ ...prev, verificationComplete: true }));

      // Wait a moment to show completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Actually publish the entity
      const { ops } = await preparePublish({
        entity: verificationState.entity,
        publicSpace: verificationState.targetSpace,
      });
      const smartSessionClient = await getSmartSessionClient();
      if (!smartSessionClient) {
        throw new Error('Missing smartSessionClient');
      }
      const publishResult = await publishOps({
        ops,
        space: verificationState.targetSpace,
        name: `Publish ${verificationState.entity.entityType}`,
        walletClient: smartSessionClient,
      });

      console.log(publishResult, ops);

      // Close verification popup and show success
      setVerificationState((prev) => ({ ...prev, isOpen: false }));
      alert(`${verificationState.entity.entityType} published to public space successfully!`);
    } catch (error) {
      console.error('Verification/Publication error:', error);
      setVerificationState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isVerifying: false,
      }));
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
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Add New Entities</h2>
              <p className="text-gray-400 mb-8">
                Fill in any combination of entity types below or use the JSON parser to auto-populate forms.
              </p>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* JSON Parser Section */}
                <div className="xl:col-span-1">
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10 sticky top-0">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-lg">🔧</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">JSON Parser</h3>
                        <p className="text-gray-400 text-sm">Auto-fill forms from JSON data</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-semibold mb-2">Paste JSON Data</label>
                        <textarea
                          value={jsonInput}
                          onChange={(e) => {
                            setJsonInput(e.target.value);
                            setParseError('');
                            setParseSuccess('');
                          }}
                          className="w-full h-48 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 font-mono text-sm resize-none"
                          placeholder={`[
  {
    "entityType": "WorldID",
    "address": "0x123...",
    "timestamp": "1703097600",
    "type": "human"
  },
  {
    "entityType": "TokenHolding",
    "address": "0x123...",
    "token": "ETH",
    "amount": "1.5",
    "network": "ethereum"
  }
]`}
                        />
                      </div>

                      {parseError && (
                        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                          <div className="flex items-center">
                            <span className="text-red-400 text-lg mr-2">❌</span>
                            <span className="text-red-300 text-sm">{parseError}</span>
                          </div>
                        </div>
                      )}

                      {parseSuccess && (
                        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                          <div className="flex items-center">
                            <span className="text-green-400 text-lg mr-2">✅</span>
                            <span className="text-green-300 text-sm">{parseSuccess}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={parseJsonData}
                          disabled={!jsonInput.trim()}
                          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                        >
                          Parse & Fill Forms
                        </button>
                        <button
                          type="button"
                          onClick={generateSampleData}
                          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Load Sample Data
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setJsonInput('');
                            setParseError('');
                            setParseSuccess('');
                          }}
                          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Clear JSON
                        </button>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                        <h4 className="text-blue-300 font-semibold text-sm mb-2">💡 Tips:</h4>
                        <ul className="text-blue-200 text-xs space-y-1">
                          <li>• Include "entityType" field for direct mapping</li>
                          <li>• Use arrays for multiple entities</li>
                          <li>• Field names must match exactly</li>
                          <li>• Numbers can be strings or numbers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="xl:col-span-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(entityTypes).map(([entityType, config]) => {
                      const typeKey = entityType as keyof typeof entityData;
                      const hasData = config.fields.some(
                        (field) =>
                          (entityData[typeKey] as any)[field.name] &&
                          (entityData[typeKey] as any)[field.name].trim() !== '',
                      );

                      return (
                        <div
                          key={entityType}
                          className={`bg-white/5 rounded-lg p-6 border transition-all duration-200 ${
                            hasData ? 'border-green-500/50 bg-green-900/10' : 'border-white/10'
                          }`}
                        >
                          <div className="flex items-center mb-4">
                            <div
                              className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center mr-3`}
                            >
                              <span className="text-white text-lg">{config.icon}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                                {hasData && (
                                  <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                    Filled
                                  </span>
                                )}
                              </div>
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
                          Account: { name: '', description: '', address: '' },
                          WorldID: { address: '', timestamp: '', type: '' },
                          SelfID: { address: '', did: '' },
                          VCProof: { proofHash: '', issuer: '', type: '' },
                          TokenHolding: { address: '', token: '', amount: '', network: '' },
                          TransferEvents: { from: '', to: '', token: '', amount: '', timestamp: '' },
                        });
                        setJsonInput('');
                        setParseError('');
                        setParseSuccess('');
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
          </div>
        )}

        {/* VC Verification Modal */}
        {verificationState.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl">🔍</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Verifying Credentials</h2>
                  <p className="text-gray-400 text-sm">
                    Validating your {verificationState.entity?.entityType} data before publication
                  </p>
                </div>

                {/* Verification Steps */}
                <div className="space-y-3 mb-6">
                  {verificationSteps.map((step, index) => {
                    const isActive = verificationState.currentStep === index && verificationState.isVerifying;
                    const isComplete = verificationState.currentStep > index || verificationState.verificationComplete;
                    const isPending = verificationState.currentStep < index && !verificationState.verificationComplete;

                    return (
                      <div
                        key={index}
                        className={`flex items-center p-3 rounded-lg border transition-all duration-300 ${
                          isActive
                            ? 'border-blue-500/50 bg-blue-900/20'
                            : isComplete
                              ? 'border-green-500/50 bg-green-900/20'
                              : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                            isActive ? 'bg-blue-500 animate-pulse' : isComplete ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          {isActive ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : isComplete ? (
                            <span className="text-white text-sm">✓</span>
                          ) : (
                            <span className="text-white text-sm">{step.icon}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold text-sm ${
                              isActive ? 'text-blue-300' : isComplete ? 'text-green-300' : 'text-gray-300'
                            }`}
                          >
                            {step.title}
                          </h3>
                          <p
                            className={`text-xs ${
                              isActive ? 'text-blue-400' : isComplete ? 'text-green-400' : 'text-gray-400'
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                        {isActive && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                                style={{ animationDelay: '0.1s' }}
                              ></div>
                              <div
                                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Verification Progress</span>
                    <span className="text-xs text-gray-400">
                      {verificationState.verificationComplete
                        ? '100%'
                        : `${Math.round((verificationState.currentStep / verificationSteps.length) * 100)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: verificationState.verificationComplete
                          ? '100%'
                          : `${(verificationState.currentStep / verificationSteps.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Error Display */}
                {verificationState.error && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <span className="text-red-400 text-lg mr-2 flex-shrink-0">❌</span>
                      <div>
                        <h4 className="text-red-300 font-semibold text-sm">Verification Failed</h4>
                        <p className="text-red-400 text-xs mt-1">{verificationState.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {verificationState.verificationComplete && !verificationState.error && (
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <span className="text-green-400 text-lg mr-2 flex-shrink-0">✅</span>
                      <div>
                        <h4 className="text-green-300 font-semibold text-sm">Verification Complete</h4>
                        <p className="text-green-400 text-xs mt-1">
                          Your credentials have been validated successfully!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Entity Info */}
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 mb-6">
                  <h4 className="text-white font-semibold text-sm mb-2">Publishing Details</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>
                      Entity Type: <span className="text-white">{verificationState.entity?.entityType}</span>
                    </p>
                    <p>
                      Target Space:{' '}
                      <span className="text-white">
                        {publicSpaces?.find((s) => s.id === verificationState.targetSpace)?.name || 'Unknown'}
                      </span>
                    </p>
                    <p>
                      Verification Required: <span className="text-green-400">✓ VC Proof Required</span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 sticky bottom-0 bg-white/10 backdrop-blur-sm p-3 -mx-6 -mb-6 rounded-b-xl border-t border-white/10">
                  <button
                    onClick={() => setVerificationState((prev) => ({ ...prev, isOpen: false }))}
                    disabled={verificationState.isVerifying}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Cancel
                  </button>
                  {!verificationState.isVerifying &&
                    !verificationState.verificationComplete &&
                    !verificationState.error && (
                      <button
                        onClick={handleVerification}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        Start Verification
                      </button>
                    )}
                  {verificationState.error && (
                    <button
                      onClick={handleVerification}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                    >
                      Retry Verification
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Station */}
        <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 mb-8">
          <h3 className="text-lg font-semibold text-red-400 mb-4"> Stats Station (for hackathon testing/demo only)</h3>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-yellow-300 font-semibold text-sm mb-2">🔍 Troubleshooting Private Space Loading</h4>
            <div className="text-yellow-200 text-xs space-y-1">
              <p>• Check if Authentication shows all ✅ - if not, wallet connection is needed</p>
              <p>• Check if Space Status shows Ready: ✅ - if not, space may not exist or be inaccessible</p>
              <p>• Use browser console to see detailed debug logs</p>
              <p>• Try the debug buttons below to gather more information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-sm text-gray-400">Authentication</div>
              <div className="text-white font-mono">Auth: {authenticated ? '✅' : '❌'}</div>
              <div className="text-white font-mono">Identity: {identity ? '✅' : '❌'}</div>
              <div className="text-white font-mono">
                Client: {authDebug.loading ? '⏳' : authDebug.smartSessionClient ? '✅' : '❌'}
              </div>
              {authDebug.error && <div className="text-red-400 font-mono text-xs mt-1">Error: {authDebug.error}</div>}
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-sm text-gray-400">Space Status</div>
              <div className="text-white font-mono">Ready: {ready ? '✅' : '❌'}</div>
              <div className="text-white font-mono">Name: {name || 'N/A'}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="text-sm text-gray-400">Entity Counts</div>
              <div className="text-white font-mono">Account: {accounts?.length || 0}</div>
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
                console.log('Current state:', { ready, name, spaceId, authenticated, identity });
                console.log('Auth debug:', authDebug);
                console.log('Raw query data:', {
                  accounts,
                  worldIDs,
                  selfIDs,
                  vcProofs,
                  tokenHoldings,
                  transferEvents,
                });
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
                console.log('Schema entities:', { Account, WorldID, SelfID, VCProof, TokenHolding, TransferEvents });
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Check Mapping
            </button>
            <button
              onClick={() => {
                console.log('=== SPACE ID DEBUG ===');
                console.log('Current space ID:', spaceId);
                console.log('Space ID type:', typeof spaceId);
                console.log('Space ID length:', spaceId.length);
                console.log('URL params:', Route.useParams());
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Check Space ID
            </button>
          </div>
        </div>

        {/* Entities Grid */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">All Entities</h2>
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 text-sm">{allEntities.length} entities in this space</div>

              {/* Sorting Controls */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'recent')}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
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
              {sortedEntities.map((entity, index) => {
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
      </div>
    </div>
  );
}
