// src/config/seed.js

import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';
import FinancialRecord from '../models/FinancialRecord.js';

// ── Users to seed ─────────────────────────────────────────────
const users = [
  { name: 'Super Admin',   email: 'admin@finance.com', password: 'Admin@123', role: 'admin'   },
  { name: 'Alice Analyst', email: 'alice@finance.com', password: 'Alice@123', role: 'analyst' },
  { name: 'Bob Viewer',    email: 'bob@finance.com',   password: 'Bob@123',   role: 'viewer'  },
];

// ── Categories ────────────────────────────────────────────────
const categories = {
  income:  ['Salary', 'Freelance', 'Investment', 'Rental Income', 'Bonus', 'Refund'],
  expense: ['Rent', 'Groceries', 'Utilities', 'Transport', 'Healthcare', 'Entertainment', 'Office Supplies', 'Marketing'],
};

const amountMap = {
  Rent:              [1200, 1500],
  Groceries:         [80,   250],
  Utilities:         [60,   150],
  Transport:         [30,   120],
  Healthcare:        [50,   400],
  Entertainment:     [20,   150],
  'Office Supplies': [15,   200],
  Marketing:         [100,  800],
};

// ── Helpers ───────────────────────────────────────────────────
function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomDate(startMonthsAgo, endMonthsAgo = 0) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - startMonthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - endMonthsAgo + 1, 0);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main seed function ────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // ── Wipe existing data ─────────────────────────────────────
    await FinancialRecord.deleteMany({});
    await User.deleteMany({});
    console.log('🧹 Cleared existing data\n');

    // ── Insert Users ───────────────────────────────────────────
    const createdUsers = [];

    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const user = await User.create({
        name:     u.name,
        email:    u.email,
        password: hashedPassword,
        role:     u.role,
        status:   'active',
      });
      createdUsers.push(user);
      console.log(`👤 Created [${u.role.padEnd(8)}] → ${u.email}`);
    }

    // All records will be linked to admin user
    const adminUser = createdUsers[0];

    // ── Build Financial Records (12 months of data) ────────────
    const records = [];

    for (let m = 11; m >= 0; m--) {
      // Fixed monthly salary + freelance income
      records.push({
        userId:   adminUser._id,
        amount:   randomBetween(4500, 5500),
        type:     'income',
        category: 'Salary',
        date:     randomDate(m + 1, m),
        notes:    `Monthly salary — month ${12 - m}`,
      });

      records.push({
        userId:   adminUser._id,
        amount:   randomBetween(200, 800),
        type:     'income',
        category: 'Freelance',
        date:     randomDate(m + 1, m),
        notes:    'Freelance project payment',
      });

      // Random expenses for the month
      const numExpenses = Math.floor(randomBetween(8, 18));
      for (let i = 0; i < numExpenses; i++) {
        const cat      = pick(categories.expense);
        const [lo, hi] = amountMap[cat] || [50, 300];
        records.push({
          userId:   adminUser._id,
          amount:   randomBetween(lo, hi),
          type:     'expense',
          category: cat,
          date:     randomDate(m + 1, m),
          notes:    `${cat} expense`,
        });
      }

      // Occasional extra income (50% chance)
      if (Math.random() > 0.5) {
        records.push({
          userId:   adminUser._id,
          amount:   randomBetween(100, 1000),
          type:     'income',
          category: pick(['Investment', 'Bonus', 'Refund', 'Rental Income']),
          date:     randomDate(m + 1, m),
          notes:    'Additional income',
        });
      }
    }

    // Shuffle for realistic ordering
    records.sort(() => Math.random() - 0.5);

    // Bulk insert all records at once (faster than one-by-one)
    await FinancialRecord.insertMany(records);

    // ── Summary ────────────────────────────────────────────────
    console.log('\n✅ Seed complete!');
    console.log(`   Users:   ${createdUsers.length}`);
    console.log(`   Records: ${records.length}`);
    console.log('\n📋 Login credentials:');
    users.forEach(u =>
      console.log(`   ${u.role.padEnd(8)} → ${u.email.padEnd(22)} / ${u.password}`)
    );

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();