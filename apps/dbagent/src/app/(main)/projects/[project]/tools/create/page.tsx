'use client';

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  useForm,
  zodResolver
} from '@internal/components';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql';
import 'codemirror/theme/material.css';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  script: z.string()
});

export default function CreateMcpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeMirrorRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    require('codemirror/mode/sql/sql');
    const CodeMirror = require('codemirror');
    editorRef.current = CodeMirror.fromTextArea(codeMirrorRef.current, {
      lineNumbers: true,
      lineWrapping: true,
      mode: 'sql',
      theme: 'material',
      defaultValue: '-- your sql'
    });
    return () => {
      if (editorRef.current) {
        (editorRef.current as any).toTextArea?.();
        editorRef.current = null;
      }
    };
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      script: 'select * from db;'
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const script = (editorRef.current as any).getValue();
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/tool/custom', { method: 'POST', body: JSON.stringify({ ...data, script }) });
      if (!response.ok) {
        throw new Error(await response.json());
      } else {
        router.back();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create Custom SQL Tool</h1>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <section className="mt-4">
              <textarea ref={codeMirrorRef}></textarea>
            </section>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <div className="mt-3 flex justify-start gap-4">
              <Button type="submit">{isSubmitting ? 'Creating...' : 'Create'}</Button>
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
