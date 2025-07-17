import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { User } from '../users/entities/user.entity';
import { TypeOrmItemsRepository } from './repositories/typeorm-items.repository';
import { ITEMS_REPOSITORY } from './items.repository.interface';
import { ItemOwnershipGuard } from './guards/item-ownership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Item, User])],
  controllers: [ItemsController],
  providers: [
    ItemsService,
    ItemOwnershipGuard,
    {
      provide: ITEMS_REPOSITORY,
      useClass: TypeOrmItemsRepository,
    },
  ],
  exports: [ItemsService],
})
export class ItemsModule {}
