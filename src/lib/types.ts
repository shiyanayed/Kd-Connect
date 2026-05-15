export type Category = 'Phones' | 'Clothes' | 'Farm Produce' | 'Electronics' | 'Household';
export const CATEGORIES: Category[] = ['Phones', 'Clothes', 'Farm Produce', 'Electronics', 'Household'];

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  is_buyer: boolean;
  is_seller: boolean;
  active_role: 'buyer' | 'seller';
  subscription_active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  description: string;
  category: Category;
  location: string;
  photos: string[];
  views: number;
  is_active: boolean;
  created_at: string;
  seller?: Profile;
}

export interface Conversation {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  item?: Item;
  buyer?: Profile;
  seller?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, 'id' | 'views' | 'created_at' | 'seller'>;
        Update: Partial<Omit<Item, 'id' | 'created_at' | 'seller'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at'>;
        Update: Partial<Conversation>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Message>;
      };
    };
    Functions: {
      increment_item_views: { Args: { item_id: string }; Returns: void };
    };
  };
};
