import { PUT as updateOrderStatusPut } from '@/app/api/orders/[id]/route';

export async function PUT(request, context) {
  return updateOrderStatusPut(request, context);
}

export async function PATCH(request, context) {
  return updateOrderStatusPut(request, context);
}

