import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {

  @Get('current-user')
  @ApiOperation({ summary: 'Get current user basic info for dashboard' })
  @ApiResponse({ status: 200, description: 'Current user info retrieved successfully' })
  async getCurrentUser() {
    // TODO: Extract user from JWT token
    // TODO: Get user basic info (id, name, email, role, avatar, lastLogin)
    // TODO: Transform user entity to dashboard user DTO
    // TODO: Handle authentication required
    // TODO: Handle user not found
    
    throw new Error('TODO: Implement getCurrentUser');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics for current user' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats() {
    // TODO: Extract user from JWT token
    // TODO: Count active projects for user
    // TODO: Count total interactions involving user roles
    // TODO: Count WSJF reports for user
    // TODO: Calculate completion rate across projects/reports
    // TODO: Transform stats to DTO
    // TODO: Handle authentication required
    
    throw new Error('TODO: Implement getDashboardStats');
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Get recent activities for current user' })
  @ApiResponse({ status: 200, description: 'Recent activities retrieved successfully' })
  async getRecentActivities(@Query('limit') limit?: number) {
    // TODO: Extract user from JWT token
    // TODO: Set default limit to 10, max 50
    // TODO: Get recent activities for user (reports, interactions, projects)
    // TODO: Sort activities by timestamp descending
    // TODO: Transform activities to DTO with id, title, description, timestamp, type
    // TODO: Handle authentication required
    
    throw new Error('TODO: Implement getRecentActivities');
  }

  @Get('user-projects')
  @ApiOperation({ summary: 'Get user projects with basic info' })
  @ApiResponse({ status: 200, description: 'User projects retrieved successfully' })
  async getUserProjects() {
    // TODO: Extract user from JWT token
    // TODO: Get projects associated with user
    // TODO: Include project id, name, status, progress, priority, dueDate
    // TODO: Sort by priority and due date
    // TODO: Transform projects to DTO
    // TODO: Handle authentication required
    
    throw new Error('TODO: Implement getUserProjects');
  }
}