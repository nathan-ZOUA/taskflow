import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

const features = [
  {
    icon: '↗',
    title: 'A clearer view',
    text: 'See what is active, what is finished and what is coming due in one calm workspace.',
  },
  {
    icon: '⌘',
    title: 'Your tasks, together',
    text: 'Keep a useful title, context, priority and due date with every task.',
  },
  {
    icon: '◷',
    title: 'Progress that is yours',
    text: 'A focused overview reflects your tasks and updates as you work.',
  },
]

export default function LandingPage() {
  const [apiReady, setApiReady] = useState(false)
  useEffect(() => {
    api
      .health()
      .then(() => setApiReady(true))
      .catch(() => setApiReady(false))
  }, [])
  return (
    <div className="marketing-page">
      <header className="marketing-nav">
        <a className="brand" href="/">
          <span className="brand-symbol">T</span>
          <span>TaskFlow</span>
        </a>
        <nav aria-label="Main">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>
        <div className="nav-actions">
          <Link className="nav-login" to="/login">
            Log in
          </Link>
          <Link className="button button-primary" to="/register">
            Create an account <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
      <main>
        <section className="hero-section" id="about">
          <div className="hero-copy">
            <div className="eyebrow-pill">
              <span className={`connection-dot${apiReady ? ' connected' : ''}`} />
              PERSONAL DEMONSTRATION PROJECT
            </div>
            <h1>
              Make space for
              <br />
              <em>meaningful work.</em>
            </h1>
            <p>
              TaskFlow brings your tasks, priorities and progress together in one simple workspace,
              so your next step is always clear.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" to="/register">
                Get started <span aria-hidden="true">→</span>
              </Link>
              <a className="button button-outline button-large" href="#features">
                Explore the workspace
              </a>
            </div>
            <div className="hero-note">
              <span className="note-check">✓</span> A focused task space, built for everyday work.
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Illustrative preview of a task management workspace with example tasks"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="work-card">
              <div className="work-card-top">
                <span className="work-brand">
                  <span className="mini-mark">T</span> Example workspace
                </span>
                <span className="work-date">ILLUSTRATIVE PREVIEW</span>
              </div>
              <div className="work-greeting">
                <small>YOUR NEXT STEP</small>
                <strong>
                  Good morning<span>.</span>
                </strong>
                <p>A calm place to organize your work.</p>
              </div>
              <div className="work-progress">
                <div className="progress-info">
                  <span>Weekly progress</span>
                  <b>—</b>
                </div>
                <div className="progress-track">
                  <i />
                </div>
              </div>
              <div className="demo-task done">
                <span>✓</span>
                <div>
                  <b>Review project notes</b>
                  <small>Example task · Completed</small>
                </div>
                <i>LOW</i>
              </div>
              <div className="demo-task">
                <span className="demo-empty-check" />
                <div>
                  <b>Plan the next milestone</b>
                  <small>Example task · In progress</small>
                </div>
                <i className="high-priority">HIGH</i>
              </div>
              <div className="demo-task">
                <span className="demo-empty-check" />
                <div>
                  <b>Share a project update</b>
                  <small>Example task · To do</small>
                </div>
                <i>MEDIUM</i>
              </div>
              <div className="work-footer">
                <span>
                  <i /> EXAMPLE TASKS, NOT USER DATA
                </span>
                <span>DEMO VIEW</span>
              </div>
            </div>
            <div className="floating-note">
              <span>↗</span>
              <div>
                <b>One thing at a time</b>
                <small>Make steady progress</small>
              </div>
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <span>DESIGNED FOR FOCUS</span>
          <i />
          <span>MADE TO FEEL SIMPLE</span>
          <i />
          <span>BUILT STEP BY STEP</span>
        </section>
        <section className="features-section" id="features">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A SIMPLE PLACE TO BEGIN</p>
              <h2>
                Less juggling.
                <br />
                <em>More forward.</em>
              </h2>
            </div>
            <p>
              TaskFlow keeps the everyday work of staying organized straightforward, with enough
              structure to help you follow through.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <span className="feature-index">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="closing-cta">
          <div>
            <p className="eyebrow">YOUR NEXT STEP STARTS HERE</p>
            <h2>Build a little momentum.</h2>
            <p>Create a demo account and make this workspace your own.</p>
          </div>
          <Link className="button button-light button-large" to="/register">
            Create your workspace <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
      <footer className="marketing-footer">
        <a className="brand" href="/">
          <span className="brand-symbol">T</span>
          <span>TaskFlow</span>
        </a>
        <span>Personal portfolio demonstration · No real business or customer claims</span>
        <span>© {new Date().getFullYear()} TaskFlow</span>
      </footer>
    </div>
  )
}
