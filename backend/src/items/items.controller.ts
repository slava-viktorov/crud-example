import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ItemOwnershipGuard } from './guards/item-ownership.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('items')
@Controller('items')
@UseInterceptors(ClassSerializerInterceptor)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully created.',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.', type: ErrorResponseDto })
  async create(
    @Body() createItemDto: CreateItemDto,
    @CurrentUser() user: User,
  ): Promise<ItemResponseDto> {
    const item = await this.itemsService.create(createItemDto, user);
    return item;
  }

  @Get()
  @ApiOperation({ summary: 'Get all items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (alternative to skip)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results per page' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of items to skip (alternative to page)' })
  @ApiResponse({
    status: 200,
    description: 'Items retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ItemResponseDto' }
        },
        count: { type: 'number' }
      }
    }
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ItemResponseDto>> {
    const items = await this.itemsService.findAll(paginationDto);
    return items;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by id' })
  @ApiResponse({
    status: 200,
    description: 'Item retrieved successfully.',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found.', type: ErrorResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ItemResponseDto> {
    const item = await this.itemsService.findById(id);
    return item;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ItemOwnershipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully updated.',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found.', type: ErrorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    const item = await this.itemsService.update(id, updateItemDto);
    return item;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ItemOwnershipGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found.', type: ErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.itemsService.remove(id);
  }
}
