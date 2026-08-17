'use client';

import Link from 'next/link';
import { FilePenLine, Pencil, Plus, Save } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AdminGuideArtifact } from '@/lib/admin-guide-scenarios';
import { TOUR_CREATE_HREF, tourEditHref } from '@/lib/admin-routes';

const TOUR_CLIENT_OPTIONS = [
  'Grand River Hospital Foundation',
  'Grande Prairie Regional Hospital Foundation',
  'Cancer Research Society',
  'CIHE',
] as const;

function GuideTourDraftCard({
  artifact,
}: {
  artifact: Extract<AdminGuideArtifact, { type: 'tour-draft' }>;
}) {
  const id = useId();
  const [title, setTitle] = useState(artifact.title);
  const [client, setClient] = useState(artifact.client);
  const [visibility, setVisibility] = useState(artifact.visibility);
  const [firstSceneTitle, setFirstSceneTitle] = useState(
    artifact.firstSceneTitle,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.info('Guide CRUD actions aren’t connected yet.');
  }

  return (
    <Card
      size='sm'
      className='mt-3 w-full bg-background shadow-sm'
      data-slot='guide-form-card'
    >
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <span className='flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <FilePenLine aria-hidden='true' className='size-4' />
          </span>
          Tour draft
        </CardTitle>
        <CardDescription>Review the values before creating.</CardDescription>
        <CardAction>
          <Badge variant='muted'>AI draft</Badge>
        </CardAction>
      </CardHeader>

      <form onSubmit={submit}>
        <CardContent className='grid gap-3'>
          <div className='grid gap-1.5'>
            <Label htmlFor={`${id}-client`}>Client</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger id={`${id}-client`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOUR_CLIENT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-1.5'>
            <Label htmlFor={`${id}-title`}>Tour title</Label>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className='grid gap-3'>
            <div className='grid gap-1.5'>
              <Label htmlFor={`${id}-visibility`}>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value: 'unlisted' | 'public') =>
                  setVisibility(value)
                }
              >
                <SelectTrigger id={`${id}-visibility`} className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='unlisted'>Unlisted</SelectItem>
                  <SelectItem value='public'>Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor={`${id}-first-scene`}>First scene</Label>
              <Input
                id={`${id}-first-scene`}
                value={firstSceneTitle}
                onChange={(event) => setFirstSceneTitle(event.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className='mt-3 justify-between gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href={TOUR_CREATE_HREF} prefetch>
              Open full form
            </Link>
          </Button>
          <Button type='submit' size='sm' disabled={!title.trim()}>
            <Plus aria-hidden='true' />
            Create tour
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function GuideTourEditCard({
  artifact,
}: {
  artifact: Extract<AdminGuideArtifact, { type: 'tour-edit' }>;
}) {
  const id = useId();
  const [title, setTitle] = useState(artifact.title);
  const [visibility, setVisibility] = useState(artifact.visibility);
  const [summary, setSummary] = useState(artifact.summary);
  const editHref = tourEditHref(artifact.tourId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast.info('Guide CRUD actions aren’t connected yet.');
  }

  return (
    <Card
      size='sm'
      className='mt-3 w-full bg-background shadow-sm'
      data-slot='guide-form-card'
    >
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <span className='flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <Pencil aria-hidden='true' className='size-4' />
          </span>
          Tour update
        </CardTitle>
        <CardDescription>
          Review proposed changes for {artifact.client}.
        </CardDescription>
        <CardAction>
          <Badge variant='info'>AI edit</Badge>
        </CardAction>
      </CardHeader>

      <form onSubmit={submit}>
        <CardContent className='grid gap-3'>
          <div className='grid gap-1.5'>
            <Label htmlFor={`${id}-title`}>Tour title</Label>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className='grid gap-1.5'>
            <Label htmlFor={`${id}-visibility`}>Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(value: 'unlisted' | 'public' | 'internal') =>
                setVisibility(value)
              }
            >
              <SelectTrigger id={`${id}-visibility`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='unlisted'>Unlisted</SelectItem>
                <SelectItem value='public'>Public</SelectItem>
                <SelectItem value='internal'>Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-1.5'>
            <Label htmlFor={`${id}-summary`}>Summary</Label>
            <Textarea
              id={`${id}-summary`}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className='mt-3 justify-between gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href={editHref} prefetch>
              Open full form
            </Link>
          </Button>
          <Button type='submit' size='sm' disabled={!title.trim()}>
            <Save aria-hidden='true' />
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function GuideMessageArtifact({
  artifact,
}: {
  artifact: AdminGuideArtifact;
}) {
  if (artifact.type === 'tour-draft') {
    return <GuideTourDraftCard artifact={artifact} />;
  }
  if (artifact.type === 'tour-edit') {
    return <GuideTourEditCard artifact={artifact} />;
  }

  return null;
}
