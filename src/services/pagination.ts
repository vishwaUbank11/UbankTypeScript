class Pagination {
    pagination(total: number, page: number, limit: number = 10): { limit: number; start: number; numOfPages: number } {
      const numOfPages = Math.ceil(total / limit);
      const start = page * limit - limit;
      return { limit, start, numOfPages };
    }
  }
  
  export default new Pagination();  