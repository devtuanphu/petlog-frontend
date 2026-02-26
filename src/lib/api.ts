const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('petlog_token', token);
    } else {
      localStorage.removeItem('petlog_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('petlog_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  register(data: { email: string; password: string; full_name: string; hotel_name: string; hotel_address?: string; hotel_phone?: string }) {
    return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  login(data: { email: string; password: string }) {
    return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  getMe() {
    return this.request<any>('/auth/me');
  }

  // Hotel
  getHotel() {
    return this.request<any>('/hotel');
  }

  updateHotel(data: Partial<{ name: string; address: string; phone: string }>) {
    return this.request<any>('/hotel', { method: 'PATCH', body: JSON.stringify(data) });
  }

  // Staff
  getStaff() {
    return this.request<any[]>('/hotel/staff');
  }

  createStaff(data: { email: string; password: string; full_name: string }) {
    return this.request<any>('/hotel/staff', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteStaff(id: number) {
    return this.request<any>(`/hotel/staff/${id}`, { method: 'DELETE' });
  }

  // Rooms
  getRooms() {
    return this.request<any[]>('/rooms');
  }

  createRoomsBulk(count: number) {
    return this.request<any[]>('/rooms/bulk', { method: 'POST', body: JSON.stringify({ count }) });
  }

  createRoom(room_name: string) {
    return this.request<any>('/rooms', { method: 'POST', body: JSON.stringify({ room_name }) });
  }

  deleteRoom(id: number) {
    return this.request<any>(`/rooms/${id}`, { method: 'DELETE' });
  }

  // Bookings
  getBookings(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.request<any[]>(`/bookings${q}`);
  }

  checkoutBooking(id: number) {
    return this.request<any>(`/bookings/${id}/checkout`, { method: 'PATCH' });
  }

  // Operation (Staff)
  getOperationRoom(qrToken: string) {
    return this.request<any>(`/operation/room/${qrToken}`);
  }

  createLog(data: { booking_id: number; pet_id?: number; action_type: string; description?: string; image_url?: string }) {
    return this.request<any>('/operation/log', { method: 'POST', body: JSON.stringify(data) });
  }

  getLogs(bookingId: number) {
    return this.request<any[]>(`/operation/logs/${bookingId}`);
  }

  extendBooking(bookingId: number, expectedCheckout: string) {
    return this.request<any>(`/operation/extend/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ expected_checkout: expectedCheckout }),
    });
  }

  // Public
  getRoomInfo(qrToken: string) {
    return this.request<any>(`/public/room/${qrToken}`);
  }

  checkin(qrToken: string, data: { owner_name: string; owner_phone: string; expected_checkout?: string; pets: any[] }) {
    return this.request<any>(`/public/checkin/${qrToken}`, { method: 'POST', body: JSON.stringify(data) });
  }

  customerLookup(phone: string) {
    return this.request<any>(`/public/customer/${phone}`);
  }

  getDiary(diaryToken: string) {
    return this.request<any>(`/public/diary/${diaryToken}`);
  }

  // Upload
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error('Upload thất bại');
    return res.json();
  }

  // Subscription
  getSubscription() {
    return this.request<any>('/subscription');
  }

  // Feedback
  submitFeedback(data: { message: string; type: string }) {
    return this.request<{ id: number }>('/feedback', { method: 'POST', body: JSON.stringify(data) });
  }

  // Payment
  getPlans() {
    return this.request<Array<{
      id: number; name: string; display_name: string;
      price: number; max_rooms: number; description: string;
    }>>('/payment/plans');
  }

  createPayment(plan: string, months: number, upgrade = false, extra_rooms = 0) {
    return this.request<{ checkoutUrl: string; orderCode: number; amount: number }>(
      '/payment/create',
      { method: 'POST', body: JSON.stringify({ plan, months, upgrade, extra_rooms }) },
    );
  }

  calculateUpgrade(plan: string) {
    return this.request<{
      type: 'new' | 'upgrade';
      current_plan: string;
      new_plan: string;
      new_plan_display: string;
      new_price: number;
      current_price: number;
      days_remaining: number;
      total_days: number;
      prorated_amount: number;
      amount: number;
      expires_at?: string;
      message: string;
    }>(`/payment/upgrade-cost?plan=${plan}`);
  }

  checkPayment(orderCode: string) {
    return this.request<{ status: string }>(`/payment/check?orderCode=${orderCode}`);
  }

  getPayments() {
    return this.request<Array<{
      id: number; order_code: number; amount: number;
      plan_name: string; months: number; status: string;
      created_at: string; paid_at: string | null;
    }>>('/payment/history');
  }

  // Extra rooms
  calculateExtraRooms(count: number) {
    return this.request<{
      count: number; price_per_room: number; days_remaining: number;
      current_extra: number; new_total: number; max_rooms_after: number;
      amount: number; message: string;
    }>(`/payment/extra-rooms-cost?count=${count}`);
  }

  createExtraRoomPayment(count: number) {
    return this.request<{ checkoutUrl: string; orderCode: number; amount: number }>(
      '/payment/extra-rooms',
      { method: 'POST', body: JSON.stringify({ count }) },
    );
  }

  getExtraRoomPrice() {
    return this.request<{ price: number }>('/payment/extra-room-price');
  }
}

export const api = new ApiClient();
