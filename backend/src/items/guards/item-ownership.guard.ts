import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ItemsService } from '../items.service';
import { User } from '../../users/entities/user.entity';

type RequestWithUser = {
  params: Record<string, string> & { id: string };
  user: User;
};

@Injectable()
export class ItemOwnershipGuard implements CanActivate {
  constructor(private readonly itemsService: ItemsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user, params: { id: itemId } } = request;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      const item = await this.itemsService.findById(itemId);
      if (item.author.id !== user.id) {
        throw new ForbiddenException(
          'You are not allowed to perform this action',
        );
      }
      
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ForbiddenException(
        'You are not allowed to perform this action',
      );
    }
  }
}
