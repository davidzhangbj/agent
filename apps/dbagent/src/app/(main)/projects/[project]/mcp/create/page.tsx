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
  type: z.enum(['sse', 'stdio']),
  name: z.string(),
  filePath: z.string().optional(),
  env: z.array(z.array(z.string()).length(2)).optional()
});

export default function CreateMcpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envOpen, setEnvOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'sse',
      name: '',
      filePath: '',
      env: []
    }
  });

  const type = form.watch('type');

  const { fields, append, remove } = useFieldArray({
    name: 'env',
    control: form.control
  });

  const onValidate = async () => {
    setIsValidating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/mcp/servers/validate', {
        method: 'POST',
        body: JSON.stringify(form.getValues())
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || JSON.stringify(errorData));
      }
      setSuccessMessage('Validation successful');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mcp/servers/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || JSON.stringify(errorData));
      } else {
        router.back();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类型</FormLabel>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" {...field} value="sse" checked={field.value === 'sse'} />
                      SSE
                    </label>
                    {/* <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...field}
                        value="stdio"
                        checked={field.value === 'stdio'}
                      />
                      STDIO
                    </label> */}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="filePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>命令或者 URL </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {type === 'stdio' && (
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
                    </div>
                  ))}
                  <Button type="button" className="mt-3 w-full" variant="ghost" onClick={() => append(['', ''])}>
                    Add Environment Variable
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            )}
            {error && <div className="text-destructive text-sm">{error}</div>}
            {successMessage && <div className="text-sm text-green-600">{successMessage}</div>}
            <div className="mt-3 flex justify-start gap-4">
              {type === 'sse' && (
                <Button type="button" onClick={onValidate} disabled={isValidating}>
                  {isValidating ? 'Validating...' : 'Validate'}
                </Button>
              )}
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
