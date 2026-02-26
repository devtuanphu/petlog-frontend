export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'owner' | 'staff';
  hotel_id: number;
}

export interface Hotel {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
}

export interface Room {
  id: number;
  hotel_id: number;
  room_name: string;
  qr_token: string;
  qr_image_url?: string;
  is_active: boolean;
  status?: 'free' | 'occupied';
  active_booking?: {
    id: number;
    owner_name: string;
    check_in_at: string;
    expected_checkout?: string;
    diary_token: string;
    pets: { id: number; name: string; type: string }[];
  } | null;
}

export interface Pet {
  id: number;
  name: string;
  type?: string;
  image_url?: string;
  special_notes?: string;
}

export interface Booking {
  id: number;
  room_id: number;
  owner_name: string;
  owner_phone: string;
  diary_token: string;
  check_in_at: string;
  check_out_at?: string;
  expected_checkout?: string;
  status: 'active' | 'completed';
  room?: Room;
  pets?: Pet[];
}

export interface LogEntry {
  id: number;
  pet_name?: string;
  action_type: string;
  description?: string;
  image_url?: string;
  staff_name?: string;
  created_at: string;
}

export interface DiaryData {
  booking_id: number;
  hotel_name: string;
  hotel_logo?: string;
  room_name: string;
  owner_name: string;
  check_in_at: string;
  check_out_at?: string;
  expected_checkout?: string;
  status: string;
  pets: Pet[];
  logs: LogEntry[];
}

export interface Subscription {
  plan: string;
  max_rooms: number;
  extra_rooms: number;
  expires_at?: string;
  trial_ends_at?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  hotel: { id: number; name: string } | null;
}
