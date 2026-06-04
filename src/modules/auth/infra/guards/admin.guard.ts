import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const client = request.client;
    if (!client?.isAdmin) {
      throw new ForbiddenException("Admin access required.");
    }
    return true;
  }
}
