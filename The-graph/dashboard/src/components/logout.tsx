import { useHypergraphApp, useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { useRouter } from '@tanstack/react-router';

export function Logout() {
  const { logout } = useHypergraphApp();
  const { authenticated } = useHypergraphAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.navigate({
      to: '/login',
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={!authenticated}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
    >
      Logout
    </button>
  );
}
