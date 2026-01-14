import axios from 'axios';

const API_URL = 'https://openlibrary.org/search.json';

const getTrendingBooks = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}?q=trending`);
    return response.data.docs;
  } catch (error) {
    throw new Error('Error fetching trending books');
  }
};

const searchBooks = async (query: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}?q=${encodeURIComponent(query)}`);
    return response.data.docs;
  } catch (error) {
    throw new Error('Error searching books');
  }
};

export default {
  getTrendingBooks,
  searchBooks,
};