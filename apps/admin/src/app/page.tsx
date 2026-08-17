import { redirect } from 'next/navigation';

/** Landing entry — Workspace starts on Overview. */
export default function Home() {
  redirect('/overview');
}
