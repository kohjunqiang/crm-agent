import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CurrentUser, RequestUser } from '../auth/user.decorator';

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const entries = await this.knowledgeService.getEntries(user.id);
    return { entries };
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() body: { title: string; content: string },
  ) {
    return this.knowledgeService.createEntry(user.id, body);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string },
  ) {
    return this.knowledgeService.updateEntry(user.id, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.knowledgeService.deleteEntry(user.id, id);
    return { success: true };
  }
}
