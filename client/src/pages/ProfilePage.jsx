import { useAuth } from '../context/useAuth.js'

export default function ProfilePage() {
  const { user } = useAuth()
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—'
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>
            Profile<span>.</span>
          </h1>
          <p>Your account details for this personal demonstration.</p>
        </div>
      </div>
      <section className="profile-card">
        <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div className="profile-intro">
          <span className="profile-label">TASKFLOW MEMBER</span>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
        <div className="profile-divider" />
        <dl className="profile-details">
          <div>
            <dt>Full name</dt>
            <dd>{user?.name}</dd>
          </div>
          <div>
            <dt>Email address</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{memberSince}</dd>
          </div>
          <div>
            <dt>Account type</dt>
            <dd>Local demo account</dd>
          </div>
        </dl>
      </section>
      <aside className="security-note">
        <span aria-hidden="true">i</span>
        <div>
          <strong>About this demo account</strong>
          <p>
            Your password is stored as a one-way hash in your local PostgreSQL database. Session
            cookies are HTTP-only. This is an educational application and has not been audited for
            production use.
          </p>
        </div>
      </aside>
    </>
  )
}
