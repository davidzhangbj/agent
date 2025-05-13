'use client';

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  useFieldArray,
  useForm,
  zodResolver
} from '@internal/components';
import { ChevronDown, ChevronRight, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string(),
  args: z.string().optional(),
  env: z.array(z.array(z.string()).length(2))
});

export default function CreateMcpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envOpen, setEnvOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  });

  const { fields, append, remove } = useFieldArray({
    name: 'env',
    control: form.control
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mcp/servers/install', { method: 'POST', body: JSON.stringify(data) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData || 'Failed to upload file');
      } else {
        router.back();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to install mcp');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create MCP Server</h1>
        <p className="text-muted-foreground mt-2">Configure to create a new MCP server.</p>
      </div>

      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="args"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>args</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Collapsible onOpenChange={setEnvOpen} open={envOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="hover:bg-accent hover:text-accent-foreground mt-3 flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2">
                  {envOpen ? <ChevronDown /> : <ChevronRight />}
                  Environment Variables
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {fields.map((field, index) => (
                  <div className="mt-3 flex w-full gap-2" key={field.id}>
                    <div className="flex-1">
                      <Input {...form.register(`env.${index}.${0}`)} placeholder="your environment variable key" />
                    </div>
                    <div className="flex-1">
                      <Input {...form.register(`env.${index}.${1}`)} placeholder="your environment variable value" />
                    </div>
                    <Button type="button" variant="destructive" onClick={() => remove(index)}>
                      <Trash2Icon />
                    </Button>
                    {/* <Button type="button" variant="outline">
                      <EyeOffIcon />
                    </Button> */}
                  </div>
                ))}
                <Button type="button" className="mt-3 w-full" variant="ghost" onClick={() => append([''])}>
                  Add Environment Variable
                </Button>
              </CollapsibleContent>
            </Collapsible>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <div className="mt-3 flex justify-start gap-4">
              <Button type="submit">{isSubmitting ? 'Installing...' : 'Install MCP Server'}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
