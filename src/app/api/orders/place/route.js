import { POST as placeOrderPost } from '@/app/api/orders/route';

export async function POST(request) {
  return placeOrderPost(request);
}

