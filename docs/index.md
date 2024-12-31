# Inquire Documentation

---
layout: home
hero:
  name: Inquire
  text: Type-safe SQL query builder
  tagline: Build powerful database queries with full TypeScript support
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/stackpress/inquire
features:
  - icon: 🔒
    title: Type Safety
    details: Full TypeScript support with type inference for your database schema
  - icon: 🔌
    title: Multiple Databases
    details: Support for PostgreSQL, MySQL, SQLite, and CockroachDB
  - icon: 🎯
    title: Zero Dependencies
    details: Lightweight core with modular database adapters
  - icon: 📦
    title: Modern Architecture
    details: Built with TypeScript and modern JavaScript practices
---

## Overview

Inquire is a powerful, type-safe SQL query builder for TypeScript/JavaScript that supports multiple database engines. It provides a clean, intuitive API for building and executing SQL queries while maintaining full type safety.

## Quick Example

```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

// Create a database connection
const db = createInquire({
  adapter: new PostgresAdapter({
    host: 'localhost',
    database: 'myapp'
  })
});

// Type-safe query building
const users = await db
  .select<User>()
  .from('users')
  .where('active', '=', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .execute();
```

## Getting Started

Ready to get started? Check out our [Installation Guide](/guide/installation) or dive into the [Quick Start](/guide/quick-start) tutorial.
