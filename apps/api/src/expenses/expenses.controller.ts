import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseResponseDto,
  DeleteExpenseDto,
} from '@share-money/shared';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense in a trip' })
  @ApiResponse({
    status: 201,
    description: 'Expense created successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async create(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() createExpenseDto: CreateExpenseDto
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(tripId, user.userId, createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses for a trip' })
  @ApiResponse({
    status: 200,
    description: 'List of expenses',
    type: [ExpenseResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findAll(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<ExpenseResponseDto[]> {
    return this.expensesService.findAll(tripId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense found', type: ExpenseResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findOne(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(tripId, id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  @ApiResponse({
    status: 200,
    description: 'Expense updated successfully',
    type: ExpenseResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async update(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() updateExpenseDto: UpdateExpenseDto
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(tripId, id, user.userId, updateExpenseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense (requires password)' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid password' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async remove(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() deleteDto: DeleteExpenseDto
  ): Promise<void> {
    await this.expensesService.remove(tripId, id, user.userId, deleteDto.password);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all expenses in trip (requires password)' })
  @ApiResponse({ status: 200, description: 'All expenses deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid password' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async removeAll(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() deleteDto: DeleteExpenseDto
  ): Promise<void> {
    await this.expensesService.removeAll(tripId, user.userId, deleteDto.password);
  }
}
