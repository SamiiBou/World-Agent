import { useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { createRootRoute, Link, Outlet, useLayoutEffect, useRouter } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Logout } from '../components/logout';

const Root = () => {
  const { authenticated } = useHypergraphAuth();
  const router = useRouter();

  useLayoutEffect(() => {
    if (
      router.state.location.href.startsWith('/login') ||
      router.state.location.href.startsWith('/authenticate-success')
    ) {
      return;
    }

    if (!authenticated) {
      router.navigate({
        to: '/login',
      });
    }
  }, [authenticated, router]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Navigation */}
        <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AE</span>
                </div>
                <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Agent Explorer
                </span>
              </Link>

              <div className="flex items-center space-x-6">
                <Link to="/" className="text-gray-300 hover:text-white transition-colors font-medium">
                  Public Spaces
                </Link>
                <Link to="/private-spaces" className="text-gray-300 hover:text-white transition-colors font-medium">
                  Private Spaces
                </Link>
                <div className="w-px h-6 bg-gray-600"></div>
                <Logout />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRoute({
  component: Root,
});
