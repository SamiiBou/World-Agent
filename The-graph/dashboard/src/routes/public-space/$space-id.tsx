import { AcademicField } from '@/schema';
import { HypergraphSpaceProvider, useQuery, useSpace } from '@graphprotocol/hypergraph-react';
import { createFileRoute } from '@tanstack/react-router';

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
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold">{name}</h1>
      <ul>
        {academicFields?.map((academicField) => (
          <li key={academicField.id}>{academicField.name}</li>
        ))}
      </ul>
    </div>
  );
}
