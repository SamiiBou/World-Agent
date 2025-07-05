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
  const { getSmartSessionClient } = useHypergraphApp();
  const deleteAcademicField = useDeleteEntity({ space: spaceId });

  if (!ready) {
    return <div>Loading...</div>;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createAddress({ name: addressName, description: 'Beautiful academicField' });
    setAddressName('');
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

  return (
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold">{name}</h1>
      <form onSubmit={handleSubmit}>
        <label className="flex flex-col">
          <span className="text-sm font-bold">AcademicField</span>
          <input type="text" value={addressName} onChange={(e) => setAddressName(e.target.value)} />
        </label>
        <button type="submit">Create AcademicField</button>
      </form>

      <ul>
        {academicFields?.map((academicField) => (
          <li key={academicField.id}>
            {academicField.name}
            <select value={selectedSpace} onChange={(e) => setSelectedSpace(e.target.value)}>
              <option value="">Select a space</option>
              {publicSpaces?.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <button onClick={() => publishToPublicSpace(academicField)}>Publish</button>
            <button
              className="text-red-500"
              onClick={() => {
                if (confirm('Delete this account?')) {
                  deleteAcademicField(academicField.id);
                }
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
