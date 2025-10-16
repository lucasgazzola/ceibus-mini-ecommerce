import { Order, OrderItem, Product, User } from '@prisma/client'

/**
 * FakePrismaService tipado (in-memory) - implementación mínima usada por tests E2E.
 */
export class FakePrismaService {
  users = new Map<string, User>()
  products = new Map<string, Product>()
  orders = new Map<string, Order & { items: OrderItem[] }>()
  orderItems = new Map<string, OrderItem>()

  async $connect() {}
  async $disconnect() {}
  async $transaction(
    fn: (tx: FakePrismaService) => Promise<unknown> | unknown
  ) {
    return fn(this)
  }

  // Users
  async user_findUnique({ where }: { where: { id?: string; email?: string } }) {
    if (where.id) return this.users.get(where.id) || null
    if (where.email)
      return [...this.users.values()].find(u => u.email === where.email) || null
    return null
  }

  async user_create({ data }: { data: Omit<User, 'id'> }) {
    const id = 'user_' + (this.users.size + 1)
    const user: User = { id, ...data }
    this.users.set(id, user)
    return user
  }

  get user() {
    return {
      findUnique: async ({
        where,
      }: {
        where: { id?: string; email?: string }
      }) => this.user_findUnique({ where }),
      create: async ({ data }: { data: Omit<User, 'id'> }) =>
        this.user_create({ data }),
    }
  }

  // Products
  async product_create({
    data,
  }: {
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  }) {
    const id = 'prod_' + (this.products.size + 1)
    const product: Product = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.products.set(id, product)
    return product
  }

  async product_findMany({ where }: { where?: any }) {
    let items = [...this.products.values()]
    if (!where) return items

    // support Prisma-like filters used in repository: { id: { in: [...] } }
    if (where.id && where.id.in) {
      items = items.filter(p => where.id.in.includes(p.id))
    }

    if (where.name && where.name.contains) {
      items = items.filter(p => p.name.includes(where.name.contains))
    }

    if (where.isActive !== undefined) {
      items = items.filter(p => p.isActive === where.isActive)
    }

    return items
  }

  async product_findUnique({ where }: { where: { id: string } }) {
    return this.products.get(where.id) || null
  }

  async product_update({
    where,
    data,
  }: {
    where: { id: string }
    data: Partial<Product>
  }) {
    const p = this.products.get(where.id)
    if (!p) throw new Error('Product not found')
    const updated: Product = { ...p, ...data, updatedAt: new Date() }
    this.products.set(where.id, updated)
    return updated
  }

  get product() {
    return {
      create: async (opts: {
        data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
      }) => this.product_create(opts),
      findMany: async (opts: {
        where?: { name?: { contains?: string }; isActive?: boolean }
      }) => this.product_findMany(opts),
      findUnique: async (opts: { where: { id: string } }) =>
        this.product_findUnique(opts),
      update: async (opts: { where: { id: string }; data: Partial<Product> }) =>
        this.product_update(opts),
    }
  }

  // Orders
  async order_create({
    data,
  }: {
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'items'> & {
      userId: string
    }
  }) {
    const id = 'order_' + (this.orders.size + 1)
    const order: Order & { items: OrderItem[] } = {
      id,
      ...data,
      status: data.status ?? 'PENDING',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.orders.set(id, order)
    return order
  }

  async order_findMany({
    where,
    include,
  }: {
    where?: { userId?: string; status?: string }
    include?: { items?: boolean }
  }) {
    const items = [...this.orders.values()]
    return items
      .filter(o => {
        if (where?.userId && o.userId !== where.userId) return false
        if (where?.status && o.status !== where.status) return false
        return true
      })
      .map(o => ({ ...o, items: include?.items ? o.items || [] : undefined }))
  }

  async order_findUnique({
    where,
    include,
  }: {
    where: { id: string }
    include?: { items?: boolean }
  }) {
    const o = this.orders.get(where.id)
    if (!o) return null
    return { ...o, items: include?.items ? o.items || [] : undefined }
  }

  get order() {
    return {
      create: async (opts: {
        data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'items'> & {
          userId: string
        }
      }) => this.order_create(opts),
      findMany: async (opts: {
        where?: { userId?: string; status?: string }
        include?: { items?: boolean }
      }) => this.order_findMany(opts),
      findUnique: async (opts: {
        where: { id: string }
        include?: { items?: boolean }
      }) => this.order_findUnique(opts),
      update: async ({
        where,
        data,
      }: {
        where: { id: string }
        data: Partial<Order>
      }) => {
        const o = this.orders.get(where.id)
        const updated = { ...o, ...data }
        this.orders.set(where.id, updated)
        return updated
      },
    }
  }

  async orderItem_create({ data }: { data: Omit<OrderItem, 'id'> }) {
    const id = 'oi_' + (this.orderItems.size + 1)
    const item: OrderItem = { id, ...data }
    this.orderItems.set(id, item)
    const order = this.orders.get(data.orderId)
    order.items = order.items || []
    order.items.push(item)
    return item
  }

  get orderItem() {
    return {
      create: async (opts: { data: Omit<OrderItem, 'id'> }) =>
        this.orderItem_create(opts),
    }
  }
}

export default FakePrismaService
