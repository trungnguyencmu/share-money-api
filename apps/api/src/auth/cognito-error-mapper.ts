import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

const COGNITO_ERROR_MAP: Record<string, (msg: string) => HttpException> = {
  UsernameExistsException: (msg) => new ConflictException(msg),
  UserNotFoundException: (msg) => new NotFoundException(msg),
  NotAuthorizedException: (msg) => new UnauthorizedException(msg),
  CodeMismatchException: (msg) => new BadRequestException(msg),
  ExpiredCodeException: (msg) => new BadRequestException(msg),
  InvalidPasswordException: (msg) => new BadRequestException(msg),
  InvalidParameterException: (msg) => new BadRequestException(msg),
  TooManyRequestsException: (msg) =>
    new HttpException(msg, HttpStatus.TOO_MANY_REQUESTS),
  LimitExceededException: (msg) =>
    new HttpException(msg, HttpStatus.TOO_MANY_REQUESTS),
  UserNotConfirmedException: () =>
    new BadRequestException(
      'User email not confirmed. Please check your email for the verification code.',
    ),
};

export function mapCognitoError(error: unknown): never {
  if (error instanceof HttpException) throw error;

  const name = (error as { name?: string })?.name ?? '';
  const message =
    (error as { message?: string })?.message ?? 'Authentication error';

  const factory = COGNITO_ERROR_MAP[name];
  if (factory) throw factory(message);

  throw new InternalServerErrorException(
    'An unexpected authentication error occurred',
  );
}
