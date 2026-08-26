# Supabase Setup Instructions

## Step 1: Create Supabase Auth Users

You need to create user accounts in Supabase Auth. Go to your Supabase project > Authentication > Users and create these users manually OR run the script in Step 2.

### Users to Create:
- **Admin Account**: `admin@prismaplay.io` / `admin1234`
- **Demo Player**: `demo@prismaplay.io` / `demo1234`
- **Additional Demo Users** (optional):
  - `aarav@prismaplay.io` / `aarav1234`
  - `meera@prismaplay.io` / `meera1234`

## Step 2: Seed Demo Data

Run this SQL in your Supabase SQL Editor to populate demo users and transactions:

```sql
-- Insert demo users (make sure you created the auth users first)
INSERT INTO public.users (id, name, email, email_verified, balance, bonus, promo_code, invited_by, created_at)
VALUES
  ('user-demo-id', 'Demo Player', 'demo@prismaplay.io', true, 1280, 145, '171116', NULL, EXTRACT(EPOCH FROM (NOW() - INTERVAL '240 hours')) * 1000),
  ('user-admin-id', 'Administrator', 'admin@prismaplay.io', true, 0, 0, 'ADMIN', NULL, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('user-aarav-id', 'Aarav K.', 'aarav@prismaplay.io', true, 640, 20, '284510', '171116', EXTRACT(EPOCH FROM (NOW() - INTERVAL '96 hours')) * 1000),
  ('user-meera-id', 'Meera S.', 'meera@prismaplay.io', true, 2110, 310, '392044', '171116', EXTRACT(EPOCH FROM (NOW() - INTERVAL '60 hours')) * 1000)
ON CONFLICT (id) DO NOTHING;

-- Insert demo transactions
INSERT INTO public.transactions (user_id, user_name, type, amount, status, method, reference, created_at)
VALUES
  ('user-demo-id', 'Demo Player', 'recharge', 500, 'completed', '50 USDT (TRC20)', '0x8fa3c47b19de5510cbb42f7a91d21c', EXTRACT(EPOCH FROM (NOW() - INTERVAL '26 hours')) * 1000),
  ('user-demo-id', 'Demo Player', 'withdrawal', 200, 'pending', 'USDT (TRC20) TVvMro…9niX', NULL, EXTRACT(EPOCH FROM (NOW() - INTERVAL '4 hours')) * 1000),
  ('user-aarav-id', 'Aarav K.', 'recharge', 120, 'pending', '12 USDT (TRC20)', '0x71bb90ac4413e0f2ba7761d54a09', EXTRACT(EPOCH FROM (NOW() - INTERVAL '2 hours')) * 1000),
  ('user-meera-id', 'Meera S.', 'withdrawal', 900, 'pending', 'USDT (TRC20) TQm4Ls…7bH2', NULL, EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 hour')) * 1000),
  ('user-meera-id', 'Meera S.', 'commission', 64, 'completed', 'Referral level 1', NULL, EXTRACT(EPOCH FROM (NOW() - INTERVAL '12 hours')) * 1000)
ON CONFLICT DO NOTHING;

-- Verify settings are initialized
INSERT INTO public.settings (id, maintenance, min_stake, min_recharge_usdt, points_per_usdt, usdt_trc20_address)
VALUES ('platform', false, 10, 10, 100, 'TVvMrooDma21L1FcQfFUtFJG1wFCwz9niX')
ON CONFLICT (id) DO NOTHING;
```

## Step 3: Update Real Supabase User IDs

After creating auth users in Supabase, you'll get their actual UIDs. Replace the placeholder IDs in the SQL above with the real ones.

To find the real user IDs:
1. Go to Supabase > Authentication > Users
2. Click on each user to see their ID
3. Update the `id` column in the INSERT statements

## Step 4: Enable Email Verification (Optional)

To enable email verification:
1. Go to Supabase > Authentication > Email Templates
2. Customize the confirmation email template
3. Test by registering a new user in the app

## Step 5: Test the Application

1. Start the dev server: `npm run dev`
2. Try logging in with demo account: `demo@prismaplay.io` / `demo1234`
3. Try admin access with: `admin` / `admin1234` (will use `admin@prismaplay.io` to sign in)

## Notes

- Supabase Auth handles all password verification automatically
- Email addresses must match in both Auth and users table
- The app will create new users automatically when they register
- Admin login uses hardcoded credentials (`admin` / `admin1234`) that trigger sign-in with `admin@prismaplay.io`
