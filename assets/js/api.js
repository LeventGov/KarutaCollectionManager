class APIManager {
  constructor() {
    this.aniListUrl = 'https://graphql.anilist.co';
  }

  async searchCharacters(query, limit = 10) {
    try {
      const gqlQuery = `
        query {
          characters: Character(search: "${query.replace(/"/g, '\\"')}", sort: SEARCH_MATCH) {
            id
            name {
              full
            }
            image {
              large
            }
            media {
              edges {
                node {
                  title {
                    english
                    romaji
                  }
                }
              }
            }
          }
        }
      `;
      const response = await fetch(this.aniListUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gqlQuery })
      });
      const json = await response.json();
      return json.data?.characters ? [json.data.characters] : [];
    } catch (error) {
      console.error('Error searching characters on AniList:', error);
      throw error;
    }
  }
  async fetchCharacterImages(characterName = '', seriesName = '') {
    try {
      if (seriesName.trim()) {
        return await this.searchBySeriesAndCharacter(seriesName, characterName);
      }
      if (characterName.trim()) {
        return await this.searchByCharacterName(characterName);
      }
      return [];
    } catch (error) {
      console.error('Error fetching character images from AniList:', error);
      throw error;
    }
  }
  async searchBySeriesAndCharacter(seriesName, characterName = '') {
    try {
      const query = `
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            id
            title {
              romaji
              english
            }
            characters(sort: [ROLE, RELEVANCE], perPage: 50) {
              nodes {
                id
                name {
                  full
                  userPreferred
                }
                image {
                  large
                }
              }
            }
          }
        }
      `;
      const response = await fetch(this.aniListUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { search: seriesName }
        })
      });
      const json = await response.json();
      
      if (json.errors) {
        console.error('AniList GraphQL error:', json.errors);
        return [];
      }

      if (!json.data?.Media?.characters?.nodes) {
        return [];
      }

      let characters = json.data.Media.characters.nodes;

      if (characterName.trim()) {
        const charLower = characterName.toLowerCase();
        const filtered = characters.filter(char =>
          char.name?.full?.toLowerCase().includes(charLower) ||
          char.name?.userPreferred?.toLowerCase().includes(charLower)
        );
        characters = filtered.length > 0 ? filtered : characters;
      }

      return characters.map(char => {
        const img = char.image?.large || 'assets/images/placeholder.png';
        return {
          image: img,
          url: img,
          name: char.name?.userPreferred || char.name?.full || 'Unknown',
          favorites: 0
        };
      });
    } catch (error) {
      console.error('Error searching by series:', error);
      return [];
    }
  }
  async searchByCharacterName(characterName) {
    try {
      const query = `
        query ($search: String) {
          Character(search: $search) {
            id
            name {
              full
              userPreferred
            }
            image {
              large
            }
            media {
              edges {
                node {
                  title {
                    romaji
                  }
                }
              }
            }
          }
        }
      `;
      const response = await fetch(this.aniListUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { search: characterName }
        })
      });
      const json = await response.json();

      if (json.errors) {
        console.error('AniList GraphQL error:', json.errors);
        return [];
      }

      if (!json.data?.Character) {
        return [];
      }

      const char = json.data.Character;
      const img = char.image?.large || 'assets/images/placeholder.png';
      return [{
        image: img,
        url: img,
        name: char.name?.userPreferred || char.name?.full || 'Unknown',
        series: char.media?.edges?.[0]?.node?.title?.romaji || char.media?.edges?.[0]?.node?.title?.english || '',
        favorites: 0
      }];
    } catch (error) {
      console.error('Error searching by character name:', error);
      return [];
    }
  }
}

window.api = new APIManager();
