export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Wedding {
  id: number;
  user_id: number;
  slug: string;
  couple_names: string;
  wedding_date: string;
  story: string;
  location: string;
  theme_color: string;
  banner_url: string;
}

export interface Guest {
  id: number;
  wedding_id: number;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'declined';
}

export interface Gift {
  id: number;
  wedding_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_purchased: boolean;
}
