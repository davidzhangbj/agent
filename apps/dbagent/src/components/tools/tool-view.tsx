'use client';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@internal/components';
import { ArrowLeft, PlayCircle, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { actionDeleteCustomQueryToolByName, actionGetCustomQueryToolByName, Tool } from './action';

export function ToolView({ tool }: { tool: Tool }) {
  const { project } = useParams<{ project: string }>();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sql, setSQL] = useState<string | null>(null);

  const handleDeleteServer = async () => {
    try {
      await actionDeleteCustomQueryToolByName(tool.name);
      router.push(`/projects/${project}/tools`);
    } catch (error) {
      console.error('Error deleting server:', error);
      setError('Failed to delete server. Please try again later.');
    }
  };

  useEffect(() => {
    if (tool.customType === 'QUERY') {
      actionGetCustomQueryToolByName(tool.name).then((data) => {
        setSQL(data?.script as string);
      });
    }
  }, []);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="items-left mb-6 flex justify-between">
        <Button variant="ghost" className="flex items-center pl-0" asChild>
          <Link href={`/projects/${project}/tools`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tool: {tool.name}</CardTitle>
          <CardDescription>
            <p className="text-muted-foreground">{tool.description}</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted prose prose-sm whitespace-pre-wrap rounded-md p-4">{sql || tool.description}</div>
          {error && <p className="text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pt-6">
          <div className="flex gap-2">
            {tool.customType === 'QUERY' && (
              <>
                {!showDeleteConfirm ? (
                  <Button className="mr-2" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Delete Tool
                  </Button>
                ) : (
                  <>
                    <Button variant="destructive" onClick={handleDeleteServer}>
                      Confirm Delete
                    </Button>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel Delete
                    </Button>
                  </>
                )}
              </>
            )}
            <Link href={`/projects/${project}/chats/new?tool=${tool.name}`}>
              <Button>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run Tool
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
