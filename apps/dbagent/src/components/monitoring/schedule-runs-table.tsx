'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@internal/components';
import { format } from 'date-fns';
import { Calendar, ChevronDown, ChevronRight, Clock, MessageSquare, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Schedule, ScheduleRun } from '~/lib/db/schema-sqlite';
import { actionGetScheduleRuns } from './actions';

export function ScheduleRunsTable({ schedule }: { schedule: Schedule }) {
  const [isLoading, setIsLoading] = useState(true);
  const [runs, setRuns] = useState<ScheduleRun[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const { project } = useParams<{ project: string }>();

  useEffect(() => {
    const fetchRuns = async () => {
      setIsLoading(true);
      try {
        const runs = await actionGetScheduleRuns(schedule.id);
        setRuns(runs);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRuns();
  }, [schedule.id]);

  const toggleExpandRow = (runId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [runId]: !prev[runId]
    }));
  };

  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      <div className="container mx-auto space-y-6 py-6">
        <h1 className="text-3xl font-bold tracking-tight">Schedule Runs</h1>
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <PlayCircle className="h-4 w-4" />
                  <span>Agent</span>
                </div>
                <div className="font-medium">{schedule.playbook}</div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Schedule (cron)</span>
                </div>
                <div className="font-mono font-medium">
                  {schedule.scheduleType === 'cron' ? schedule.cronExpression : 'Automatic'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">Status</div>
                <div>{schedule.status}</div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Last Run</span>
                </div>
                <div className="font-medium">
                  {schedule.lastRun ? format(schedule.lastRun, 'yyyy-MM-dd HH:mm:ss') : '-'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Next Run</span>
                </div>
                <div className="font-medium">{schedule.nextRun ? schedule.nextRun : 'Not scheduled'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Run History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Timestamp</TableHead>
                    {/* <TableHead>Level</TableHead> */}
                    <TableHead className="w-[50%]">Summary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : runs.length === 0 ? (
                    <>
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                          No runs yet
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    runs.map((run) => (
                      <React.Fragment key={run.id}>
                        <TableRow
                          key={run.id}
                          className={cn(
                            'hover:bg-muted/50 cursor-pointer',
                            expandedRows[run.id] && 'bg-muted/50 border-b-0'
                          )}
                          onClick={() => toggleExpandRow(run.id)}
                        >
                          <TableCell className="p-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {expandedRows[run.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{format(run.createdAt, 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                          <TableCell>{run.summary}</TableCell>
                          <TableCell className="text-right">
                            <button className="" onClick={(e) => e.stopPropagation()}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link href={`/projects/${project}/chats/new?scheduleRun=${run.id}`}>
                                      <MessageSquare className="h-4 w-4" />
                                      <span className="sr-only">Load in chat</span>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Load in chat</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </button>
                          </TableCell>
                        </TableRow>
                        {expandedRows[run.id] && (
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={5} className="p-0">
                              <div className="border-t px-8 py-4">
                                <div className="bg-card rounded-md border p-4">
                                  <ReactMarkdown>{run.result}</ReactMarkdown>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
