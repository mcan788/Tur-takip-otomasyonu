const API_BASE = 'http://localhost:3000'; // Node.js API base URL

export const authService = {
  login: async (agencyId, username, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agencyId, username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız.');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  
  changePassword: async (agencyId, token, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agencyId, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Şifre güncellenemedi.');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }
};
