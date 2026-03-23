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

  async searchUsers(query: string): Promise<CognitoUser[]> {
    try {
      const [byEmail, byName] = await Promise.all([
        this.listUsersWithFilter(`email ^= "${query}"`),
        this.listUsersWithFilter(`name ^= "${query}"`),
      ]);

      const seen = new Set<string>();
      const results: CognitoUser[] = [];
      for (const user of [...byEmail, ...byName]) {
        if (!seen.has(user.userId)) {
          seen.add(user.userId);
          results.push(user);
        }
      }

      return results.slice(0, 10);
    } catch (error) {
      this.logger.error(`Failed to search users: ${query}`, error);
      return [];
    }
  }

  private async listUsersWithFilter(filter: string): Promise<CognitoUser[]> {
    const result = await this.client.send(
      new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Filter: filter,
        Limit: 10,
      }),
    );

    return (result.Users || [])
      .filter((user) => user.Username)
      .map((user) => {
        const attrs = user.Attributes || [];
        const sub =
          attrs.find((a) => a.Name === 'sub')?.Value || user.Username!;
        const email = attrs.find((a) => a.Name === 'email')?.Value || '';
        const name = attrs.find((a) => a.Name === 'name')?.Value;

        return {
          userId: sub,
          email,
          displayName: name || email.split('@')[0],
        };
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
