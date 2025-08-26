export class PaginationModel {
  page: number = 1;
  limit: number = 10;

  constructor(page?: number, limit?: number) {
    if (page && page >= 1) this.page = page;
    if (limit && limit >= 1 && limit <= 100) this.limit = limit;
  }
}

export class PaginatedResponseModel<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  constructor(
    items: T[],
    total: number,
    page: number,
    limit: number
  ) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}