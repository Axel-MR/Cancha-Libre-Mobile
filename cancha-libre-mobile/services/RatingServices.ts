import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RatingServiceProps {
  getUserRating: (canchaId: string, userId: string) => Promise<number>;
  rateCancha: (canchaId: string, userId: string, rating: number) => Promise<void>;
  getCanchaRating: (canchaId: string) => Promise<{ promedio: number; total: number }>;
}

export const RatingService: RatingServiceProps = {
  // Obtener la calificación actual del usuario para una cancha
  getUserRating: async (canchaId: string, userId: string): Promise<number> => {
    try {
      const calificacion = await prisma.calificacion.findUnique({
        where: {
          canchaId_usuarioId: {
            canchaId,
            usuarioId: userId
          }
        }
      });
      
      return calificacion ? calificacion.valor : 0;
    } catch (error) {
      console.error('Error al obtener calificación del usuario:', error);
      throw error;
    }
  },
  
  // Calificar una cancha (crear o actualizar calificación)
  rateCancha: async (canchaId: string, userId: string, rating: number): Promise<void> => {
    try {
      // Validar que la calificación sea un múltiplo de 0.5 entre 0.5 y 5
      if (rating < 0.5 || rating > 5 || (rating * 10) % 5 !== 0) {
        throw new Error('La calificación debe ser un múltiplo de 0.5 entre 0.5 y 5');
      }
      
      // Iniciar transacción
      await prisma.$transaction(async (tx) => {
        // Verificar si el usuario ya calificó esta cancha
        const existingRating = await tx.calificacion.findUnique({
          where: {
            canchaId_usuarioId: {
              canchaId,
              usuarioId: userId
            }
          }
        });
        
        if (existingRating) {
          // Actualizar calificación existente
          await tx.calificacion.update({
            where: {
              id: existingRating.id
            },
            data: {
              valor: rating,
              estado: 'ACTIVA'
            }
          });
        } else {
          // Crear nueva calificación
          await tx.calificacion.create({
            data: {
              canchaId,
              usuarioId: userId,
              valor: rating,
              estado: 'ACTIVA'
            }
          });
        }
        
        // Recalcular promedio y total
        const calificaciones = await tx.calificacion.findMany({
          where: {
            canchaId,
            estado: 'ACTIVA'
          },
          select: {
            valor: true
          }
        });
        
        const total = calificaciones.length;
        const suma = calificaciones.reduce((acc, curr) => acc + curr.valor, 0);
        const promedio = total > 0 ? suma / total : 0;
        
        // Actualizar cancha con nuevo promedio y total
        await tx.cancha.update({
          where: {
            id: canchaId
          },
          data: {
            calificacionPromedio: promedio,
            totalCalificaciones: total
          }
        });
      });
    } catch (error) {
      console.error('Error al calificar cancha:', error);
      throw error;
    }
  },
  
  // Obtener la calificación promedio y total de una cancha
  getCanchaRating: async (canchaId: string): Promise<{ promedio: number; total: number }> => {
    try {
      const cancha = await prisma.cancha.findUnique({
        where: {
          id: canchaId
        },
        select: {
          calificacionPromedio: true,
          totalCalificaciones: true
        }
      });
      
      if (!cancha) {
        throw new Error('Cancha no encontrada');
      }
      
      return {
        promedio: cancha.calificacionPromedio,
        total: cancha.totalCalificaciones
      };
    } catch (error) {
      console.error('Error al obtener calificación de cancha:', error);
      throw error;
    }
  }
};

export default RatingService;