/**
 * One-time backfill: populate `payerUserId` on existing expense records by
 * matching the cached `payer` display-name string against trip members.
 *
 * Run with:
 *   npx ts-node scripts/backfill-payer-user-id.ts
 *
 * Required env (same names as the API):
 *   AWS_REGION, DYNAMODB_EXPENSES_TABLE, DYNAMODB_TRIP_MEMBERS_TABLE
 *
 * Optional env:
 *   DEFAULT_PAYER_USER_ID  - fallback userId used when no unique displayName
 *                            match is found (covers legacy rows with garbled
 *                            or already-reversed payer strings, e.g. "gnurT",
 *                            or the userId mistakenly stored in `payer`).
 *
 * Behaviour:
 * - Skips expenses that already have a `payerUserId`.
 * - For each remaining expense, fetches the trip's members and finds a single
 *   member whose displayName matches `expense.payer` (case-insensitive, trimmed).
 * - If a unique match is found, writes `payerUserId` via UpdateItem.
 * - If 0 or >1 matches AND `DEFAULT_PAYER_USER_ID` is set, writes that fallback
 *   value (and updates `payer` to the corresponding member displayName when the
 *   fallback userId belongs to the trip).
 * - Otherwise logs and skips.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'ap-southeast-1';
const expensesTable = process.env.DYNAMODB_EXPENSES_TABLE || 'share-money-expenses-dev';
const membersTable = process.env.DYNAMODB_TRIP_MEMBERS_TABLE || 'share-money-trip-members-dev';
const defaultPayerUserId = process.env.DEFAULT_PAYER_USER_ID || '';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

interface ExpenseRow {
  tripId: string;
  expenseId: string;
  payer?: string;
  payerUserId?: string;
}

interface MemberRow {
  tripId: string;
  userId: string;
  displayName: string;
}

async function scanAllExpenses(): Promise<ExpenseRow[]> {
  const all: ExpenseRow[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(new ScanCommand({ TableName: expensesTable, ExclusiveStartKey }));
    all.push(...((res.Items ?? []) as ExpenseRow[]));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return all;
}

async function getMembers(tripId: string): Promise<MemberRow[]> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: membersTable,
      KeyConditionExpression: 'tripId = :tripId',
      ExpressionAttributeValues: { ':tripId': tripId },
    })
  );
  return (res.Items ?? []) as MemberRow[];
}

function findUniqueMatch(members: MemberRow[], payerName: string): MemberRow | null {
  const target = payerName.trim().toLowerCase();
  const matches = members.filter((m) => m.displayName.trim().toLowerCase() === target);
  return matches.length === 1 ? matches[0] : null;
}

async function main() {
  console.log(`Region: ${region}`);
  console.log(`Expenses table: ${expensesTable}`);
  console.log(`Members table:  ${membersTable}`);
  if (defaultPayerUserId) {
    console.log(`Default fallback payerUserId: ${defaultPayerUserId}`);
  }

  const expenses = await scanAllExpenses();
  console.log(`Found ${expenses.length} expenses total.`);

  const tripCache = new Map<string, MemberRow[]>();
  let updated = 0;
  let updatedFallback = 0;
  let alreadyOk = 0;
  let skippedNoMatch = 0;
  let skippedAmbiguous = 0;

  const writePayerUserId = async (
    exp: ExpenseRow,
    userId: string,
    displayName?: string
  ): Promise<void> => {
    const updateExpr = displayName
      ? 'SET payerUserId = :uid, payer = :name'
      : 'SET payerUserId = :uid';
    const values: Record<string, string> = { ':uid': userId };
    if (displayName) values[':name'] = displayName;

    await ddb.send(
      new UpdateCommand({
        TableName: expensesTable,
        Key: { tripId: exp.tripId, expenseId: exp.expenseId },
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: values,
      })
    );
  };

  for (const exp of expenses) {
    if (exp.payerUserId) {
      alreadyOk++;
      continue;
    }

    let members = tripCache.get(exp.tripId);
    if (!members) {
      members = await getMembers(exp.tripId);
      tripCache.set(exp.tripId, members);
    }

    const match = exp.payer ? findUniqueMatch(members, exp.payer) : null;
    if (match) {
      await writePayerUserId(exp, match.userId, match.displayName);
      updated++;
      console.log(`[ok] ${exp.tripId}/${exp.expenseId} payer="${exp.payer}" -> ${match.userId}`);
      continue;
    }

    // No unique match — try fallback default
    const target = exp.payer?.trim().toLowerCase() ?? '';
    const candidates = exp.payer
      ? members.filter((m) => m.displayName.trim().toLowerCase() === target)
      : [];
    const reason = !exp.payer ? 'no-payer' : candidates.length === 0 ? 'no-match' : 'ambiguous';

    if (defaultPayerUserId) {
      const fallbackMember = members.find((m) => m.userId === defaultPayerUserId);
      await writePayerUserId(exp, defaultPayerUserId, fallbackMember?.displayName);
      updatedFallback++;
      console.log(
        `[fallback:${reason}] ${exp.tripId}/${exp.expenseId} payer="${
          exp.payer ?? ''
        }" -> ${defaultPayerUserId}${fallbackMember ? ` (${fallbackMember.displayName})` : ''}`
      );
      continue;
    }

    if (reason === 'no-match') {
      skippedNoMatch++;
      console.warn(
        `[skip:no-match] ${exp.tripId}/${exp.expenseId} payer="${exp.payer}" not found among ${members.length} members`
      );
    } else if (reason === 'ambiguous') {
      skippedAmbiguous++;
      console.warn(
        `[skip:ambiguous] ${exp.tripId}/${exp.expenseId} payer="${exp.payer}" matched ${candidates.length} members`
      );
    } else {
      skippedNoMatch++;
      console.warn(`[skip:no-payer] ${exp.tripId}/${exp.expenseId} has no payer`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Updated (matched):  ${updated}`);
  console.log(`Updated (fallback): ${updatedFallback}`);
  console.log(`Already had id:     ${alreadyOk}`);
  console.log(`Skipped no match:   ${skippedNoMatch}`);
  console.log(`Skipped ambiguous:  ${skippedAmbiguous}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
