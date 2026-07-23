import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '@/backend/database/db';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🧪 Debugging dashboard stats queries...');
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    console.log('1. Orders query today...');
    const ordersToday = await db.order.findMany({
      where: {
        createdAt: { gte: startOfToday },
        orderStatus: { not: 'canceled' }
      },
      select: { total: true }
    });
    console.log('Orders today count:', ordersToday.length);

    console.log('2. Orders query week...');
    const ordersWeek = await db.order.findMany({
      where: {
        createdAt: { gte: startOfWeek },
        orderStatus: { not: 'canceled' }
      },
      select: { total: true }
    });
    console.log('Orders week count:', ordersWeek.length);

    console.log('3. Orders query month...');
    const ordersMonth = await db.order.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        orderStatus: { not: 'canceled' }
      },
      select: { total: true }
    });
    console.log('Orders month count:', ordersMonth.length);

    console.log('4. Paid orders...');
    const paidOrders = await db.order.findMany({
      where: {
        OR: [
          { paymentStatus: 'paid' },
          { orderStatus: 'paid' },
          { orderStatus: 'shipped' }
        ]
      },
      select: {
        total: true,
        totalCost: true,
        shippingCost: true
      }
    });
    console.log('Paid orders count:', paidOrders.length);

    console.log('5. Status counts...');
    const statusCounts = await db.order.groupBy({
      by: ['orderStatus'],
      _count: true
    });
    console.log('Status counts:', statusCounts);

    console.log('6. Distinct emails...');
    const distinctEmails = await db.order.findMany({
      distinct: ['email'],
      select: { email: true }
    });
    console.log('Distinct emails count:', distinctEmails.length);

    console.log('7. VIP Customers...');
    const customerSpending = await db.order.groupBy({
      by: ['email'],
      where: {
        OR: [
          { paymentStatus: 'paid' },
          { orderStatus: 'paid' },
          { orderStatus: 'shipped' }
        ]
      },
      _sum: {
        total: true
      }
    });
    console.log('Customer spending count:', customerSpending.length);

    console.log('8. Incidents...');
    const pendingIncidentsEmails = await db.supportTicket.findMany({
      where: { status: { in: ['open', 'pending'] } },
      distinct: ['customerEmail'],
      select: { customerEmail: true }
    });
    console.log('Pending incidents count:', pendingIncidentsEmails.length);

    console.log('9. Waitlist...');
    const waitlistCount = await db.dropWaitlist.count();
    console.log('Waitlist count:', waitlistCount);

    console.log('10. Next Drop...');
    const nextDrop = await db.drop.findFirst({
      where: {
        status: { in: ['planning', 'active'] }
      },
      orderBy: { openingAt: 'asc' },
      include: {
        products: { select: { id: true, name: true, priceEUR: true } },
        _count: { select: { waitlist: true } }
      }
    });
    console.log('Next Drop:', nextDrop ? nextDrop.name : 'None');

    console.log('11. Recent Order Events...');
    const recentOrderEvents = await db.orderEvent.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { orderNumber: true } } }
    });
    console.log('Recent order events count:', recentOrderEvents.length);

    console.log('12. Recent Tickets...');
    const recentTickets = await db.supportTicket.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Recent tickets count:', recentTickets.length);

    console.log('13. Recent Waitlist...');
    const recentWaitlist = await db.dropWaitlist.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { drop: { select: { name: true } } }
    });
    console.log('Recent waitlist count:', recentWaitlist.length);

    console.log('14. Recent Notifications...');
    const recentNotifications = await db.notification.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Recent notifications count:', recentNotifications.length);

    console.log('✅ All queries completed successfully without errors!');
  } catch (err: any) {
    console.error('❌ Query execution failed:', err);
  }
}

main().catch(console.error);
