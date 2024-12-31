# Inquire

A powerful, type-safe SQL query builder for TypeScript/JavaScript that 
supports multiple database engines.

[![npm version](https://badge.fury.io/js/@stackpress%2Finquire.svg)]
(https://badge.fury.io/js/@stackpress%2Finquire)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)]
(https://opensource.org/licenses/Apache-2.0)

## Features

- 🔒 Type-safe SQL query building
- 🔌 Multiple database engine support (PostgreSQL, MySQL, SQLite3)
- 🎯 Zero runtime dependencies
- 📦 Modular design with separate packages for each database engine
- 💪 Strong TypeScript support

## Installation

```bash
# Install core package
npm install @stackpress/inquire

# Install database-specific package
npm install @stackpress/inquire-pg     # for PostgreSQL
npm install @stackpress/inquire-mysql2 # for MySQL
npm install @stackpress/inquire-sqlite3 # for SQLite3
```

## Quick Start

```typescript
import { createInquire } from '@stackpress/inquire';
import { PostgresAdapter } from '@stackpress/inquire-pg';

// Create a database connection
const db = createInquire({
  adapter: new PostgresAdapter({
    // your connection config
  })
});

// Define your table structure
interface User {
  id: number;
  name: string;
  email: string;
}

// Execute type-safe queries
const users = await db
  .select<User>()
  .from('users')
  .where('email', 'like', '%@example.com')
  .execute();
```

## Supported Databases

- PostgreSQL (via `@stackpress/inquire-pg`)
- MySQL (via `@stackpress/inquire-mysql2`)
- SQLite3 (via `@stackpress/inquire-sqlite3`)
- CockroachDB (via PostgreSQL adapter)

## Project Structure

```
inquire/
├── packages/
│   ├── inquire/          # Core package
│   ├── inquire-pg/       # PostgreSQL adapter
│   ├── inquire-mysql2/   # MySQL adapter
│   ├── inquire-sqlite3/  # SQLite3 adapter
│   └── inquire-pglite/   # Lightweight PostgreSQL adapter
└── examples/             # Usage examples
```

## Documentation

Visit our [documentation website](./docs) 
for detailed guides and API reference:

- [Getting Started](./docs/guide/index.md)
- [Installation Guide](./docs/guide/installation.md)
- [API Reference](./docs/api/index.md)
- [Database Adapters](./docs/adapters)
- [Advanced Topics](./docs/advanced)

## Examples

Check out the `examples` directory for complete working examples 
with different database engines.

## Contributing

We welcome contributions! Please see our [Contributing Guide]
(CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache License 2.0 - 
see the [LICENSE](LICENSE) file for details.

## Support

- Report issues on [GitHub Issues]
  (https://github.com/stackpress/inquire/issues)
- For questions and discussions, use [GitHub Discussions]
  (https://github.com/stackpress/inquire/discussions)

## Acknowledgments

Special thanks to all contributors who have helped make this project possible.
