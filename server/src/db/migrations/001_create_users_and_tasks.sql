CREATE TABLE users (
  id uuid PRIMARY KEY,
  name varchar(80) NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  email varchar(254) NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));

CREATE TABLE tasks (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(120) NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  description varchar(2000) NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority varchar(10) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_user_created_idx ON tasks (user_id, created_at DESC);
CREATE INDEX tasks_user_status_idx ON tasks (user_id, status);
CREATE INDEX tasks_user_due_date_idx ON tasks (user_id, due_date) WHERE due_date IS NOT NULL;
