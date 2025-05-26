import { notFound } from 'next/navigation';
import { actionGetUserMcpServer } from '~/components/mcp/action';
import { McpView } from '~/components/mcp/mcp-view';
import { UserMcpServer } from '~/lib/tools/user-mcp-servers';

type PageParams = {
  project: string;
  server: string;
};

export default async function McpServerPage({ params }: { params: Promise<PageParams> }) {
  const { server: serverId } = await params;
  const serverName = decodeURIComponent(serverId);

  let server: UserMcpServer | null = null;

  try {
    server = await actionGetUserMcpServer(serverName);
  } catch (error) {
    // Ignore database errors, we'll use the local file data
    console.error('Error fetching server from database:', error);
  }

  if (!server) {
    notFound();
  }

  return (
    <div className="container">
      <McpView server={server} />
    </div>
  );
}
