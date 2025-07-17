import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  let dto: PaginationDto;
  beforeEach(() => {
    dto = new PaginationDto();
  });
  it('should have default values', () => {
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });
  it('should accept provided values', () => {
    const customDto: PaginationDto = { page: 5, limit: 50 };

    expect(customDto.page).toBe(5);
    expect(customDto.limit).toBe(50);
  });
  it('should accept skip parameter', () => {
    const customDto: PaginationDto = { skip: 20, limit: 10 };

    expect(customDto.skip).toBe(20);
    expect(customDto.limit).toBe(10);
  });
  it('should accept both page and skip parameters', () => {
    const customDto: PaginationDto = { page: 3, skip: 20, limit: 10 };
    
    expect(customDto.page).toBe(3);
    expect(customDto.skip).toBe(20);
    expect(customDto.limit).toBe(10);
  });
});
