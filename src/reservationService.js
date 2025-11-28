import { API_CONFIG } from "./config.js";

class ReservationService {
  async createReservation(reservationData) {
    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/reservations`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create reservation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create reservation error:', error);
      throw error;
    }
  }

  async getUserReservations(userId) {
    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/reservations/${userId}`));
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch reservations error:', error);
      throw error;
    }
  }

  async cancelReservation(reservationId, userId) {
    try {
      const response = await fetch(API_CONFIG.getApiUrl(`/reservations/${reservationId}/cancel`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel reservation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Cancel reservation error:', error);
      throw error;
    }
  }

  async getAvailableResources(type, date, startTime, endTime) {
    try {
      const params = new URLSearchParams({ date, startTime, endTime });
      const response = await fetch(API_CONFIG.getApiUrl(`/resources/${type}/available?${params}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch available resources');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch available resources error:', error);
      throw error;
    }
  }
}

export default new ReservationService();