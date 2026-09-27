import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <span className="brand-symbol">T</span>
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>We can&apos;t find that page.</h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <Link className="button button-primary" to="/">
        Return to TaskFlow
      </Link>
    </main>
  )
}
