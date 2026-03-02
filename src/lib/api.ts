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

  updateHotel(data: Partial<{ name: string; address: string; phone: string; payment_policy: string; payment_deposit_percent: number; payment_note: string; bank_name: string; bank_bin: string; bank_account_no: string; bank_account_name: string }>) {
    return this.request<any>('/hotel', { method: 'PATCH', body: JSON.stringify(data) });
  }

  updatePaymentStatus(bookingId: number, data: { payment_status: string; payment_method?: string; payment_amount?: number }) {
    return this.request<any>(`/bookings/${bookingId}/payment`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${API_URL}/hotel/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
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

  getBooking(id: number) {
    return this.request<any>(`/bookings/${id}`);
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

  checkin(qrToken: string, data: { owner_name: string; owner_phone: string; expected_checkout?: string; pets: any[]; selected_services?: number[] }) {
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

  // Room update (type + price)
  updateRoom(id: number, data: Partial<{ room_name: string; room_type: string; daily_rate: number; room_type_id: number }>) {
    return this.request<any>(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  // Room Types
  getRoomTypes() {
    return this.request<any[]>('/room-types');
  }

  createRoomType(data: { name: string; daily_rate: number; price_tiers?: { label: string; price: number }[]; max_pets?: number; description?: string; color?: string; icon?: string }) {
    return this.request<any>('/room-types', { method: 'POST', body: JSON.stringify(data) });
  }

  updateRoomType(id: number, data: Partial<{ name: string; daily_rate: number; price_tiers: { label: string; price: number }[]; max_pets: number; description: string; color: string; icon: string; is_active: boolean; sort_order: number }>) {
    return this.request<any>(`/room-types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteRoomType(id: number) {
    return this.request<any>(`/room-types/${id}`, { method: 'DELETE' });
  }

  // Promotions
  getPromotions() {
    return this.request<any[]>('/promotions');
  }

  createPromotion(data: { name: string; condition_type: string; condition_value: number; reward_type: string; reward_service_id?: number; reward_value: number; reward_label?: string; description?: string }) {
    return this.request<any>('/promotions', { method: 'POST', body: JSON.stringify(data) });
  }

  updatePromotion(id: number, data: Partial<{ name: string; condition_type: string; condition_value: number; reward_type: string; reward_service_id: number; reward_value: number; reward_label: string; description: string; is_active: boolean }>) {
    return this.request<any>(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deletePromotion(id: number) {
    return this.request<any>(`/promotions/${id}`, { method: 'DELETE' });
  }

  getPendingPromotions() {
    return this.request<any[]>('/promotions/pending');
  }

  fulfillPromotion(bpId: number, note?: string) {
    return this.request<any>(`/promotions/fulfill/${bpId}`, { method: 'PUT', body: JSON.stringify({ note }) });
  }

  // Billing - Service Templates
  getServiceTemplates() {
    return this.request<any[]>('/service-templates');
  }

  createServiceTemplate(data: { name: string; default_price: number; sort_order?: number }) {
    return this.request<any>('/service-templates', { method: 'POST', body: JSON.stringify(data) });
  }

  updateServiceTemplate(id: number, data: Partial<{ name: string; default_price: number; is_active: boolean; sort_order: number }>) {
    return this.request<any>(`/service-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deleteServiceTemplate(id: number) {
    return this.request<any>(`/service-templates/${id}`, { method: 'DELETE' });
  }

  // Billing - Service Charges on Booking
  getBookingServices(bookingId: number) {
    return this.request<any[]>(`/bookings/${bookingId}/services`);
  }

  addBookingService(bookingId: number, data: { service_name: string; quantity: number; unit_price: number; note?: string }) {
    return this.request<any>(`/bookings/${bookingId}/services`, { method: 'POST', body: JSON.stringify(data) });
  }

  removeBookingService(bookingId: number, chargeId: number) {
    return this.request<any>(`/bookings/${bookingId}/services/${chargeId}`, { method: 'DELETE' });
  }

  // Billing Preview & Invoice
  getBillingPreview(bookingId: number) {
    return this.request<any>(`/bookings/${bookingId}/billing`);
  }

  getInvoice(bookingId: number) {
    return this.request<any>(`/bookings/${bookingId}/invoice`);
  }

  // Revenue Stats
  getRevenueStats(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return this.request<any>(`/revenue/stats${qs ? '?' + qs : ''}`);
  }

  // Updated checkout with discount + optional custom checkout time
  checkoutWithBilling(id: number, opts?: { discount?: number; discount_type?: string; check_out_at?: string }) {
    return this.request<any>(`/bookings/${id}/checkout`, {
      method: 'PATCH',
      body: JSON.stringify(opts || {}),
    });
  }

  // Extend stay - update expected checkout date
  extendStay(id: number, expected_checkout: string) {
    return this.request<any>(`/bookings/${id}/extend`, {
      method: 'PATCH',
      body: JSON.stringify({ expected_checkout }),
    });
  }
}

export const api = new ApiClient();
