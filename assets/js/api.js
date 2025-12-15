// API calls and external service integration

class APIManager {
  constructor() {
    this.jikanBaseUrl = 'https://api.jikan.moe/v4';
  }

  /**
   * Fetch character image from Jikan API
   * @param {string} characterName - Name of the character
   * @returns {Promise<string|null>} Image URL or null if not found
   */
  async fetchCharacterImage(characterName) {
    try {
      const response = await fetch(
        `${this.jikanBaseUrl}/characters?q=${encodeURIComponent(characterName)}&limit=1`
      );
      const json = await response.json();
      
      if (json.data && json.data.length > 0) {
        return json.data[0].images.jpg.image_url;
      }
      return null;
    } catch (error) {
      console.error('Error fetching character image:', error);
      throw error;
    }
  }

  /**
   * Search for anime characters
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Array of character data
   */
  async searchCharacters(query, limit = 10) {
    try {
      const response = await fetch(
        `${this.jikanBaseUrl}/characters?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error('Error searching characters:', error);
      throw error;
    }
  }
}

// Create global instance
const api = new APIManager();
