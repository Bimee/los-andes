import Link from 'next/link';
import { ArrowLeftIcon } from './icons';

export function BackLink() {
  return (
    <Link className="back-link" href="/">
      <ArrowLeftIcon />
      Volver a la carta
    </Link>
  );
}
