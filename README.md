# 통화 관리 시스템

주간 전화 기록 관리 웹앱 (React + Supabase)

## 설치 전 필수 작업

### 1. `src/config.js` 수정

```js
export const SUPABASE_URL = "https://your-project.supabase.co";
export const SUPABASE_ANON_KEY = "eyJ...";
```

### 2. `vite.config.js` 수정

```js
const REPO_NAME = 'your-repo-name'  // GitHub 레포 이름으로 변경
```

## Supabase 테이블 생성

Supabase → SQL Editor에서 실행:

```sql
CREATE TABLE callers (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  grade      integer NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE receivers (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  grade       integer NOT NULL,
  class       integer NOT NULL,
  name        text NOT NULL,
  phone       text NOT NULL,
  note        text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE caller_receiver_map (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id   uuid REFERENCES callers(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES receivers(id) ON DELETE CASCADE,
  week_label  text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (caller_id, receiver_id, week_label)
);

CREATE TABLE call_logs (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id    uuid REFERENCES callers(id) ON DELETE SET NULL,
  receiver_id  uuid REFERENCES receivers(id) ON DELETE CASCADE,
  called_date  date NOT NULL,
  is_answered  boolean NOT NULL DEFAULT false,
  content      text,
  recorded_at  timestamptz DEFAULT now()
);

ALTER TABLE callers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE caller_receiver_map  ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON callers             FOR ALL USING (true);
CREATE POLICY "allow all" ON receivers           FOR ALL USING (true);
CREATE POLICY "allow all" ON caller_receiver_map FOR ALL USING (true);
CREATE POLICY "allow all" ON call_logs           FOR ALL USING (true);
```

## GitHub Pages 배포

1. GitHub에 레포 생성 후 push
2. GitHub 레포 → Settings → Pages → Source: **GitHub Actions** 선택
3. main 브랜치에 push하면 자동 배포

배포 URL: `https://{username}.github.io/{repo-name}/`
