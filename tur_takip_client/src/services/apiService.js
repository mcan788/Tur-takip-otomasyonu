const API_BASE = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('token') || null;
    }
    return this.token;
  }

  /**
   * JWT token payload'unu çözerek agencyId değerini döndürür.
   * Token payload yapısı: { agencyId, username, role, dbName }
   */
  getAgencyId() {
    try {
      const token = this.getToken();
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length < 2) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return parsed.agencyId || null;
    } catch (err) {
      console.error('JWT token ayrıştırılamadı:', err);
      return null;
    }
  }

  getUserRole() {
    try {
      const token = this.getToken();
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return parsed.role || null;
    } catch (err) {
      return null;
    }
  }

  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API isteği başarısız oldu.');
    }

    return data;
  }

  // Tour Endpoints
  async getTours(agencyId = this.getAgencyId()) {
    if (!agencyId) {
      throw new Error('Acente kimliği (agencyId) bulunamadı.');
    }
    return this.fetch(`/agency/tours/${agencyId}`);
  }

  async createTour(tourData) {
    return this.fetch('/agency/tour', {
      method: 'POST',
      body: JSON.stringify(tourData),
    });
  }

  async updateTour(id, tourData) {
    return this.fetch(`/agency/tour/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tourData),
    });
  }

  async deleteTour(id) {
    return this.fetch(`/agency/tour/${id}`, {
      method: 'DELETE',
    });
  }

  // Staff Endpoints
  async getStaff(agencyId = this.getAgencyId()) {
    if (!agencyId) {
      throw new Error('Acente kimliği (agencyId) bulunamadı.');
    }
    return this.fetch(`/agency/staff/${agencyId}`);
  }

  async createStaff(staffData) {
    return this.fetch('/agency/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaff(id, staffData) {
    return this.fetch(`/agency/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  async resetStaffPassword(id, newPassword) {
    return this.fetch(`/agency/staff/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async deleteStaff(id) {
    return this.fetch(`/agency/staff/${id}`, {
      method: 'DELETE',
    });
  }

  // Booking Endpoints
  async getTourBookings(tourId) {
    return this.fetch(`/agency/tour/${tourId}/bookings`);
  }

  async createBooking(bookingData) {
    return this.fetch('/agency/booking', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async approveBooking(id) {
    return this.fetch(`/agency/booking/${id}/approve`, {
      method: 'PUT',
    });
  }

  // Dashboard & Stats Endpoints
  async getStats(agencyId = this.getAgencyId()) {
    if (!agencyId) {
      throw new Error('Acente kimliği (agencyId) bulunamadı.');
    }
    return this.fetch(`/agency/stats/${agencyId}`);
  }

  // Reports Endpoints
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/agency/reports?${query}` : '/agency/reports';
    return this.fetch(endpoint);
  }

  async getFinancialReport(agencyId = this.getAgencyId()) {
    if (!agencyId) {
      throw new Error('Acente kimliği (agencyId) bulunamadı.');
    }
    return this.fetch(`/agency/report/${agencyId}`);
  }

  async getFullFinancialReport() {
    return this.fetch('/agency/full-report');
  }

  // Office Endpoints
  async getOffices(agencyId = this.getAgencyId()) {
    if (!agencyId) {
      throw new Error('Acente kimliği (agencyId) bulunamadı.');
    }
    return this.fetch(`/agency/offices/${agencyId}`);
  }

  async getOfficeDetails(agencyId = this.getAgencyId()) {
    if (!agencyId) {
      throw new Error('Acente kimliği (agencyId) bulunamadı.');
    }
    return this.fetch(`/agency/office/${agencyId}/details`);
  }

  // SuperAdmin Endpoints
  async getSuperAdminAgencies() {
    return this.fetch('/super-admin/agencies');
  }

  async getSuperAdminReport() {
    return this.fetch('/super-admin/report');
  }

  async createAgency(agencyData) {
    return this.fetch('/super-admin/create-agency', {
      method: 'POST',
      body: JSON.stringify(agencyData)
    });
  }

  async updateAgency(agencyData) {
    return this.fetch('/super-admin/update-agency', {
      method: 'PUT',
      body: JSON.stringify(agencyData)
    });
  }

  async deleteAgency(id) {
    return this.fetch(`/super-admin/delete-agency/${id}`, {
      method: 'DELETE'
    });
  }

  async renewAgencyLicense(data) {
    return this.fetch('/super-admin/renew-license', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async resetAgencyPassword(data) {
    return this.fetch('/super-admin/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export const apiService = new ApiService();
