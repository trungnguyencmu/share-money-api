import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

export interface CognitoUser {
  userId: string;
  email: string;
  displayName: string;
}

@Injectable()
export class CognitoUserLookupService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly logger = new Logger(CognitoUserLookupService.name);

  constructor(private readonly configService: ConfigService) {
    this.userPoolId = configService.getOrThrow<string>('COGNITO_USER_POOL_ID');
    this.client = new CognitoIdentityProviderClient({
      region: configService.getOrThrow<string>('COGNITO_REGION'),
    });
  }

  async findUserByEmail(email: string): Promise<CognitoUser | null> {
    try {
      const result = await this.client.send(
        new ListUsersCommand({
          UserPoolId: this.userPoolId,
          Filter: `email = "${email}"`,
          Limit: 1,
        }),
      );

      const user = result.Users?.[0];
      if (!user || !user.Username) return null;

      const attrs = user.Attributes || [];
      const sub = attrs.find((a) => a.Name === 'sub')?.Value || user.Username;
      const name = attrs.find((a) => a.Name === 'name')?.Value;
      const userEmail = attrs.find((a) => a.Name === 'email')?.Value || email;

      return {
        userId: sub,
        email: userEmail,
        displayName: name || userEmail.split('@')[0],
      };
    } catch (error) {
      this.logger.error(`Failed to look up user by email: ${email}`, error);
      return null;
    }
  }
}
