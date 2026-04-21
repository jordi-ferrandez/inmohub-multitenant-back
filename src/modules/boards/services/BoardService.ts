// @ts-nocheck
import { prisma } from "@core/lib";
import { BoardCard, CardActivity, CardPriority, Prisma } from "./../../../generated/prisma";

export class BoardService {
  async getAllBoards(userId: number, roles: string[], filters?: { ownerId?: number, creatorId?: number, search?: string }) {
    const isDirector = roles.some(role => role.toLowerCase() === 'director');
    
    const where: any = {};
    
    if (isDirector) {
      if (filters?.ownerId) where.ownerId = filters.ownerId;
      if (filters?.creatorId) where.creatorId = filters.creatorId;
    } else {
      where.ownerId = userId;
    }

    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    
    return prisma.board.findMany({
      where,
      include: {
        _count: {
          select: { columns: true }
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getBoardById(id: number) {
    return prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            cards: {
              orderBy: { priority: "desc" },
              include: {
                tags: true,
                responsible: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true
                  }
                },
                creator: {
                   select: { id: true, firstName: true, lastName: true}
                }
              }
            }
          }
        }
      }
    });
  }

  async createBoard(data: { title: string; description?: string; ownerId: number; creatorId: number; isPrivate?: boolean }) {
    return prisma.board.create({
      data: {
        title: data.title,
        description: data.description,
        isPrivate: data.isPrivate || false,
        ownerId: data.ownerId,
        creatorId: data.creatorId,
        // Default columns
        columns: {
           create: [
             { title: "Por hacer", order: 0, isSystem: true },
             { title: "En proceso", order: 1 },
             { title: "Hecho", order: 2, isSystem: true }
           ]
        }
      },
      include: { columns: true }
    });
  }
  
  async createColumn(data: { boardId: number; title: string; order?: number }) {
      const maxOrder = await prisma.boardColumn.aggregate({
        where: { boardId: data.boardId },
        _max: { order: true }
      });
      const maxVal = typeof maxOrder._max?.order === 'number' ? maxOrder._max.order : -1;
      const nextOrder = data.order ?? (maxVal + 1);
      return prisma.boardColumn.create({
        data: {
          boardId: data.boardId,
          title: data.title,
          order: nextOrder
        }
      });
  }

  async updateColumn(id: number, data: { title?: string; order?: number }) {
    return prisma.boardColumn.update({
      where: { id },
      data
    });
  }

  async deleteColumn(id: number) {
    const column = await prisma.boardColumn.findUnique({
      where: { id },
      include: { cards: true }
    });
    if (column && column.cards.length > 0) {
      throw new Error("Cannot delete column with cards");
    }
    return prisma.boardColumn.delete({ where: { id } });
  }

  async reorderColumns(boardId: number, columnIds: number[]) {
    return prisma.$transaction(
      columnIds.map((colId, index) =>
        prisma.boardColumn.update({
          where: { id: colId },
          data: { order: index }
        })
      )
    );
  }

  async createCard(data: { columnId: number; title: string; description?: string; priority?: CardPriority; creatorId: number; responsibleId?: number; dueDate?: Date, tags?: string[] }) {
      const { tags, ...cardData } = data;
      const card = await prisma.boardCard.create({
          data: {
              ...cardData,
              tags: {
                  create: tags?.map(t => ({ name: t }))
              }
          },
          include: { 
            tags: true, 
            column: true,
            responsible: {
                select: { id: true, firstName: true, lastName: true }
            } 
          }
      });
      
      await prisma.cardActivity.create({
          data: {
              cardId: card.id,
              userId: data.creatorId,
              action: 'created',
              details: { column: card.column.title }
          }
      });
      
      return card;
  }
  
    async updateCard(id: number, data: Prisma.BoardCardUpdateInput, userId: number) {      
     
    return prisma.boardCard.update({
        where: { id },
        data ,
        include: { tags: true }
    });
  }
  
  async moveCard(id: number, targetColumnId: number, userId: number) {
      const card = await prisma.boardCard.findUnique({ where: { id }});
      if (!card) throw new Error("Card not found");
      
      if (card.columnId !== targetColumnId) {
          const updated = await prisma.boardCard.update({
              where: { id },
              data: { columnId: targetColumnId },
              include: { column: true }
          });
          
          await prisma.cardActivity.create({
              data: {
                  cardId: id,
                  userId,
                  action: "moved",
                  details: { from: card.columnId, to: targetColumnId }
              }
          });
          return updated;
      }
      return card;
  }

  async deleteCard(id: number, userId: number) {
      return prisma.boardCard.delete({
          where: { id }
      });
  }
  
  async getDailyActivity(userId: number) {
       const startOfDay = new Date();
       startOfDay.setHours(0,0,0,0);
       
       return prisma.cardActivity.findMany({
           where: {
               createdAt: { gte: startOfDay }
           },
           include: {
               card: true,
               user: { select: { id: true, firstName: true, lastName: true } }
           },
           orderBy: { createdAt: 'desc' }
       });
  }
}
