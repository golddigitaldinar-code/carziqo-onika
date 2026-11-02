/* Add member_user_id column to team_members */
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS member_user_id uuid;
CREATE INDEX IF NOT EXISTS idx_team_members_member_user_id ON team_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
