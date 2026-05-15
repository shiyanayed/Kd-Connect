/*
  # Kaduna Marketplace Initial Schema

  ## Summary
  Sets up all core tables for the marketplace app.

  ## New Tables

  ### profiles
  - Extends auth.users with display name, phone, avatar, and role flags
  - `is_buyer` / `is_seller` allow one account to hold both roles
  - `subscription_active` tracks seller subscription status

  ### items
  - Marketplace listings posted by sellers
  - Stores title, price, description, category, location, photos (array), view count
  - Soft-delete via `is_active` flag

  ### conversations
  - Tracks a chat thread between a buyer and seller for a specific item

  ### messages
  - Individual chat messages within a conversation

  ## Security
  - RLS enabled on all tables
  - Profiles readable by authenticated users, editable only by owner
  - Items readable by all authenticated users; writable only by owning seller
  - Conversations accessible only to the two participants
  - Messages accessible only to conversation participants
*/

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text NOT NULL DEFAULT '',
  phone          text DEFAULT '',
  avatar_url     text DEFAULT '',
  is_buyer       boolean NOT NULL DEFAULT true,
  is_seller      boolean NOT NULL DEFAULT false,
  active_role    text NOT NULL DEFAULT 'buyer' CHECK (active_role IN ('buyer','seller')),
  subscription_active boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── ITEMS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  price       numeric(12,2) NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  category    text NOT NULL CHECK (category IN ('Phones','Clothes','Farm Produce','Electronics','Household')),
  location    text NOT NULL DEFAULT '',
  photos      text[] NOT NULL DEFAULT '{}',
  views       integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_seller_id_idx ON items(seller_id);
CREATE INDEX IF NOT EXISTS items_category_idx ON items(category);
CREATE INDEX IF NOT EXISTS items_is_active_idx ON items(is_active);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active items"
  ON items FOR SELECT
  TO authenticated
  USING (is_active = true OR seller_id = auth.uid());

CREATE POLICY "Sellers can insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- ─── CONVERSATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  buyer_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, buyer_id, seller_id)
);

CREATE INDEX IF NOT EXISTS conversations_buyer_idx  ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_idx ON conversations(seller_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can start conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can read messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ─── ITEM VIEW INCREMENT FUNCTION ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_item_views(item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE items SET views = views + 1 WHERE id = item_id;
END;
$$;
